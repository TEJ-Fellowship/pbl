package workers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
		// No jobs available - this is normal, don't log
		return
	}

	log.Printf("🔍 Processing validation job %s for prescription %s", job.JobID, job.PrescriptionID)

	// Process the job
	if err := w.validatePrescription(ctx, job); err != nil {
		log.Printf("❌ Validation failed for prescription %s: %v", job.PrescriptionID, err)
		w.markJobFailed(ctx, job, err.Error())
		return
	}

	// Mark job as completed
	w.markJobCompleted(ctx, job)
	log.Printf("✅ Validation completed for prescription %s", job.PrescriptionID)
}

// lockJob atomically locks a pending job for processing
func (w *ValidationWorker) lockJob(ctx context.Context) (*models.ValidationJob, error) {
	// First, find and lock a pending job
	findQuery := `
		SELECT id, job_id, prescription_id, status, retry_count, max_retries
		FROM validation_jobs 
		WHERE status = 'pending' 
		ORDER BY created_at ASC 
		LIMIT 1
		FOR UPDATE SKIP LOCKED
	`

	var job models.ValidationJob
	err := database.PostgresPool.QueryRow(ctx, findQuery).Scan(
		&job.ID, &job.JobID, &job.PrescriptionID, &job.Status, &job.RetryCount, &job.MaxRetries,
	)
	if err != nil {
		// Check if it's a "no rows" error
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // No jobs available
		}
		return nil, fmt.Errorf("error finding job: %w", err)
	}

	// Update the job status to processing
	updateQuery := `
		UPDATE validation_jobs 
		SET status = 'processing', 
		    locked_at = NOW(), 
		    locked_by = $1,
		    updated_at = NOW()
		WHERE id = $2
	`
	_, err = database.PostgresPool.Exec(ctx, updateQuery, w.workerID, job.ID)
	if err != nil {
		return nil, fmt.Errorf("error locking job: %w", err)
	}

	job.Status = "processing"
	return &job, nil
}

