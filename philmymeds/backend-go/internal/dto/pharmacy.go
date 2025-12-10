package dto

import (
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PharmacyDTO represents a partner pharmacy for API responses (JSON model).
type PharmacyDTO struct {
	ID                 string                 `json:"id"`
	Name               string                 `json:"name" validate:"required"`
	LicenseNumber      string                 `json:"license_number" validate:"required"`
	NPI                string                 `json:"npi" validate:"required,len=10"`
	Address            AddressDTO             `json:"address" validate:"required"`
	Phone              string                 `json:"phone" validate:"required"`
	Email              string                 `json:"email" validate:"email"`
	Capabilities       PharmacyCapabilityDTO  `json:"capabilities"`
	InsuranceContracts []InsuranceContractDTO `json:"insurance_contracts"`
	Capacity           PharmacyCapacityDTO    `json:"capacity"`
	Performance        PharmacyPerformanceDTO `json:"performance"`
	Status             string                 `json:"status" validate:"required,oneof=active inactive suspended"` // active/inactive/suspended
	APIEndpoint        string                 `json:"api_endpoint,omitempty"`                                     // For real-time integration
	HasRealtimeAPI     bool                   `json:"has_realtime_api"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at"`
}

// PharmacyCapabilityDTO defines what the pharmacy can handle (JSON model).
type PharmacyCapabilityDTO struct {
	SpecialtyPharmacy    bool     `json:"specialty_pharmacy"`
	ColdChain            bool     `json:"cold_chain"`            // Refrigerated drugs
	ControlledSubstances bool     `json:"controlled_substances"` // DEA requirements
	Compounding          bool     `json:"compounding"`           // Custom formulations
	SpecialtyDrugs       []string `json:"specialty_drugs"`       // List of NDC codes
	MaxDaysSupply        int      `json:"max_days_supply"`       // Default: 90
}

// InsuranceContractDTO represents pharmacy's contract with a payer (JSON model).
type InsuranceContractDTO struct {
	Payer         string    `json:"payer" validate:"required"` // e.g., "Blue Cross Blue Shield"
	NetworkTier   string    `json:"network_tier" validate:"oneof=preferred standard out_of_network"`
	ContractStart time.Time `json:"contract_start"`
	ContractEnd   time.Time `json:"contract_end"`
	IsActive      bool      `json:"is_active"`
}

// PharmacyCapacityDTO tracks pharmacy workload (JSON model).
type PharmacyCapacityDTO struct {
	MaxDailyRx         int `json:"max_daily_rx"`         // Max prescriptions per day
	CurrentDailyRx     int `json:"current_daily_rx"`     // Current count today
	MaxConcurrentFills int `json:"max_concurrent_fills"` // Max active fills
	CurrentConcurrent  int `json:"current_concurrent"`   // Currently being filled
}

// PharmacyPerformanceDTO tracks pharmacy quality metrics (JSON model).
type PharmacyPerformanceDTO struct {
	AvgFulfillmentTimeHours float64 `json:"avg_fulfillment_time_hours"` // Average time to fill
	FillAccuracyRate        float64 `json:"fill_accuracy_rate"`         // 0.0-1.0
	CustomerSatisfaction    float64 `json:"customer_satisfaction"`      // 1.0-5.0
	OnTimeDeliveryRate      float64 `json:"on_time_delivery_rate"`      // 0.0-1.0
}

// ToDTO converts a BSON Pharmacy model to a JSON DTO.
func PharmacyToDTO(p *models.Pharmacy) *PharmacyDTO {
	if p == nil {
		return nil
	}

	contracts := make([]InsuranceContractDTO, len(p.InsuranceContracts))
	for i, c := range p.InsuranceContracts {
		contracts[i] = *InsuranceContractToDTO(&c)
	}

	return &PharmacyDTO{
		ID:                 p.ID.Hex(),
		Name:               p.Name,
		LicenseNumber:      p.LicenseNumber,
		NPI:                p.NPI,
		Address:            *AddressToDTO(&p.Address),
		Phone:              p.Phone,
		Email:              p.Email,
		Capabilities:       *PharmacyCapabilityToDTO(&p.Capabilities),
		InsuranceContracts: contracts,
		Capacity:           *PharmacyCapacityToDTO(&p.Capacity),
		Performance:        *PharmacyPerformanceToDTO(&p.Performance),
		Status:             p.Status,
		APIEndpoint:        p.APIEndpoint,
		HasRealtimeAPI:     p.HasRealtimeAPI,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}
}

// ToModel converts a JSON DTO to a BSON Pharmacy model.
func (d *PharmacyDTO) ToModel() (*models.Pharmacy, error) {
	pharmacyID := primitive.NilObjectID
	if d.ID != "" {
		var err error
		pharmacyID, err = primitive.ObjectIDFromHex(d.ID)
		if err != nil {
			return nil, err
		}
	}

	contracts := make([]models.InsuranceContract, len(d.InsuranceContracts))
	for i, c := range d.InsuranceContracts {
		contracts[i] = *c.ToModel()
	}

	return &models.Pharmacy{
		ID:                 pharmacyID,
		Name:               d.Name,
		LicenseNumber:      d.LicenseNumber,
		NPI:                d.NPI,
		Address:            *d.Address.ToModel(),
		Phone:              d.Phone,
		Email:              d.Email,
		Capabilities:       *d.Capabilities.ToModel(),
		InsuranceContracts: contracts,
		Capacity:           *d.Capacity.ToModel(),
		Performance:        *d.Performance.ToModel(),
		Status:             d.Status,
		APIEndpoint:        d.APIEndpoint,
		HasRealtimeAPI:     d.HasRealtimeAPI,
		CreatedAt:          d.CreatedAt,
		UpdatedAt:          d.UpdatedAt,
	}, nil
}

// PharmacyCapabilityToDTO converts a BSON PharmacyCapability model to a JSON DTO.
func PharmacyCapabilityToDTO(p *models.PharmacyCapability) *PharmacyCapabilityDTO {
	if p == nil {
		return nil
	}
	return &PharmacyCapabilityDTO{
		SpecialtyPharmacy:    p.SpecialtyPharmacy,
		ColdChain:            p.ColdChain,
		ControlledSubstances: p.ControlledSubstances,
		Compounding:          p.Compounding,
		SpecialtyDrugs:       p.SpecialtyDrugs,
		MaxDaysSupply:        p.MaxDaysSupply,
	}
}

// ToModel converts a JSON DTO to a BSON PharmacyCapability model.
func (d *PharmacyCapabilityDTO) ToModel() *models.PharmacyCapability {
	return &models.PharmacyCapability{
		SpecialtyPharmacy:    d.SpecialtyPharmacy,
		ColdChain:            d.ColdChain,
		ControlledSubstances: d.ControlledSubstances,
		Compounding:          d.Compounding,
		SpecialtyDrugs:       d.SpecialtyDrugs,
		MaxDaysSupply:        d.MaxDaysSupply,
	}
}

// InsuranceContractToDTO converts a BSON InsuranceContract model to a JSON DTO.
func InsuranceContractToDTO(i *models.InsuranceContract) *InsuranceContractDTO {
	if i == nil {
		return nil
	}
	return &InsuranceContractDTO{
		Payer:         i.Payer,
		NetworkTier:   i.NetworkTier,
		ContractStart: i.ContractStart,
		ContractEnd:   i.ContractEnd,
		IsActive:      i.IsActive,
	}
}

// ToModel converts a JSON DTO to a BSON InsuranceContract model.
func (d *InsuranceContractDTO) ToModel() *models.InsuranceContract {
	return &models.InsuranceContract{
		Payer:         d.Payer,
		NetworkTier:   d.NetworkTier,
		ContractStart: d.ContractStart,
		ContractEnd:   d.ContractEnd,
		IsActive:      d.IsActive,
	}
}

// PharmacyCapacityToDTO converts a BSON PharmacyCapacity model to a JSON DTO.
func PharmacyCapacityToDTO(p *models.PharmacyCapacity) *PharmacyCapacityDTO {
	if p == nil {
		return nil
	}
	return &PharmacyCapacityDTO{
		MaxDailyRx:         p.MaxDailyRx,
		CurrentDailyRx:     p.CurrentDailyRx,
		MaxConcurrentFills: p.MaxConcurrentFills,
		CurrentConcurrent:  p.CurrentConcurrent,
	}
}

// ToModel converts a JSON DTO to a BSON PharmacyCapacity model.
func (d *PharmacyCapacityDTO) ToModel() *models.PharmacyCapacity {
	return &models.PharmacyCapacity{
		MaxDailyRx:         d.MaxDailyRx,
		CurrentDailyRx:     d.CurrentDailyRx,
		MaxConcurrentFills: d.MaxConcurrentFills,
		CurrentConcurrent:  d.CurrentConcurrent,
	}
}

// PharmacyPerformanceToDTO converts a BSON PharmacyPerformance model to a JSON DTO.
func PharmacyPerformanceToDTO(p *models.PharmacyPerformance) *PharmacyPerformanceDTO {
	if p == nil {
		return nil
	}
	return &PharmacyPerformanceDTO{
		AvgFulfillmentTimeHours: p.AvgFulfillmentTimeHours,
		FillAccuracyRate:        p.FillAccuracyRate,
		CustomerSatisfaction:    p.CustomerSatisfaction,
		OnTimeDeliveryRate:      p.OnTimeDeliveryRate,
	}
}

// ToModel converts a JSON DTO to a BSON PharmacyPerformance model.
func (d *PharmacyPerformanceDTO) ToModel() *models.PharmacyPerformance {
	return &models.PharmacyPerformance{
		AvgFulfillmentTimeHours: d.AvgFulfillmentTimeHours,
		FillAccuracyRate:        d.FillAccuracyRate,
		CustomerSatisfaction:    d.CustomerSatisfaction,
		OnTimeDeliveryRate:      d.OnTimeDeliveryRate,
	}
}
