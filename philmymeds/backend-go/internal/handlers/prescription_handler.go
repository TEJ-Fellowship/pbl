package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/services"
	"github.com/go-chi/chi/v5"
)

// PrescriptionHandler handles HTTP requests for prescriptions
type PrescriptionHandler struct {
	service           *services.PrescriptionService
	patientService    *services.PatientService
	prescriberService *services.PrescriberService
	insuranceService  *services.InsuranceService
	geminiService     *services.GeminiService
}

// NewPrescriptionHandler creates a new prescription handler
func NewPrescriptionHandler(
	service *services.PrescriptionService,
	patientService *services.PatientService,
	prescriberService *services.PrescriberService,
	insuranceService *services.InsuranceService,
	geminiService *services.GeminiService,
) *PrescriptionHandler {
	return &PrescriptionHandler{
		service:           service,
		patientService:    patientService,
		prescriberService: prescriberService,
		insuranceService:  insuranceService,
		geminiService:     geminiService,
	}
}

// GetAllPrescriptions handles GET /api/v1/prescriptions
func (h *PrescriptionHandler) GetAllPrescriptions(w http.ResponseWriter, r *http.Request) {
	prescriptions, err := h.service.GetAllPrescriptions(r.Context())
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescriptions", err)
		return
	}
	RespondWithJSON(w, http.StatusOK, prescriptions)
}

// CreatePrescription handles POST /api/v1/prescriptions
// Supports two formats:
// 1. Simple: Uses existing patient_id and prescriber_id
// 2. Comprehensive: Includes nested patient, prescriber, medication, and insurance (NCPDP-style from Gemini API)
func (h *PrescriptionHandler) CreatePrescription(w http.ResponseWriter, r *http.Request) {
	var req dto.CreatePrescriptionRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	var patientID, prescriberID string

	// Validate request format - must be either simple (IDs) or comprehensive (objects)
	if (req.Patient != nil || req.Prescriber != nil) && (req.PatientID != "" || req.PrescriberID != "") {
		RespondWithError(w, http.StatusBadRequest, "Cannot mix simple format (patient_id/prescriber_id) with comprehensive format (patient/prescriber objects)", nil)
		return
	}

	// Handle comprehensive format (from Gemini API - NCPDP SCRIPT format)
	if req.Patient != nil && req.Prescriber != nil {
		// Create or find patient
		patientDTO := req.Patient.ToDTO()
		patient, err := h.patientService.CreateOrGetPatient(r.Context(), patientDTO)
		if err != nil {
			if err == services.ErrPatientAlreadyExists {
				// This shouldn't happen with CreateOrGet, but handle it
				RespondWithError(w, http.StatusConflict, "Patient already exists", err)
				return
			}
			RespondWithError(w, http.StatusInternalServerError, "Failed to process patient", err)
			return
		}
		patientID = patient.ID

		// Create or find prescriber (by NPI)
		prescriberDTO := req.Prescriber.ToDTO()
		prescriber, err := h.prescriberService.CreateOrGetPrescriber(r.Context(), prescriberDTO)
		if err != nil {
			if err == services.ErrPrescriberAlreadyExists {
				// This shouldn't happen with CreateOrGet, but handle it
				RespondWithError(w, http.StatusConflict, "Prescriber already exists", err)
				return
			}
			// Check if it's an NPI validation error
			errMsg := err.Error()
			if errMsg != "" && (len(errMsg) > 3 && errMsg[:3] == "NPI" || len(errMsg) > 3 && errMsg[:3] == "npi" || len(errMsg) > 10 && errMsg[:10] == "NPI must be") {
				RespondWithError(w, http.StatusBadRequest, "Invalid prescriber NPI format", err)
				return
			}
			RespondWithError(w, http.StatusInternalServerError, "Failed to process prescriber", err)
			return
		}
		prescriberID = prescriber.ID

		// Create insurance profile if provided
		if req.Insurance != nil {
			_, err := h.insuranceService.CreateInsuranceProfile(r.Context(), patientID, req.Insurance)
			if err != nil {
				// Log error but don't fail prescription creation
				// Insurance can be added later during enrollment
			}
			// Note: Insurance profile linking to patient happens during enrollment stage
		}
	} else {
		// Simple format: Use provided IDs (validation happens in service layer)
		if req.PatientID == "" || req.PrescriberID == "" {
			RespondWithError(w, http.StatusBadRequest, "Either patient/prescriber objects or patient_id/prescriber_id must be provided", nil)
			return
		}
		patientID = req.PatientID
		prescriberID = req.PrescriberID
	}

	// Create prescription with resolved IDs
	prescriptionDTO := &dto.PrescriptionDTO{
		PatientID:    patientID,
		PrescriberID: prescriberID,
		Medication:   req.Medication,
		Notes:        req.Notes,
	}

	// Set prescription number if provided
	if req.PrescriptionNumber != "" {
		prescriptionDTO.PrescriptionNumber = req.PrescriptionNumber
	}

	created, err := h.service.CreatePrescription(r.Context(), prescriptionDTO)
	if err != nil {
		// Handle validation errors (synchronous validation failures)
		if validationErr, ok := err.(*services.ValidationError); ok {
			RespondWithJSON(w, http.StatusBadRequest, validationErr)
			return
		}
		if err == services.ErrPrescriptionAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Prescription already exists", err)
			return
		}
		if err == services.ErrPatientNotFound {
			RespondWithError(w, http.StatusNotFound, "Patient not found", err)
			return
		}
		if err == services.ErrPrescriberNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescriber not found", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusCreated, created)
}

