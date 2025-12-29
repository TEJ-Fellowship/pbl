package router

import (
	"net/http"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/handlers"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/middleware"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// SetupRouter configures and returns the chi router with all routes
func SetupRouter(patientHandler *handlers.PatientHandler, prescriptionHandler *handlers.PrescriptionHandler, prescriberHandler *handlers.PrescriberHandler) *chi.Mux {
	r := chi.NewRouter()

	// Essential Middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.RequestLogger) // Custom request/payload logger
	r.Use(chimiddleware.Logger)     // Chi's request logger
	r.Use(chimiddleware.Recoverer)  // Recover from panics

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK - MongoDB connected"))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {

		// Patient routes
		r.Route("/patients", func(r chi.Router) {
			r.Post("/", patientHandler.CreatePatient)
			r.Get("/{id}", patientHandler.GetPatient)
			r.Get("/email/{email}", patientHandler.GetPatientByEmail)
			r.Put("/{id}", patientHandler.UpdatePatient)
			r.Delete("/{id}", patientHandler.DeletePatient)
		})

		// Prescription routes
		r.Route("/prescriptions", func(r chi.Router) {
			r.Get("/", prescriptionHandler.GetAllPrescriptions)
			r.Post("/", prescriptionHandler.CreatePrescription)
			r.Post("/generate", prescriptionHandler.GeneratePrescriptionFromGemini) // Gemini API endpoint
			r.Get("/{id}", prescriptionHandler.GetPrescription)
			r.Get("/number/{number}", prescriptionHandler.GetPrescriptionByNumber)
			r.Get("/patient/{patient_id}", prescriptionHandler.GetPrescriptionsByPatient)
			r.Get("/prescriber/{prescriber_id}", prescriptionHandler.GetPrescriptionsByPrescriber)
			r.Put("/{id}", prescriptionHandler.UpdatePrescription)
			r.Delete("/{id}", prescriptionHandler.DeletePrescription)
		})
		r.Route("/prescribers", func(r chi.Router) {
			r.Get("/", prescriberHandler.GetAllPrescribers)
			r.Post("/", prescriberHandler.CreatePrescriber)
			r.Get("/{id}", prescriberHandler.GetPrescriber)
			r.Put("/{id}", prescriberHandler.UpdatePrescriber)
			r.Delete("/{id}", prescriberHandler.DeletePrescriber)
		})
	})

	return r
}
