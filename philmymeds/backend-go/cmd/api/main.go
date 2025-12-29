package main

import (
	"log"
	"net/http"
	"os"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/handlers"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/router"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	// Step 1: Load environment variables from .env file
	envPath := "../.env"
	if err := godotenv.Load(envPath); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Step 2: Connect to MongoDB database
	if err := database.ConnectMongoDB(); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer database.DisconnectMongoDB()

	// Step 3: Initialize dependencies (Repository → Service → Handler)
	patientRepo := repositories.NewPatientRepository()
	patientService := services.NewPatientService(patientRepo)
	patientHandler := handlers.NewPatientHandler(patientService)

	prescriberRepo := repositories.NewPrescriberRepository()
	prescriberService := services.NewPrescriberService(prescriberRepo)
	prescriberHandler := handlers.NewPrescriberHandler(prescriberService)

	prescriptionRepo := repositories.NewPrescriptionRepository()
	prescriptionService := services.NewPrescriptionService(
		prescriptionRepo,
		patientRepo,
		prescriberRepo,
	)

	insuranceRepo := repositories.NewInsuranceRepository()
	insuranceService := services.NewInsuranceService(insuranceRepo)

	geminiService := services.NewGeminiService()

	prescriptionHandler := handlers.NewPrescriptionHandler(
		prescriptionService,
		patientService,
		prescriberService,
		insuranceService,
		geminiService,
	)

	// Step 4: Setup router with all API routes
	r := router.SetupRouter(patientHandler, prescriptionHandler, prescriberHandler)

	// Step 5: Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Changed from 8080 to avoid conflicts
	}

	// Step 6: Start the HTTP server
	log.Printf("🚀 Server running on port %s", port)
	log.Printf("📚 API available at: http://localhost:%s/api/v1", port)
	log.Printf("💚 Health check: http://localhost:%s/health", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