// GetPrescription handles GET /api/v1/prescriptions/{id}
func (h *PrescriptionHandler) GetPrescription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	prescription, err := h.service.GetPrescriptionByID(r.Context(), id)
	if err != nil {
		if err == services.ErrPrescriptionNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescription not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescription ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescription)
}

// GetPrescriptionByNumber handles GET /api/v1/prescriptions/number/{number}
func (h *PrescriptionHandler) GetPrescriptionByNumber(w http.ResponseWriter, r *http.Request) {
	prescriptionNumber := chi.URLParam(r, "number")

	prescription, err := h.service.GetPrescriptionByPrescriptionNumber(r.Context(), prescriptionNumber)
	if err != nil {
		if err == services.ErrPrescriptionNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescription not found", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescription)
}

// GetPrescriptionsByPatient handles GET /api/v1/prescriptions/patient/{patient_id}
func (h *PrescriptionHandler) GetPrescriptionsByPatient(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "patient_id")

	prescriptions, err := h.service.GetPrescriptionsByPatientID(r.Context(), patientID)
	if err != nil {
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid patient ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescriptions", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescriptions)
}

// GetPrescriptionsByPrescriber handles GET /api/v1/prescriptions/prescriber/{prescriber_id}
func (h *PrescriptionHandler) GetPrescriptionsByPrescriber(w http.ResponseWriter, r *http.Request) {
	prescriberID := chi.URLParam(r, "prescriber_id")

	prescriptions, err := h.service.GetPrescriptionsByPrescriberID(r.Context(), prescriberID)
	if err != nil {
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescriber ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescriptions", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescriptions)
}

// UpdatePrescription handles PUT /api/v1/prescriptions/{id}
func (h *PrescriptionHandler) UpdatePrescription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req dto.UpdatePrescriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	// Convert request DTO to service DTO
	prescriptionDTO := req.ToDTO()

	updated, err := h.service.UpdatePrescription(r.Context(), id, prescriptionDTO)
	if err != nil {
		if err == services.ErrPrescriptionNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescription not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescription ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to update prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, updated)
}

// DeletePrescription handles DELETE /api/v1/prescriptions/{id}
func (h *PrescriptionHandler) DeletePrescription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.service.DeletePrescription(r.Context(), id)
	if err != nil {
		if err == services.ErrPrescriptionNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescription not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescription ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusNoContent, nil)
}

