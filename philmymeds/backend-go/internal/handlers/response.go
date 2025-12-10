package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// RespondWithJSON sends a JSON response
func RespondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if payload != nil {
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			log.Printf("Error encoding JSON response: %v", err)
		}
	}
}

// RespondWithError sends an error JSON response
func RespondWithError(w http.ResponseWriter, statusCode int, message string, err error) {
	errorResponse := ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
	}

	if err != nil {
		errorResponse.Details = err.Error()
		log.Printf("Error: %s - %v", message, err)
	}

	RespondWithJSON(w, statusCode, errorResponse)
}
