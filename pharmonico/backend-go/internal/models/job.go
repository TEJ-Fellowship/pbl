package models

import (
	"time"
)

// JobStatus represents the status of a background job
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusSucceeded  JobStatus = "succeeded"
	JobStatusFailed     JobStatus = "failed"
)

// JobType represents the type of background job
type JobType string

const (
	JobTypeValidatePrescription  JobType = "validate_prescription"
	JobTypeCheckEnrollment       JobType = "check_enrollment"
	JobTypePharmacyRecommendation JobType = "pharmacy_recommendation"
	JobTypeRunAdjudication       JobType = "run_adjudication"
	JobTypeCreatePaymentLink     JobType = "create_payment_link"
	JobTypeStartShipping         JobType = "start_shipping"
	JobTypeCheckDelivery         JobType = "check_delivery"
)

// Job represents a background job in PostgreSQL
type Job struct {
	ID            int64      `json:"id" db:"id"`
	Type          JobType    `json:"type" db:"type"`
	Status        JobStatus  `json:"status" db:"status"`
	Payload       string     `json:"payload" db:"payload"` // JSON payload
	Result        *string    `json:"result,omitempty" db:"result"`
	Error         *string    `json:"error,omitempty" db:"error"`
	Attempts      int        `json:"attempts" db:"attempts"`
	MaxAttempts   int        `json:"max_attempts" db:"max_attempts"`
	ScheduledAt   time.Time  `json:"scheduled_at" db:"scheduled_at"`
	StartedAt     *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