// GeneratePrescriptionFromGemini handles POST /api/v1/prescriptions/generate
// Generates a mock prescription using Gemini API in NCPDP SCRIPT format and creates it
func (h *PrescriptionHandler) GeneratePrescriptionFromGemini(w http.ResponseWriter, r *http.Request) {
	log.Println("[DEBUG] GeneratePrescriptionFromGemini: Request received")

	// Generate mock prescription using Gemini
	prescriptionReq, err := h.geminiService.GenerateMockPrescription(r.Context())
	if err != nil {
		log.Printf("[ERROR] Gemini API failed: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to generate prescription from Gemini", err)
		return
	}

	// Process the generated prescription request (same logic as CreatePrescription)
	var patientID, prescriberID string

	// Handle comprehensive format (from Gemini API - NCPDP SCRIPT format)
	if prescriptionReq.Patient != nil && prescriptionReq.Prescriber != nil {
		// Create or find patient
		patientDTO := prescriptionReq.Patient.ToDTO()
		patient, err := h.patientService.CreateOrGetPatient(r.Context(), patientDTO)
		if err != nil {
			if err == services.ErrPatientAlreadyExists {
				RespondWithError(w, http.StatusConflict, "Patient already exists", err)
				return
			}
			RespondWithError(w, http.StatusInternalServerError, "Failed to process patient", err)
			return
		}
		patientID = patient.ID
		log.Printf("[DEBUG] Patient processed - ID: %s", patientID)

		// Create or find prescriber (by NPI)
		prescriberDTO := prescriptionReq.Prescriber.ToDTO()
		prescriber, err := h.prescriberService.CreateOrGetPrescriber(r.Context(), prescriberDTO)
		if err != nil {
			if err == services.ErrPrescriberAlreadyExists {
				RespondWithError(w, http.StatusConflict, "Prescriber already exists", err)
				return
			}
			// Check if it's an NPI validation error
			errMsg := err.Error()
			if errMsg != "" && (len(errMsg) > 3 && errMsg[:3] == "NPI" || len(errMsg) > 3 && errMsg[:3] == "npi" || len(errMsg) > 10 && errMsg[:10] == "NPI must be") {
				RespondWithError(w, http.StatusBadRequest, "Invalid prescriber NPI format", err)
				return
			}
			RespondWithError(w, http.StatusInternalServerError, "Failed to process prescriber", err)
			return
		}
		prescriberID = prescriber.ID
		log.Printf("[DEBUG] Prescriber processed - ID: %s", prescriberID)

		// Create insurance profile if provided
		if prescriptionReq.Insurance != nil {
			_, err := h.insuranceService.CreateInsuranceProfile(r.Context(), patientID, prescriptionReq.Insurance)
			if err != nil {
				// Log error but don't fail prescription creation
				// Insurance can be added later during enrollment
			}
		}
	} else {
		RespondWithError(w, http.StatusBadRequest, "Gemini generated invalid prescription format", nil)
		return
	}

	// Create prescription with resolved IDs
	prescriptionDTO := &dto.PrescriptionDTO{
		PatientID:    patientID,
		PrescriberID: prescriberID,
		Medication:   prescriptionReq.Medication,
		Notes:        prescriptionReq.Notes,
	}

	// Set prescription number if provided
	if prescriptionReq.PrescriptionNumber != "" {
		prescriptionDTO.PrescriptionNumber = prescriptionReq.PrescriptionNumber
	}

	created, err := h.service.CreatePrescription(r.Context(), prescriptionDTO)
	if err != nil {
		// Handle validation errors (synchronous validation failures)
		if validationErr, ok := err.(*services.ValidationError); ok {
			RespondWithJSON(w, http.StatusBadRequest, validationErr)
			return
		}
		if err == services.ErrPrescriptionAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Prescription already exists", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create prescription", err)
		return
	}

	RespondWithJSON(w, http.StatusCreated, created)
}
