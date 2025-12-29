package workers

import (
	"context"
	"fmt"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/google/uuid"
)

// EnqueueValidationJob creates a validation job for a prescription
func EnqueueValidationJob(ctx context.Context, prescriptionID string) error {
	jobID := uuid.New().String()

	query := `
		INSERT INTO validation_jobs (job_id, prescription_id, status, created_at, updated_at)
		VALUES ($1, $2, 'pending', NOW(), NOW())
	`

	_, err := database.PostgresPool.Exec(ctx, query, jobID, prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to enqueue validation job: %w", err)
	}

	return nil
}
