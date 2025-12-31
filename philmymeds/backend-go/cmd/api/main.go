package main

import (
	"context"
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

	// Step 2.5: Connect to PostgreSQL database (for job queue)
	if err := database.ConnectPostgres(); err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer database.ClosePostgres()

	// Initialize PostgreSQL schema
	if err := initPostgresSchema(); err != nil {
		log.Fatalf("Failed to initialize PostgreSQL schema: %v", err)
	}

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

// initPostgresSchema creates the validation_jobs table if it doesn't exist
func initPostgresSchema() error {
	schema := `
		CREATE TABLE IF NOT EXISTS validation_jobs (
			id BIGSERIAL PRIMARY KEY,
			job_id VARCHAR(255) UNIQUE NOT NULL,
			prescription_id VARCHAR(255) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			retry_count INTEGER DEFAULT 0,
			max_retries INTEGER DEFAULT 3,
			error_message TEXT,
			locked_at TIMESTAMP,
			locked_by VARCHAR(255),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			completed_at TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_validation_jobs_status ON validation_jobs (status, created_at);
	`

	_, err := database.PostgresPool.Exec(context.Background(), schema)
	if err != nil {
		return err
	}

	log.Println("✅ PostgreSQL schema initialized")
	return nil
}
