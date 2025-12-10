package dto

import (
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PrescriberDTO represents a healthcare provider for API responses (JSON model).
type PrescriberDTO struct {
	ID          string     `json:"id"`
	FirstName   string     `json:"first_name" validate:"required"`
	LastName    string     `json:"last_name" validate:"required"`
	NPI         string     `json:"npi" validate:"required,len=10"` // 10-digit NPI
	DEA         string     `json:"dea,omitempty"`                  // For controlled substances
	ClinicName  string     `json:"clinic_name"`
	ClinicPhone string     `json:"clinic_phone" validate:"required"`
	Address     AddressDTO `json:"address" validate:"required"`
	Specialty   string     `json:"specialty,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ToDTO converts a BSON Prescriber model to a JSON DTO.
func PrescriberToDTO(p *models.Prescriber) *PrescriberDTO {
	if p == nil {
		return nil
	}
	return &PrescriberDTO{
		ID:          p.ID.Hex(),
		FirstName:   p.FirstName,
		LastName:    p.LastName,
		NPI:         p.NPI,
		DEA:         p.DEA,
		ClinicName:  p.ClinicName,
		ClinicPhone: p.ClinicPhone,
		Address:     *AddressToDTO(&p.Address),
		Specialty:   p.Specialty,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

// ToModel converts a JSON DTO to a BSON Prescriber model.
func (d *PrescriberDTO) ToModel() (*models.Prescriber, error) {
	prescriberID := primitive.NilObjectID
	if d.ID != "" {
		var err error
		prescriberID, err = primitive.ObjectIDFromHex(d.ID)
		if err != nil {
			return nil, err
		}
	}

	return &models.Prescriber{
		ID:          prescriberID,
		FirstName:   d.FirstName,
		LastName:    d.LastName,
		NPI:         d.NPI,
		DEA:         d.DEA,
		ClinicName:  d.ClinicName,
		ClinicPhone: d.ClinicPhone,
		Address:     *d.Address.ToModel(),
		Specialty:   d.Specialty,
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}, nil
}
