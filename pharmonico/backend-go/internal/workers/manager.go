package workers

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/pharmonico/backend-go/internal/config"
	"github.com/pharmonico/backend-go/internal/database"
)

// Manager coordinates all background workers
type Manager struct {
	mongoDB    *database.MongoDB
	postgresDB *database.PostgresDB
	config     *config.Config
	wg         sync.WaitGroup
}

// NewManager creates a new worker manager
func NewManager(mongoDB *database.MongoDB, postgresDB *database.PostgresDB, cfg *config.Config) *Manager {
	return &Manager{
		mongoDB:    mongoDB,
		postgresDB: postgresDB,
		config:     cfg,
	}
}

// Start begins all worker goroutines
func (m *Manager) Start(ctx context.Context) {
	// Validation Worker
	m.wg.Add(1)
	go m.runWorker(ctx, "validation", m.processValidationJobs)

	// Enrollment Worker
	m.wg.Add(1)
	go m.runWorker(ctx, "enrollment", m.processEnrollmentJobs)

	// Payment Worker
	m.wg.Add(1)
	go m.runWorker(ctx, "payment", m.processPaymentJobs)

	// Shipping Worker
	m.wg.Add(1)
	go m.runWorker(ctx, "shipping", m.processShippingJobs)
}

// Wait blocks until all workers have stopped
func (m *Manager) Wait() {
	m.wg.Wait()
}

// runWorker is a generic worker runner with polling
func (m *Manager) runWorker(ctx context.Context, name string, processor func(ctx context.Context) error) {
	defer m.wg.Done()

	pollInterval := 5 * time.Second
	log.Printf("Starting %s worker (poll interval: %v)", name, pollInterval)

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("Stopping %s worker", name)
			return
		case <-ticker.C:
			if err := processor(ctx); err != nil {
				log.Printf("[%s] Error processing jobs: %v", name, err)
			}
		}
	}
}

// Placeholder job processors - to be implemented in Sprint 1+

func (m *Manager) processValidationJobs(ctx context.Context) error {
	// TODO: Implement validation job processing
	// 1. Poll jobs table for pending validation jobs
	// 2. Process each job (validate prescription)
	// 3. Update job status and prescription status
	return nil
}

func (m *Manager) processEnrollmentJobs(ctx context.Context) error {
	// TODO: Implement enrollment job processing
	// 1. Check for completed enrollments
	// 2. Validate insurance info
	// 3. Move prescription to next stage
	return nil
}

func (m *Manager) processPaymentJobs(ctx context.Context) error {
	// TODO: Implement payment job processing
	// 1. Check payment status with Stripe
	// 2. Update prescription status on payment success
	return nil
}

func (m *Manager) processShippingJobs(ctx context.Context) error {
	// TODO: Implement shipping job processing
	// 1. Check shipment status with Shippo
	// 2. Update prescription status on delivery
	return nil
}

