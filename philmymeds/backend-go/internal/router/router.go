package router

import (
	"net/http"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/handlers"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/services"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// SetupRouter configures and returns the chi router with all routes
func SetupRouter() *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.URLFormat)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK - MongoDB connected"))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Initialize repositories
		patientRepo := repositories.NewPatientRepository()

		// Initialize services
		patientService := services.NewPatientService(patientRepo)

		// Initialize handlers
		patientHandler := handlers.NewPatientHandler(patientService)

		// Patient routes
		r.Route("/patients", func(r chi.Router) {
			r.Post("/", patientHandler.CreatePatient)
			r.Get("/{id}", patientHandler.GetPatient)
			r.Get("/email/{email}", patientHandler.GetPatientByEmail)
			r.Put("/{id}", patientHandler.UpdatePatient)
			r.Delete("/{id}", patientHandler.DeletePatient)
		})
	})

	return r
}
