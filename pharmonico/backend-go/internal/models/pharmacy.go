package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Pharmacy represents a partner pharmacy
type Pharmacy struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name              string             `bson:"name" json:"name"`
	NPI               string             `bson:"npi" json:"npi"`
	NCPDPID           string             `bson:"ncpdp_id,omitempty" json:"ncpdp_id,omitempty"`
	Phone             string             `bson:"phone" json:"phone"`
	Fax               string             `bson:"fax,omitempty" json:"fax,omitempty"`
	Email             string             `bson:"email,omitempty" json:"email,omitempty"`
	Address           Address            `bson:"address" json:"address"`
	Location          GeoLocation        `bson:"location" json:"location"`
	AcceptedInsurers  []string           `bson:"accepted_insurers" json:"accepted_insurers"`
	SpecialtyTypes    []string           `bson:"specialty_types,omitempty" json:"specialty_types,omitempty"`
	CurrentCapacity   int                `bson:"current_capacity" json:"current_capacity"`
	MaxCapacity       int                `bson:"max_capacity" json:"max_capacity"`
	IsActive          bool               `bson:"is_active" json:"is_active"`
	OperatingHours    OperatingHours     `bson:"operating_hours,omitempty" json:"operating_hours,omitempty"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}

// GeoLocation represents geographic coordinates
type GeoLocation struct {
	Type        string    `bson:"type" json:"type"` // "Point"
	Coordinates []float64 `bson:"coordinates" json:"coordinates"` // [longitude, latitude]
}

// OperatingHours represents pharmacy hours of operation
type OperatingHours struct {
	Monday    DayHours `bson:"monday,omitempty" json:"monday,omitempty"`
	Tuesday   DayHours `bson:"tuesday,omitempty" json:"tuesday,omitempty"`
	Wednesday DayHours `bson:"wednesday,omitempty" json:"wednesday,omitempty"`
	Thursday  DayHours `bson:"thursday,omitempty" json:"thursday,omitempty"`
	Friday    DayHours `bson:"friday,omitempty" json:"friday,omitempty"`
	Saturday  DayHours `bson:"saturday,omitempty" json:"saturday,omitempty"`
	Sunday    DayHours `bson:"sunday,omitempty" json:"sunday,omitempty"`
}

// DayHours represents hours for a single day
type DayHours struct {
	Open  string `bson:"open,omitempty" json:"open,omitempty"`   // "09:00"
	Close string `bson:"close,omitempty" json:"close,omitempty"` // "18:00"
}

// PharmacyRecommendation represents a scored pharmacy recommendation
type PharmacyRecommendation struct {
	Pharmacy       Pharmacy `json:"pharmacy"`
	Score          float64  `json:"score"`
	DistanceMiles  float64  `json:"distance_miles"`
	CapacityScore  float64  `json:"capacity_score"`
	InsuranceMatch bool     `json:"insurance_match"`
}

