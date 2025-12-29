package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/workers"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	envPath := "../.env"
	if err := godotenv.Load(envPath); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to MongoDB
	if err := database.ConnectMongoDB(); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer database.DisconnectMongoDB()

	// Connect to PostgreSQL
	if err := database.ConnectPostgres(); err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer database.ClosePostgres()

	// Initialize database schema
	if err := initSchema(); err != nil {
		log.Fatalf("Failed to initialize schema: %v", err)
	}

	// Initialize repositories
	prescriptionRepo := repositories.NewPrescriptionRepository()

	// Create and start validation worker
	validationWorker := workers.NewValidationWorker(prescriptionRepo)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start worker in goroutine
	go validationWorker.Start(ctx)

	log.Println("✅ Validation worker is running. Press Ctrl+C to stop.")

	// Wait for interrupt signal
	<-sigChan
	log.Println("\n🛑 Shutting down validation worker...")
	cancel()
}

// initSchema creates the validation_jobs table if it doesn't exist
func initSchema() error {
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

	log.Println("✅ Database schema initialized")
	return nil
}
