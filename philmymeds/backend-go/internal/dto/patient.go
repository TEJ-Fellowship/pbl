package dto

import (
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PatientDTO represents a patient for API responses (JSON model).
type PatientDTO struct {
	ID                 string     `json:"id"`
	FirstName          string     `json:"first_name" validate:"required"`
	LastName           string     `json:"last_name" validate:"required"`
	DateOfBirth        string     `json:"date_of_birth" validate:"required"`     // Format: YYYY-MM-DD
	Sex                string     `json:"sex" validate:"required,oneof=M F O U"` // M/F/O/U
	Email              string     `json:"email" validate:"required,email"`
	Phone              string     `json:"phone" validate:"required"`
	Address            AddressDTO `json:"address" validate:"required"`
	InsuranceProfileID string     `json:"insurance_profile_id,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// CreatePatientRequest represents the request payload for creating a patient.
// Excludes server-generated fields: ID, InsuranceProfileID, CreatedAt, UpdatedAt
type CreatePatientRequest struct {
	FirstName   string     `json:"first_name" validate:"required"`
	LastName    string     `json:"last_name" validate:"required"`
	DateOfBirth string     `json:"date_of_birth" validate:"required"`     // Format: YYYY-MM-DD
	Sex         string     `json:"sex" validate:"required,oneof=M F O U"` // M/F/O/U
	Email       string     `json:"email" validate:"required,email"`
	Phone       string     `json:"phone" validate:"required"`
	Address     AddressDTO `json:"address" validate:"required"`
}

// ToDTO converts CreatePatientRequest to PatientDTO for service layer compatibility
func (r *CreatePatientRequest) ToDTO() *PatientDTO {
	return &PatientDTO{
		FirstName:   r.FirstName,
		LastName:    r.LastName,
		DateOfBirth: r.DateOfBirth,
		Sex:         r.Sex,
		Email:       r.Email,
		Phone:       r.Phone,
		Address:     r.Address,
		// ID, InsuranceProfileID, CreatedAt, UpdatedAt will be set by service/repository
	}
}

// UpdatePatientRequest represents the request payload for updating a patient.
// Excludes immutable fields: ID, CreatedAt
type UpdatePatientRequest struct {
	FirstName   string     `json:"first_name,omitempty"`
	LastName    string     `json:"last_name,omitempty"`
	DateOfBirth string     `json:"date_of_birth,omitempty"` // Format: YYYY-MM-DD
	Sex         string     `json:"sex,omitempty"`            // M/F/O/U
	Email       string     `json:"email,omitempty"`
	Phone       string     `json:"phone,omitempty"`
	Address     AddressDTO `json:"address,omitempty"`
}

// ToDTO converts UpdatePatientRequest to PatientDTO for service layer compatibility
func (r *UpdatePatientRequest) ToDTO() *PatientDTO {
	return &PatientDTO{
		FirstName:   r.FirstName,
		LastName:    r.LastName,
		DateOfBirth: r.DateOfBirth,
		Sex:         r.Sex,
		Email:       r.Email,
		Phone:       r.Phone,
		Address:     r.Address,
		// ID, CreatedAt are immutable and will be preserved by service
		// InsuranceProfileID is managed separately
	}
}

// AddressDTO represents a physical address for API responses (JSON model).
type AddressDTO struct {
	Line1       string         `json:"line1" validate:"required"`
	Line2       string         `json:"line2,omitempty"`
	City        string         `json:"city" validate:"required"`
	State       string         `json:"state" validate:"required,len=2"` // Two-letter state code
	ZIP         string         `json:"zip" validate:"required"`
	Country     string         `json:"country" validate:"required"` // Default: "US"
	Coordinates GeoLocationDTO `json:"coordinates,omitempty"`
}

// GeoLocationDTO represents latitude/longitude coordinates for API responses (JSON model).
type GeoLocationDTO struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

// ToDTO converts a BSON Patient model to a JSON DTO.
func PatientToDTO(p *models.Patient) *PatientDTO {
	if p == nil {
		return nil
	}

	insuranceProfileID := ""
	if !p.InsuranceProfileID.IsZero() {
		insuranceProfileID = p.InsuranceProfileID.Hex()
	}

	return &PatientDTO{
		ID:                 p.ID.Hex(),
		FirstName:          p.FirstName,
		LastName:           p.LastName,
		DateOfBirth:        p.DateOfBirth,
		Sex:                p.Sex,
		Email:              p.Email,
		Phone:              p.Phone,
		Address:            *AddressToDTO(&p.Address),
		InsuranceProfileID: insuranceProfileID,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}
}

// ToModel converts a JSON DTO to a BSON Patient model.
func (d *PatientDTO) ToModel() (*models.Patient, error) {
	patientID := primitive.NilObjectID
	if d.ID != "" {
		var err error
		patientID, err = primitive.ObjectIDFromHex(d.ID)
		if err != nil {
			return nil, err
		}
	}

	insuranceProfileID := primitive.NilObjectID
	if d.InsuranceProfileID != "" {
		var err error
		insuranceProfileID, err = primitive.ObjectIDFromHex(d.InsuranceProfileID)
		if err != nil {
			return nil, err
		}
	}

	return &models.Patient{
		ID:                 patientID,
		FirstName:          d.FirstName,
		LastName:           d.LastName,
		DateOfBirth:        d.DateOfBirth,
		Sex:                d.Sex,
		Email:              d.Email,
		Phone:              d.Phone,
		Address:            *d.Address.ToModel(),
		InsuranceProfileID: insuranceProfileID,
		CreatedAt:          d.CreatedAt,
		UpdatedAt:          d.UpdatedAt,
	}, nil
}

// AddressToDTO converts a BSON Address model to a JSON DTO.
func AddressToDTO(a *models.Address) *AddressDTO {
	if a == nil {
		return nil
	}

	var coordinates GeoLocationDTO
	// Only include coordinates if they are set (non-zero)
	if a.Coordinates.Latitude != 0 || a.Coordinates.Longitude != 0 {
		coordDTO := GeoLocationToDTO(&a.Coordinates)
		if coordDTO != nil {
			coordinates = *coordDTO
		}
	}

	return &AddressDTO{
		Line1:       a.Line1,
		Line2:       a.Line2,
		City:        a.City,
		State:       a.State,
		ZIP:         a.ZIP,
		Country:     a.Country,
		Coordinates: coordinates,
	}
}

// ToModel converts a JSON DTO to a BSON Address model.
func (d *AddressDTO) ToModel() *models.Address {
	var coordinates models.GeoLocation
	// Only set coordinates if they are provided (non-zero)
	if d.Coordinates.Latitude != 0 || d.Coordinates.Longitude != 0 {
		coordModel := d.Coordinates.ToModel()
		if coordModel != nil {
			coordinates = *coordModel
		}
	}

	return &models.Address{
		Line1:       d.Line1,
		Line2:       d.Line2,
		City:        d.City,
		State:       d.State,
		ZIP:         d.ZIP,
		Country:     d.Country,
		Coordinates: coordinates,
	}
}

// GeoLocationToDTO converts a BSON GeoLocation model to a JSON DTO.
func GeoLocationToDTO(g *models.GeoLocation) *GeoLocationDTO {
	if g == nil {
		return nil
	}
	return &GeoLocationDTO{
		Latitude:  g.Latitude,
		Longitude: g.Longitude,
	}
}

// ToModel converts a JSON DTO to a BSON GeoLocation model.
func (d *GeoLocationDTO) ToModel() *models.GeoLocation {
	return &models.GeoLocation{
		Latitude:  d.Latitude,
		Longitude: d.Longitude,
	}
}
