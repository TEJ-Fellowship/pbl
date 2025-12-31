package dto

import (
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PrescriptionDTO represents prescription data for API JSON.
type PrescriptionDTO struct {
	ID                 string               `json:"id"`
	PrescriptionNumber string               `json:"prescription_number"`
	Status             string               `json:"status"`
	PatientID          string               `json:"patient_id"`
	PrescriberID       string               `json:"prescriber_id"`
	SelectedPharmacyID string               `json:"selected_pharmacy_id,omitempty"`
	Medication         MedicationDTO        `json:"medication"`
	Notes              string               `json:"notes,omitempty"`
	ValidationErrors   []ValidationErrorDTO `json:"validation_errors,omitempty"`
	ValidationChecks   *ValidationChecksDTO `json:"validation_checks,omitempty"`
	ValidatedAt        *time.Time           `json:"validated_at,omitempty"`
	CreatedAt          time.Time            `json:"created_at"`
	UpdatedAt          time.Time            `json:"updated_at"`
}

// CreatePrescriptionRequest represents the request payload for creating a prescription.
// Supports two formats:
// 1. Simple: Use patient_id and prescriber_id (existing entities)
// 2. Comprehensive: Include nested patient/prescriber objects (NCPDP-style from Gemini API)
// Excludes server-generated fields: ID, PrescriptionNumber, Status, CreatedAt, UpdatedAt
type CreatePrescriptionRequest struct {
	// Simple format: Use existing patient/prescriber IDs
	PatientID    string `json:"patient_id,omitempty"`
	PrescriberID string `json:"prescriber_id,omitempty"`

	// Comprehensive format: Reuse existing DTOs (no duplication!)
	Patient    *CreatePatientRequest    `json:"patient,omitempty"`
	Prescriber *CreatePrescriberRequest `json:"prescriber,omitempty"`
	Insurance  *InsuranceInfoRequest    `json:"insurance,omitempty"`

	// Common fields
	PrescriptionNumber string        `json:"prescription_number,omitempty"` // Optional, will be generated
	DateWritten        string        `json:"date_written,omitempty"`        // Format: YYYY-MM-DD
	Medication         MedicationDTO `json:"medication" validate:"required"`
	Notes              string        `json:"notes,omitempty"`
}

// InsuranceInfoRequest represents insurance information in prescription request
type InsuranceInfoRequest struct {
	PayerName   string `json:"payer_name" validate:"required"` // Insurance carrier name
	MemberID    string `json:"member_id" validate:"required"`  // Member/Subscriber ID
	GroupNumber string `json:"group_number,omitempty"`         // Group ID
	BIN         string `json:"bin,omitempty" validate:"len=6"` // 6-digit BIN
	PCN         string `json:"pcn,omitempty"`                  // Processor Control Number
	PlanType    string `json:"plan_type,omitempty"`            // commercial/medicare/medicaid/etc
}

// ToDTO converts CreatePrescriptionRequest to PrescriptionDTO for service layer compatibility
func (r *CreatePrescriptionRequest) ToDTO() *PrescriptionDTO {
	return &PrescriptionDTO{
		PatientID:    r.PatientID,
		PrescriberID: r.PrescriberID,
		Medication:   r.Medication,
		Notes:        r.Notes,
		// ID, PrescriptionNumber, Status, CreatedAt, UpdatedAt will be set by service/repository
	}
}

// UpdatePrescriptionRequest represents the request payload for updating a prescription.
// Excludes immutable fields: ID, PrescriptionNumber, CreatedAt
type UpdatePrescriptionRequest struct {
	Medication         MedicationDTO `json:"medication,omitempty"`
	Notes              string        `json:"notes,omitempty"`
	SelectedPharmacyID string        `json:"selected_pharmacy_id,omitempty"`
}

// ToDTO converts UpdatePrescriptionRequest to PrescriptionDTO for service layer compatibility
func (r *UpdatePrescriptionRequest) ToDTO() *PrescriptionDTO {
	return &PrescriptionDTO{
		Medication:         r.Medication,
		Notes:              r.Notes,
		SelectedPharmacyID: r.SelectedPharmacyID,
		// ID, PrescriptionNumber, CreatedAt are immutable and will be preserved by service
	}
}

// MedicationDTO mirrors models.Medication for JSON.
// Includes essential NCPDP fields: NDC (required) and DAW (for brand/generic substitution).
type MedicationDTO struct {
	NDC        string `json:"ndc" validate:"required"` // National Drug Code - REQUIRED in NCPDP
	DrugName   string `json:"drug_name" validate:"required"`
	Strength   string `json:"strength" validate:"required"`
	Dosage     string `json:"dosage" validate:"required"`
	Form       string `json:"form,omitempty"`
	Route      string `json:"route,omitempty"`
	SIG        string `json:"sig" validate:"required"`
	Quantity   int    `json:"quantity" validate:"required,gt=0"`
	DaysSupply int    `json:"days_supply" validate:"required,gt=0"`
	Refills    int    `json:"refills" validate:"min=0"`
	DAW        int    `json:"daw,omitempty" validate:"min=0,max=9"` // Dispense As Written code (0-9)
}

// PrescriptionToDTO converts BSON model to JSON DTO.
func PrescriptionToDTO(p *models.Prescription) *PrescriptionDTO {
	if p == nil {
		return nil
	}

	selectedPharmacyID := ""
	if !p.SelectedPharmacyID.IsZero() {
		selectedPharmacyID = p.SelectedPharmacyID.Hex()
	}

	dto := &PrescriptionDTO{
		ID:                 p.ID.Hex(),
		PrescriptionNumber: p.PrescriptionNumber,
		Status:             p.Status,
		PatientID:          p.PatientID.Hex(),
		PrescriberID:       p.PrescriberID.Hex(),
		SelectedPharmacyID: selectedPharmacyID,
		Medication:         *MedicationToDTO(&p.Medication),
		Notes:              p.Notes,
		ValidatedAt:        p.ValidatedAt,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}

	// Convert validation errors
	if len(p.ValidationErrors) > 0 {
		dto.ValidationErrors = make([]ValidationErrorDTO, len(p.ValidationErrors))
		for i, ve := range p.ValidationErrors {
			dto.ValidationErrors[i] = ValidationErrorDTO{
				Field:    ve.Field,
				Error:    ve.Error,
				Severity: ve.Severity,
			}
		}
	}

	// Convert validation checks
	if p.ValidationChecks.NPIValid || p.ValidationChecks.DEAValid || p.ValidationChecks.NDCValid {
		dto.ValidationChecks = &ValidationChecksDTO{
			NPIValid:        p.ValidationChecks.NPIValid,
			DEAValid:        p.ValidationChecks.DEAValid,
			NDCValid:        p.ValidationChecks.NDCValid,
			RequiredFields:  p.ValidationChecks.RequiredFields,
			SIGFormat:       p.ValidationChecks.SIGFormat,
			QuantityValid:   p.ValidationChecks.QuantityValid,
			DaysSupplyValid: p.ValidationChecks.DaysSupplyValid,
		}
	}

	return dto
}

// ToModel converts JSON DTO to BSON model.
func (d *PrescriptionDTO) ToModel() (*models.Prescription, error) {
	toObjID := func(s string) (primitive.ObjectID, error) {
		if s == "" {
			return primitive.NilObjectID, nil
		}
		return primitive.ObjectIDFromHex(s)
	}

	id, err := toObjID(d.ID)
	if err != nil {
		return nil, err
	}
	patientID, err := toObjID(d.PatientID)
	if err != nil {
		return nil, err
	}
	prescriberID, err := toObjID(d.PrescriberID)
	if err != nil {
		return nil, err
	}
	selectedPharmacyID, err := toObjID(d.SelectedPharmacyID)
	if err != nil {
		return nil, err
	}

	med := d.Medication.ToModel()

	return &models.Prescription{
		ID:                 id,
		PrescriptionNumber: d.PrescriptionNumber,
		Status:             d.Status,
		PatientID:          patientID,
		PrescriberID:       prescriberID,
		SelectedPharmacyID: selectedPharmacyID,
		Medication:         *med,
		Notes:              d.Notes,
		CreatedAt:          d.CreatedAt,
		UpdatedAt:          d.UpdatedAt,
	}, nil
}

// MedicationToDTO converts BSON medication to JSON DTO.
func MedicationToDTO(m *models.Medication) *MedicationDTO {
	if m == nil {
		return nil
	}
	return &MedicationDTO{
		NDC:        m.NDC,
		DrugName:   m.DrugName,
		Strength:   m.Strength,
		Dosage:     m.Dosage,
		Form:       m.Form,
		Route:      m.Route,
		SIG:        m.SIG,
		Quantity:   m.Quantity,
		DaysSupply: m.DaysSupply,
		Refills:    m.Refills,
		DAW:        m.DAW,
	}
}

// ToModel converts JSON DTO to BSON medication.
func (d *MedicationDTO) ToModel() *models.Medication {
	return &models.Medication{
		NDC:        d.NDC,
		DrugName:   d.DrugName,
		Strength:   d.Strength,
		Dosage:     d.Dosage,
		Form:       d.Form,
		Route:      d.Route,
		SIG:        d.SIG,
		Quantity:   d.Quantity,
		DaysSupply: d.DaysSupply,
		Refills:    d.Refills,
		DAW:        d.DAW,
	}
}

// ValidationErrorDTO represents a validation error for API responses
type ValidationErrorDTO struct {
	Field    string `json:"field"`
	Error    string `json:"error"`
	Severity string `json:"severity"`
}

// ValidationChecksDTO represents validation check results for API responses
type ValidationChecksDTO struct {
	NPIValid        bool `json:"npi_valid"`
	DEAValid        bool `json:"dea_valid"`
	NDCValid        bool `json:"ndc_valid"`
	RequiredFields  bool `json:"required_fields"`
	SIGFormat       bool `json:"sig_format"`
	QuantityValid   bool `json:"quantity_valid"`
	DaysSupplyValid bool `json:"days_supply_valid"`
}
