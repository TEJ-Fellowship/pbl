package workers

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ValidationWorker struct {
	prescriptionRepo *repositories.PrescriptionRepository
	workerID         string
	pollInterval     time.Duration
}

func NewValidationWorker(prescriptionRepo *repositories.PrescriptionRepository) *ValidationWorker {
	return &ValidationWorker{
		prescriptionRepo: prescriptionRepo,
		workerID:         uuid.New().String(),
		pollInterval:     5 * time.Second,
	}
}

// Start begins polling for validation jobs
func (w *ValidationWorker) Start(ctx context.Context) {
	log.Println("🔍 Validation worker started")

	for {
		select {
		case <-ctx.Done():
			log.Println("🛑 Validation worker stopped")
			return
		default:
			w.processNextJob(ctx)
			time.Sleep(w.pollInterval)
		}
	}
}

// processNextJob fetches and processes the next pending validation job
func (w *ValidationWorker) processNextJob(ctx context.Context) {
	// Lock and fetch a pending job
	job, err := w.lockJob(ctx)
	if err != nil {
		log.Printf("❌ Error locking job: %v", err)
		return
	}
	if job == nil {
		return // No jobs available
	}

	// Process the job
	if err := w.validatePrescription(ctx, job); err != nil {
		log.Printf("❌ Validation failed for prescription %s: %v", job.PrescriptionID, err)
		w.markJobFailed(ctx, job, err.Error())
		return
	}

	// Mark job as completed
	w.markJobCompleted(ctx, job)
}

// lockJob atomically locks a pending job for processing
func (w *ValidationWorker) lockJob(ctx context.Context) (*models.ValidationJob, error) {
	query := `
		UPDATE validation_jobs 
		SET status = 'processing', 
		    locked_at = NOW(), 
		    locked_by = $1,
		    updated_at = NOW()
		WHERE id = (
			SELECT id FROM validation_jobs 
			WHERE status = 'pending' 
			ORDER BY created_at ASC 
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, job_id, prescription_id, status, retry_count, max_retries
	`

	var job models.ValidationJob
	err := database.PostgresPool.QueryRow(ctx, query, w.workerID).Scan(
		&job.ID, &job.JobID, &job.PrescriptionID, &job.Status, &job.RetryCount, &job.MaxRetries,
	)
	if err != nil {
		// No rows means no pending jobs
		return nil, nil
	}

	return &job, nil
}

