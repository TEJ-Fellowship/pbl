package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/services"
	"github.com/go-chi/chi/v5"
)

// PatientHandler handles HTTP requests for patients
type PatientHandler struct {
	service *services.PatientService
}

// NewPatientHandler creates a new patient handler
func NewPatientHandler(service *services.PatientService) *PatientHandler {
	return &PatientHandler{
		service: service,
	}
}

// CreatePatient handles POST /api/v1/patients
func (h *PatientHandler) CreatePatient(w http.ResponseWriter, r *http.Request) {
	var req dto.CreatePatientRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	// Convert request DTO to service DTO
	patientDTO := req.ToDTO()

	created, err := h.service.CreatePatient(r.Context(), patientDTO)
	if err != nil {
		if err == services.ErrPatientAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Patient already exists", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create patient", err)
		return
	}

	RespondWithJSON(w, http.StatusCreated, created)
}

// GetPatient handles GET /api/v1/patients/{id}
func (h *PatientHandler) GetPatient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	patient, err := h.service.GetPatientByID(r.Context(), id)
	if err != nil {
		if err == services.ErrPatientNotFound {
			RespondWithError(w, http.StatusNotFound, "Patient not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid patient ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get patient", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, patient)
}

// GetPatientByEmail handles GET /api/v1/patients/email/{email}
func (h *PatientHandler) GetPatientByEmail(w http.ResponseWriter, r *http.Request) {
	email := chi.URLParam(r, "email")

	patient, err := h.service.GetPatientByEmail(r.Context(), email)
	if err != nil {
		if err == services.ErrPatientNotFound {
			RespondWithError(w, http.StatusNotFound, "Patient not found", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get patient", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, patient)
}

// UpdatePatient handles PUT /api/v1/patients/{id}
func (h *PatientHandler) UpdatePatient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req dto.UpdatePatientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	// Convert request DTO to service DTO
	patientDTO := req.ToDTO()

	updated, err := h.service.UpdatePatient(r.Context(), id, patientDTO)
	if err != nil {
		if err == services.ErrPatientNotFound {
			RespondWithError(w, http.StatusNotFound, "Patient not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid patient ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to update patient", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, updated)
}

// DeletePatient handles DELETE /api/v1/patients/{id}
func (h *PatientHandler) DeletePatient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.service.DeletePatient(r.Context(), id)
	if err != nil {
		if err == services.ErrPatientNotFound {
			RespondWithError(w, http.StatusNotFound, "Patient not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid patient ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete patient", err)
		return
	}

	RespondWithJSON(w, http.StatusNoContent, nil)
}
