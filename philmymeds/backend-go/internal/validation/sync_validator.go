package validation

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
)

// ValidationError represents a validation error with field and message
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors holds multiple validation errors
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

func (e *ValidationErrors) Error() string {
	messages := make([]string, len(e.Errors))
	for i, err := range e.Errors {
		messages[i] = fmt.Sprintf("%s: %s", err.Field, err.Message)
	}
	return strings.Join(messages, "; ")
}

// ValidatePrescription performs synchronous validation before saving
func ValidatePrescription(prescriptionDTO *dto.PrescriptionDTO, prescriber *models.Prescriber) *ValidationErrors {
	var errors []ValidationError

	// Validate patient ID
	if prescriptionDTO.PatientID == "" {
		errors = append(errors, ValidationError{
			Field:   "patient_id",
			Message: "Patient ID is required",
		})
	}

	// Validate prescriber ID
	if prescriptionDTO.PrescriberID == "" {
		errors = append(errors, ValidationError{
			Field:   "prescriber_id",
			Message: "Prescriber ID is required",
		})
	}

	// Validate prescriber NPI
	if prescriber != nil {
		if !ValidateNPI(prescriber.NPI) {
			errors = append(errors, ValidationError{
				Field:   "prescriber.npi",
				Message: "NPI must be exactly 10 digits",
			})
		}
	} else {
		errors = append(errors, ValidationError{
			Field:   "prescriber",
			Message: "Prescriber not found",
		})
	}

	// Validate medication - NCPDP required fields
	med := prescriptionDTO.Medication
	if med.NDC == "" {
		errors = append(errors, ValidationError{
			Field:   "medication.ndc",
			Message: "NDC code is required (NCPDP field)",
		})
	} else if !ValidateNDCFormat(med.NDC) {
		errors = append(errors, ValidationError{
			Field:   "medication.ndc",
			Message: "NDC code must be in format XXXXX-XXXX-XX",
		})
	}

	if med.DrugName == "" {
		errors = append(errors, ValidationError{
			Field:   "medication.drug_name",
			Message: "Drug name is required",
		})
	}

	if med.Strength == "" {
		errors = append(errors, ValidationError{
			Field:   "medication.strength",
			Message: "Strength is required",
		})
	}

	if med.Dosage == "" {
		errors = append(errors, ValidationError{
			Field:   "medication.dosage",
			Message: "Dosage is required",
		})
	}

	if med.SIG == "" {
		errors = append(errors, ValidationError{
			Field:   "medication.sig",
			Message: "Directions (SIG) are required",
		})
	}

	// Validate quantity
	if med.Quantity <= 0 {
		errors = append(errors, ValidationError{
			Field:   "medication.quantity",
			Message: "Quantity must be greater than 0",
		})
	}

	// Validate days supply
	if med.DaysSupply <= 0 {
		errors = append(errors, ValidationError{
			Field:   "medication.days_supply",
			Message: "Days supply must be greater than 0",
		})
	}

	// Validate refills
	if med.Refills < 0 {
		errors = append(errors, ValidationError{
			Field:   "medication.refills",
			Message: "Refills cannot be negative",
		})
	}

	// Validate DAW (Dispense As Written) if provided
	if med.DAW < 0 || med.DAW > 9 {
		errors = append(errors, ValidationError{
			Field:   "medication.daw",
			Message: "DAW code must be between 0 and 9",
		})
	}

	if len(errors) > 0 {
		return &ValidationErrors{Errors: errors}
	}

	return nil
}

// ValidateNPI checks if NPI is exactly 10 digits
func ValidateNPI(npi string) bool {
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

// ValidateNDCFormat checks if NDC is in format XXXXX-XXXX-XX or XXXXXXXX-XX
func ValidateNDCFormat(ndc string) bool {
	if ndc == "" {
		return false
	}
	// NCPDP format: XXXXX-XXXX-XX (with dashes) or XXXXXXXX-XX (11 digits with dash)
	// Also accept without dashes: 11 digits
	pattern1 := `^\d{5}-\d{4}-\d{2}$` // XXXXX-XXXX-XX
	pattern2 := `^\d{11}$`            // 11 digits without dashes
	matched1, _ := regexp.MatchString(pattern1, ndc)
	matched2, _ := regexp.MatchString(pattern2, ndc)
	return matched1 || matched2
}