// validatePrescription performs validation checks on a prescription
func (w *ValidationWorker) validatePrescription(ctx context.Context, job *models.ValidationJob) error {
	// Convert prescription ID string to ObjectID
	prescriptionID, err := primitive.ObjectIDFromHex(job.PrescriptionID)
	if err != nil {
		return fmt.Errorf("invalid prescription ID: %w", err)
	}

	// Fetch prescription from MongoDB
	prescription, err := w.prescriptionRepo.FindByID(ctx, prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to fetch prescription: %w", err)
	}

	// Perform validation
	errors := []models.ValidationError{}
	checks := models.ValidationChecks{}

	// Validate prescriber NPI
	if prescription.PrescriberID != primitive.NilObjectID {
		prescriberRepo := repositories.NewPrescriberRepository()
		prescriber, err := prescriberRepo.FindByID(ctx, prescription.PrescriberID)
		if err != nil {
			errors = append(errors, models.ValidationError{
				Field:    "prescriber_id",
				Error:    "Prescriber not found",
				Severity: "critical",
			})
		} else {
			checks.NPIValid = w.validateNPI(prescriber.NPI)
			if !checks.NPIValid {
				errors = append(errors, models.ValidationError{
					Field:    "prescriber.npi",
					Error:    "NPI must be exactly 10 digits",
					Severity: "critical",
				})
			}

			// Validate DEA if medication is controlled
			if prescription.Medication.IsControlled {
				checks.DEAValid = w.validateDEA(prescriber.DEA)
				if !checks.DEAValid {
					errors = append(errors, models.ValidationError{
						Field:    "prescriber.dea",
						Error:    "DEA number is required for controlled substances",
						Severity: "critical",
					})
				}
			}
		}
	}

	// Validate medication NDC
	checks.NDCValid = w.validateNDC(prescription.Medication.NDC)
	if !checks.NDCValid {
		errors = append(errors, models.ValidationError{
			Field:    "medication.ndc",
			Error:    "NDC code is required and must be valid format",
			Severity: "critical",
		})
	}

	// Validate required fields
	checks.RequiredFields = prescription.Medication.DrugName != "" &&
		prescription.Medication.NDC != "" &&
		prescription.Medication.Quantity > 0 &&
		prescription.Medication.SIG != ""
	if !checks.RequiredFields {
		errors = append(errors, models.ValidationError{
			Field:    "medication",
			Error:    "Missing required medication fields (drug_name, ndc, quantity, sig)",
			Severity: "critical",
		})
	}

	// Validate quantity
	checks.QuantityValid = prescription.Medication.Quantity > 0
	if !checks.QuantityValid {
		errors = append(errors, models.ValidationError{
			Field:    "medication.quantity",
			Error:    "Quantity must be greater than 0",
			Severity: "critical",
		})
	}

	// Validate days supply
	checks.DaysSupplyValid = prescription.Medication.DaysSupply > 0
	if !checks.DaysSupplyValid {
		errors = append(errors, models.ValidationError{
			Field:    "medication.days_supply",
			Error:    "Days supply must be greater than 0",
			Severity: "critical",
		})
	}

	// Validate SIG (directions) format
	checks.SIGFormat = len(prescription.Medication.SIG) > 0
	if !checks.SIGFormat {
		errors = append(errors, models.ValidationError{
			Field:    "medication.sig",
			Error:    "Directions (SIG) are required",
			Severity: "critical",
		})
	}

	// Update prescription with validation results
	now := time.Now()
	prescription.ValidationErrors = errors
	prescription.ValidationChecks = checks
	prescription.ValidatedAt = &now

	// Set status based on validation results
	if len(errors) == 0 {
		prescription.Status = models.StatusValidated
		err = w.prescriptionRepo.UpdateStatus(ctx, prescriptionID, models.StatusValidated, "Validation passed", "system")
	} else {
		prescription.Status = models.StatusValidationFailed
		err = w.prescriptionRepo.UpdateStatus(ctx, prescriptionID, models.StatusValidationFailed, "Validation failed", "system")
	}

	if err != nil {
		return fmt.Errorf("failed to update prescription status: %w", err)
	}

	// Update prescription document
	return w.prescriptionRepo.Update(ctx, prescriptionID, prescription)
}

// validateNPI checks if NPI is exactly 10 digits
func (w *ValidationWorker) validateNPI(npi string) bool {
	if len(npi) != 10 {
		return false
	}
	for _, r := range npi {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

// validateDEA checks if DEA number is present (basic check)
func (w *ValidationWorker) validateDEA(dea string) bool {
	return dea != "" && len(dea) > 0
}

// validateNDC checks if NDC code is present (basic check)
func (w *ValidationWorker) validateNDC(ndc string) bool {
	return ndc != "" && len(ndc) > 0
}

// markJobCompleted marks a job as completed
func (w *ValidationWorker) markJobCompleted(ctx context.Context, job *models.ValidationJob) {
	now := time.Now()
	query := `
		UPDATE validation_jobs 
		SET status = 'completed', 
		    completed_at = $1,
		    updated_at = $1
		WHERE id = $2
	`
	_, err := database.PostgresPool.Exec(ctx, query, now, job.ID)
	if err != nil {
		log.Printf("❌ Error marking job completed: %v", err)
	}
}

// markJobFailed marks a job as failed
func (w *ValidationWorker) markJobFailed(ctx context.Context, job *models.ValidationJob, errorMsg string) {
	query := `
		UPDATE validation_jobs 
		SET status = 'failed', 
		    error_message = $1,
		    updated_at = NOW()
		WHERE id = $2
	`
	_, err := database.PostgresPool.Exec(ctx, query, errorMsg, job.ID)
	if err != nil {
		log.Printf("❌ Error marking job failed: %v", err)
	}
}
