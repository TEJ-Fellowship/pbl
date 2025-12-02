package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pharmonico/backend-go/internal/config"
	"github.com/pharmonico/backend-go/internal/database"
	"github.com/pharmonico/backend-go/internal/middleware"
)

// Handler holds all dependencies for HTTP handlers
type Handler struct {
	mongoDB    *database.MongoDB
	postgresDB *database.PostgresDB
	config     *config.Config
}

// NewRouter creates and configures the HTTP router
func NewRouter(mongoDB *database.MongoDB, postgresDB *database.PostgresDB, cfg *config.Config) http.Handler {
	h := &Handler{
		mongoDB:    mongoDB,
		postgresDB: postgresDB,
		config:     cfg,
	}

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /health", h.healthCheck)

	// API routes
	mux.HandleFunc("POST /api/intake", h.handleIntake)

	// Enrollment routes
	mux.HandleFunc("POST /api/enrollment/start", h.startEnrollment)
	mux.HandleFunc("GET /api/enrollment/{token}", h.getEnrollment)
	mux.HandleFunc("POST /api/enrollment/{token}/complete", h.completeEnrollment)

	// Pharmacy routes
	mux.HandleFunc("GET /api/pharmacies", h.listPharmacies)
	mux.HandleFunc("GET /api/prescriptions/{id}/pharmacy-recommendations", h.getPharmacyRecommendations)
	mux.HandleFunc("POST /api/prescriptions/{id}/select-pharmacy", h.selectPharmacy)

	// Payment routes
	mux.HandleFunc("POST /api/payments/create-link", h.createPaymentLink)
	mux.HandleFunc("POST /webhook/stripe", h.handleStripeWebhook)

	// Prescription routes
	mux.HandleFunc("GET /api/prescriptions", h.listPrescriptions)
	mux.HandleFunc("GET /api/prescriptions/{id}", h.getPrescription)

	// Audit routes
	mux.HandleFunc("GET /api/audit-logs", h.listAuditLogs)

	// Metrics endpoint
	mux.HandleFunc("GET /metrics", h.metrics)

	// Apply middleware
	handler := middleware.CORS(mux)
	handler = middleware.Logging(handler)
	handler = middleware.Recovery(handler)

	return handler
}

func (h *Handler) healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

// Placeholder handlers - to be implemented in Sprint 1+

func (h *Handler) handleIntake(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) startEnrollment(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) getEnrollment(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) completeEnrollment(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) listPharmacies(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) getPharmacyRecommendations(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) selectPharmacy(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) createPaymentLink(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) listPrescriptions(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) getPrescription(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) listAuditLogs(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusNotImplemented, map[string]string{"message": "Not implemented yet"})
}

func (h *Handler) metrics(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "metrics placeholder"})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

