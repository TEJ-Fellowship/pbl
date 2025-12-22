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
	service *services.PrescriptionService
}

// NewPrescriptionHandler creates a new prescription handler
func NewPrescriptionHandler(service *services.PrescriptionService) *PrescriptionHandler {
	return &PrescriptionHandler{service: service}
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
func (h *PrescriptionHandler) CreatePrescription(w http.ResponseWriter, r *http.Request) {
	log.Println("🔵 [HANDLER] CreatePrescription - Request received")

	var prescriptionDTO dto.PrescriptionDTO

	log.Println("🔵 [HANDLER] CreatePrescription - Decoding request body...")
	if err := json.NewDecoder(r.Body).Decode(&prescriptionDTO); err != nil {
		log.Printf("🔴 [HANDLER] CreatePrescription - Error decoding: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}
	log.Printf("🔵 [HANDLER] CreatePrescription - Decoded DTO: PatientID=%s, PrescriberID=%s, PrescriptionNumber=%s",
		prescriptionDTO.PatientID, prescriptionDTO.PrescriberID, prescriptionDTO.PrescriptionNumber)

	log.Println("🔵 [HANDLER] CreatePrescription - Calling service layer...")
	created, err := h.service.CreatePrescription(r.Context(), &prescriptionDTO)
	if err != nil {
		log.Printf("🔴 [HANDLER] CreatePrescription - Service error: %v", err)
		if err == services.ErrPrescriptionAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Prescription already exists", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create prescription", err)
		return
	}

	log.Printf("🟢 [HANDLER] CreatePrescription - Success! Created prescription ID: %s", created.ID)
	RespondWithJSON(w, http.StatusCreated, created)
}

// GetPrescription handles GET /api/v1/prescriptions/{id}
func (h *PrescriptionHandler) GetPrescription(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("🔵 [HANDLER] GetPrescription - Request received for ID: %s", id)

	log.Println("🔵 [HANDLER] GetPrescription - Calling service layer...")
	prescription, err := h.service.GetPrescriptionByID(r.Context(), id)
	if err != nil {
		log.Printf("🔴 [HANDLER] GetPrescription - Service error: %v", err)
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

	log.Printf("🟢 [HANDLER] GetPrescription - Success! Found prescription ID: %s", prescription.ID)
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

	var prescriptionDTO dto.PrescriptionDTO
	if err := json.NewDecoder(r.Body).Decode(&prescriptionDTO); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	updated, err := h.service.UpdatePrescription(r.Context(), id, &prescriptionDTO)
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
