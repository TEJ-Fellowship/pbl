package handlers

import (
	"encoding/json"
	"log"
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
	log.Println("🔵 [HANDLER] GetAllPrescribers - Request received")

	prescribers, err := h.service.GetAllPrescribers(r.Context())
	if err != nil {
		log.Printf("🔴 [HANDLER] GetAllPrescribers - Service error: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Failed to get prescribers", err)
		return
	}

	log.Printf("🟢 [HANDLER] GetAllPrescribers - Success! Found %d prescribers", len(prescribers))
	RespondWithJSON(w, http.StatusOK, prescribers)
}

// CreatePrescriber handles POST /api/v1/prescribers
func (h *PrescriberHandler) CreatePrescriber(w http.ResponseWriter, r *http.Request) {
	log.Println("🔵 [HANDLER] CreatePrescriber - Request received")

	var prescriberDTO dto.PrescriberDTO

	log.Println("🔵 [HANDLER] CreatePrescriber - Decoding request body...")
	if err := json.NewDecoder(r.Body).Decode(&prescriberDTO); err != nil {
		log.Printf("🔴 [HANDLER] CreatePrescriber - Error decoding: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}
	log.Printf("🔵 [HANDLER] CreatePrescriber - Decoded DTO: NPI=%s, Name=%s %s", 
		prescriberDTO.NPI, prescriberDTO.FirstName, prescriberDTO.LastName)

	log.Println("🔵 [HANDLER] CreatePrescriber - Calling service layer...")
	created, err := h.service.CreatePrescriber(r.Context(), &prescriberDTO)
	if err != nil {
		log.Printf("🔴 [HANDLER] CreatePrescriber - Service error: %v", err)
		if err == services.ErrPrescriberAlreadyExists {
			RespondWithError(w, http.StatusConflict, "Prescriber already exists", err)
			return
		}
		RespondWithError(w, http.StatusInternalServerError, "Failed to create prescriber", err)
		return
	}

	log.Printf("🟢 [HANDLER] CreatePrescriber - Success! Created prescriber ID: %s", created.ID)
	RespondWithJSON(w, http.StatusCreated, created)
}

// GetPrescriber handles GET /api/v1/prescribers/{id}
func (h *PrescriberHandler) GetPrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("🔵 [HANDLER] GetPrescriber - Request received for ID: %s", id)

	log.Println("🔵 [HANDLER] GetPrescriber - Calling service layer...")
	prescriber, err := h.service.GetPrescriberByID(r.Context(), id)
	if err != nil {
		log.Printf("🔴 [HANDLER] GetPrescriber - Service error: %v", err)
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

	log.Printf("🟢 [HANDLER] GetPrescriber - Success! Found prescriber ID: %s", prescriber.ID)
	RespondWithJSON(w, http.StatusOK, prescriber)
}

// UpdatePrescriber handles PUT /api/v1/prescribers/{id}
func (h *PrescriberHandler) UpdatePrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("🔵 [HANDLER] UpdatePrescriber - Request received for ID: %s", id)

	var prescriberDTO dto.PrescriberDTO
	if err := json.NewDecoder(r.Body).Decode(&prescriberDTO); err != nil {
		log.Printf("🔴 [HANDLER] UpdatePrescriber - Error decoding: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	updated, err := h.service.UpdatePrescriber(r.Context(), id, &prescriberDTO)
	if err != nil {
		log.Printf("🔴 [HANDLER] UpdatePrescriber - Service error: %v", err)
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

	log.Printf("🟢 [HANDLER] UpdatePrescriber - Success! Updated prescriber ID: %s", updated.ID)
	RespondWithJSON(w, http.StatusOK, updated)
}

// DeletePrescriber handles DELETE /api/v1/prescribers/{id}
func (h *PrescriberHandler) DeletePrescriber(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	log.Printf("🔵 [HANDLER] DeletePrescriber - Request received for ID: %s", id)

	err := h.service.DeletePrescriber(r.Context(), id)
	if err != nil {
		log.Printf("🔴 [HANDLER] DeletePrescriber - Service error: %v", err)
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

	log.Printf("🟢 [HANDLER] DeletePrescriber - Success! Deleted prescriber ID: %s", id)
	RespondWithJSON(w, http.StatusNoContent, nil)
}

