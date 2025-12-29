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

// CreatePrescriberRequest represents the request payload for creating a prescriber.
// Excludes server-generated fields: ID, CreatedAt, UpdatedAt
type CreatePrescriberRequest struct {
	FirstName   string     `json:"first_name" validate:"required"`
	LastName    string     `json:"last_name" validate:"required"`
	NPI         string     `json:"npi" validate:"required,len=10"` // 10-digit NPI
	DEA         string     `json:"dea,omitempty"`                  // For controlled substances
	ClinicName  string     `json:"clinic_name"`
	ClinicPhone string     `json:"clinic_phone" validate:"required"`
	Address     AddressDTO `json:"address" validate:"required"`
	Specialty   string     `json:"specialty,omitempty"`
}

// ToDTO converts CreatePrescriberRequest to PrescriberDTO for service layer compatibility
func (r *CreatePrescriberRequest) ToDTO() *PrescriberDTO {
	return &PrescriberDTO{
		FirstName:   r.FirstName,
		LastName:    r.LastName,
		NPI:         r.NPI,
		DEA:         r.DEA,
		ClinicName:  r.ClinicName,
		ClinicPhone: r.ClinicPhone,
		Address:     r.Address,
		Specialty:   r.Specialty,
		// ID, CreatedAt, UpdatedAt will be set by service/repository
	}
}

// UpdatePrescriberRequest represents the request payload for updating a prescriber.
// Excludes immutable fields: ID, NPI, CreatedAt
type UpdatePrescriberRequest struct {
	FirstName   string     `json:"first_name,omitempty"`
	LastName    string     `json:"last_name,omitempty"`
	DEA         string     `json:"dea,omitempty"`
	ClinicName  string     `json:"clinic_name,omitempty"`
	ClinicPhone string     `json:"clinic_phone,omitempty"`
	Address     AddressDTO `json:"address,omitempty"`
	Specialty   string     `json:"specialty,omitempty"`
}

// ToDTO converts UpdatePrescriberRequest to PrescriberDTO for service layer compatibility
func (r *UpdatePrescriberRequest) ToDTO() *PrescriberDTO {
	return &PrescriberDTO{
		FirstName:   r.FirstName,
		LastName:    r.LastName,
		DEA:         r.DEA,
		ClinicName:  r.ClinicName,
		ClinicPhone: r.ClinicPhone,
		Address:     r.Address,
		Specialty:   r.Specialty,
		// ID, NPI, CreatedAt are immutable and will be preserved by service
	}
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
