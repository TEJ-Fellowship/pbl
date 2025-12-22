package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/services"
	"github.com/go-chi/chi/v5"
)

// PrescriberHandler handles HTTP requests for prescribers
type PrescriberHandler struct {
	service *services.PrescriberService
}

// NewPrescriberHandler creates a new prescriber handler
func NewPrescriberHandler(service *services.PrescriberService) *PrescriberHandler {
	return &PrescriberHandler{
		service: service,
	}
}

// GetAllPrescribers handles GET /api/v1/prescribers
func (h *PrescriberHandler) GetAllPrescribers(w http.ResponseWriter, r *http.Request) {
	prescribers, err := h.service.GetAllPrescribers(r.Context())
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescribers", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescribers)
}

// CreatePrescriber handles POST /api/v1/prescribers
func (h *PrescriberHandler) CreatePrescriber(w http.ResponseWriter, r *http.Request) {
	var prescriberDTO dto.PrescriberDTO

	if err := json.NewDecoder(r.Body).Decode(&prescriberDTO); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	created, err := h.service.CreatePrescriber(r.Context(), &prescriberDTO)
	if err != nil {
		if err == services.ErrPrescriberAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Prescriber already exists", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create prescriber", err)
		return
	}

	RespondWithJSON(w, http.StatusCreated, created)
}

// GetPrescriber handles GET /api/v1/prescribers/{id}
func (h *PrescriberHandler) GetPrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	prescriber, err := h.service.GetPrescriberByID(r.Context(), id)
	if err != nil {
		if err == services.ErrPrescriberNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescriber not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescriber ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescriber", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, prescriber)
}

// UpdatePrescriber handles PUT /api/v1/prescribers/{id}
func (h *PrescriberHandler) UpdatePrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var prescriberDTO dto.PrescriberDTO
	if err := json.NewDecoder(r.Body).Decode(&prescriberDTO); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	updated, err := h.service.UpdatePrescriber(r.Context(), id, &prescriberDTO)
	if err != nil {
		if err == services.ErrPrescriberNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescriber not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescriber ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to update prescriber", err)
		return
	}

	RespondWithJSON(w, http.StatusOK, updated)
}

// DeletePrescriber handles DELETE /api/v1/prescribers/{id}
func (h *PrescriberHandler) DeletePrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.service.DeletePrescriber(r.Context(), id)
	if err != nil {
		if err == services.ErrPrescriberNotFound {
			RespondWithError(w, http.StatusNotFound, "Prescriber not found", err)
			return
		}
		if err == services.ErrInvalidID {
			RespondWithError(w, http.StatusBadRequest, "Invalid prescriber ID", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to delete prescriber", err)
		return
	}

	RespondWithJSON(w, http.StatusNoContent, nil)
}

