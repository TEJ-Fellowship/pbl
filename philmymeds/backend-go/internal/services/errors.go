package services

import (
	"errors"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/validation"
)

// Service-level errors
var (
	ErrPatientNotFound           = errors.New("patient not found")
	ErrPatientAlreadyExists      = errors.New("patient with this email already exists")
	ErrPrescriptionNotFound      = errors.New("prescription not found")
	ErrPrescriptionAlreadyExists = errors.New("prescription with this number already exists")
	ErrPrescriberNotFound        = errors.New("prescriber not found")
	ErrPrescriberAlreadyExists   = errors.New("prescriber with this NPI already exists")
	ErrInsuranceProfileNotFound  = errors.New("insurance profile not found")
	ErrInvalidID                 = errors.New("invalid ID format")
	ErrNotImplemented            = errors.New("not implemented")
)

// ValidationError wraps validation errors for API responses
type ValidationError struct {
	Message string                       `json:"message"`
	Errors  []validation.ValidationError `json:"errors"`
}

func (e *ValidationError) Error() string {
	return e.Message
}

// NewValidationError creates a validation error from validation.ValidationErrors
func NewValidationError(ve *validation.ValidationErrors) *ValidationError {
	return &ValidationError{
		Message: "Prescription validation failed",
		Errors:  ve.Errors,
	}
}
