package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/pharmonico/backend-go/internal/config"
	"github.com/pharmonico/backend-go/internal/database"
	"github.com/pharmonico/backend-go/internal/workers"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize databases
	mongoDB, err := database.NewMongoDB(cfg.MongoURI, cfg.MongoDatabase)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoDB.Close()

	postgresDB, err := database.NewPostgresDB(cfg.PostgresURI)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer postgresDB.Close()

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())

	// Initialize and start workers
	workerManager := workers.NewManager(mongoDB, postgresDB, cfg)
	workerManager.Start(ctx)

	log.Println("🔧 Workers started successfully")

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down workers...")
	cancel()

	// Wait for workers to finish
	workerManager.Wait()

	log.Println("Workers stopped gracefully")
}