// validatePrescription performs ASYNCHRONOUS advanced validation checks
// Only prescriptions that passed synchronous validation reach here
// If validation fails, prescription is saved with validation_failed status
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

	// Update status to validating
	if err := w.prescriptionRepo.UpdateStatus(ctx, prescriptionID, models.StatusValidating, "Starting async validation", "system"); err != nil {
		log.Printf("⚠️  Warning: Failed to update status to validating: %v", err)
	}

	// Perform ASYNC ADVANCED VALIDATION checks
	validationErrors := []models.ValidationError{}
	checks := models.ValidationChecks{}

	// Fetch prescriber for advanced checks
	prescriberRepo := repositories.NewPrescriberRepository()
	prescriber, err := prescriberRepo.FindByID(ctx, prescription.PrescriberID)
	if err != nil {
		validationErrors = append(validationErrors, models.ValidationError{
			Field:    "prescriber_id",
			Error:    "Prescriber not found during async validation",
			Severity: "critical",
		})
	} else {
		// Advanced NPI validation (already checked in sync, but verify again)
		checks.NPIValid = w.validateNPI(prescriber.NPI)
		if !checks.NPIValid {
			validationErrors = append(validationErrors, models.ValidationError{
				Field:    "prescriber.npi",
				Error:    "NPI validation failed in async check",
				Severity: "critical",
			})
		}

		// Validate DEA for controlled substances
		if prescription.Medication.IsControlled {
			checks.DEAValid = w.validateDEA(prescriber.DEA)
			if !checks.DEAValid {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:    "prescriber.dea",
					Error:    "DEA number is required for controlled substances",
					Severity: "critical",
				})
			}
		}
	}

	// Advanced NDC validation
	checks.NDCValid = w.validateNDC(prescription.Medication.NDC)
	if !checks.NDCValid {
		validationErrors = append(validationErrors, models.ValidationError{
			Field:    "medication.ndc",
			Error:    "NDC code validation failed",
			Severity: "critical",
		})
	}

	// ADVANCED CHECKS: Duplicate therapy detection
	if duplicateErr := w.checkDuplicateTherapy(ctx, prescription); duplicateErr != nil {
		validationErrors = append(validationErrors, models.ValidationError{
			Field:    "medication.duplicate_therapy",
			Error:    duplicateErr.Error(),
			Severity: "warning", // Warning, not critical - ops can review
		})
	}

	// ADVANCED CHECKS: Formulary mismatch (simulated)
	if formularyErr := w.checkFormularyMismatch(ctx, prescription); formularyErr != nil {
		validationErrors = append(validationErrors, models.ValidationError{
			Field:    "medication.formulary",
			Error:    formularyErr.Error(),
			Severity: "warning",
		})
	}

	// ADVANCED CHECKS: Regulatory/compliance checks
	if complianceErr := w.checkRegulatoryCompliance(ctx, prescription, prescriber); complianceErr != nil {
		validationErrors = append(validationErrors, models.ValidationError{
			Field:    "compliance",
			Error:    complianceErr.Error(),
			Severity: "critical",
		})
	}

	// Update prescription with validation results
	now := time.Now()
	prescription.ValidationErrors = validationErrors
	prescription.ValidationChecks = checks
	prescription.ValidatedAt = &now

	// Set status based on validation results
	// Save prescription even if validation fails (async behavior)
	if len(validationErrors) == 0 {
		prescription.Status = models.StatusValidated
		err = w.prescriptionRepo.UpdateStatus(ctx, prescriptionID, models.StatusValidated, "Async validation passed", "system")
		log.Printf("✅ Async validation passed for prescription %s", job.PrescriptionID)
	} else {
		// Save with validation_failed status - ops team can review and fix
		prescription.Status = models.StatusValidationFailed
		err = w.prescriptionRepo.UpdateStatus(ctx, prescriptionID, models.StatusValidationFailed, fmt.Sprintf("Async validation failed: %d errors", len(validationErrors)), "system")
		log.Printf("⚠️  Async validation failed for prescription %s: %d errors", job.PrescriptionID, len(validationErrors))
	}

	if err != nil {
		return fmt.Errorf("failed to update prescription status: %w", err)
	}

	// Update prescription document with validation results
	if err := w.prescriptionRepo.Update(ctx, prescriptionID, prescription); err != nil {
		return fmt.Errorf("failed to update prescription: %w", err)
	}

	return nil
}

// checkDuplicateTherapy checks for duplicate or conflicting medications
func (w *ValidationWorker) checkDuplicateTherapy(ctx context.Context, prescription *models.Prescription) error {
	// Check for active prescriptions with same medication for same patient
	activePrescriptions, err := w.prescriptionRepo.FindByPatientID(ctx, prescription.PatientID)
	if err != nil {
		return nil // Don't fail validation if we can't check
	}

	for _, activeRx := range activePrescriptions {
		// Skip self
		if activeRx.ID == prescription.ID {
			continue
		}

		// Check if same medication and still active
		if activeRx.Medication.NDC == prescription.Medication.NDC &&
			activeRx.Status != models.StatusCompleted &&
			activeRx.Status != models.StatusCancelled {
			return fmt.Errorf("duplicate therapy detected: active prescription %s for same medication", activeRx.PrescriptionNumber)
		}
	}

	return nil
}

// checkFormularyMismatch checks if medication is on formulary (simulated)
func (w *ValidationWorker) checkFormularyMismatch(ctx context.Context, prescription *models.Prescription) error {
	// Simulated formulary check - in real system, would check insurance formulary
	// For now, just a placeholder that always passes
	// TODO: Integrate with insurance formulary API
	return nil
}

// checkRegulatoryCompliance performs regulatory and compliance checks
func (w *ValidationWorker) checkRegulatoryCompliance(ctx context.Context, prescription *models.Prescription, prescriber *models.Prescriber) error {
	// Check if controlled substance requires DEA
	if prescription.Medication.IsControlled && (prescriber == nil || prescriber.DEA == "") {
		return fmt.Errorf("controlled substance requires valid DEA number")
	}

	// Additional compliance checks can be added here
	// e.g., state-specific regulations, quantity limits, etc.

	return nil
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

// validateNDC checks if NDC code is present and valid
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
