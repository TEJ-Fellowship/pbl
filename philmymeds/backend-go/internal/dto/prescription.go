package dto

import (
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PrescriptionDTO represents prescription data for API JSON.
type PrescriptionDTO struct {
	ID                 string        `json:"id"`
	PrescriptionNumber string        `json:"prescription_number"`
	Status             string        `json:"status"`
	PatientID          string        `json:"patient_id"`
	PrescriberID       string        `json:"prescriber_id"`
	SelectedPharmacyID string        `json:"selected_pharmacy_id,omitempty"`
	Medication         MedicationDTO `json:"medication"`
	Notes              string        `json:"notes,omitempty"`
	CreatedAt          time.Time     `json:"created_at"`
	UpdatedAt          time.Time     `json:"updated_at"`
}

// MedicationDTO mirrors models.Medication for JSON.
type MedicationDTO struct {
	DrugName   string `json:"drug_name"`
	Strength   string `json:"strength"`
	Dosage     string `json:"dosage"`
	Form       string `json:"form,omitempty"`
	Route      string `json:"route,omitempty"`
	SIG        string `json:"sig"`
	Quantity   int    `json:"quantity"`
	DaysSupply int    `json:"days_supply"`
	Refills    int    `json:"refills"`
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

	return &PrescriptionDTO{
		ID:                 p.ID.Hex(),
		PrescriptionNumber: p.PrescriptionNumber,
		Status:             p.Status,
		PatientID:          p.PatientID.Hex(),
		PrescriberID:       p.PrescriberID.Hex(),
		SelectedPharmacyID: selectedPharmacyID,
		Medication:         *MedicationToDTO(&p.Medication),
		Notes:              p.Notes,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}
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
		DrugName:   m.DrugName,
		Strength:   m.Strength,
		Dosage:     m.Dosage,
		Form:       m.Form,
		Route:      m.Route,
		SIG:        m.SIG,
		Quantity:   m.Quantity,
		DaysSupply: m.DaysSupply,
		Refills:    m.Refills,
	}
}

// ToModel converts JSON DTO to BSON medication.
func (d *MedicationDTO) ToModel() *models.Medication {
	return &models.Medication{
		DrugName:   d.DrugName,
		Strength:   d.Strength,
		Dosage:     d.Dosage,
		Form:       d.Form,
		Route:      d.Route,
		SIG:        d.SIG,
		Quantity:   d.Quantity,
		DaysSupply: d.DaysSupply,
		Refills:    d.Refills,
	}
}
