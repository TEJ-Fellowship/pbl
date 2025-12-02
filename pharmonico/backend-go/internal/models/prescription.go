package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PrescriptionStatus represents the current state of a prescription
type PrescriptionStatus string

const (
	StatusReceived          PrescriptionStatus = "received"
	StatusValidated         PrescriptionStatus = "validated"
	StatusValidationIssue   PrescriptionStatus = "validation_issue"
	StatusAwaitingEnrollment PrescriptionStatus = "awaiting_enrollment"
	StatusEnrolled          PrescriptionStatus = "enrolled"
	StatusPharmacySelected  PrescriptionStatus = "pharmacy_selected"
	StatusAdjudicated       PrescriptionStatus = "adjudicated"
	StatusAwaitingPayment   PrescriptionStatus = "awaiting_payment"
	StatusPaid              PrescriptionStatus = "paid"
	StatusShipped           PrescriptionStatus = "shipped"
	StatusDelivered         PrescriptionStatus = "delivered"
)

// Prescription represents a prescription in the system
type Prescription struct {
	ID               primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Status           PrescriptionStatus  `bson:"status" json:"status"`
	PatientID        primitive.ObjectID  `bson:"patient_id,omitempty" json:"patient_id,omitempty"`
	PharmacyID       primitive.ObjectID  `bson:"pharmacy_id,omitempty" json:"pharmacy_id,omitempty"`
	
	// NCPDP SCRIPT Data
	Prescriber       PrescriberInfo      `bson:"prescriber" json:"prescriber"`
	Medication       MedicationInfo      `bson:"medication" json:"medication"`
	Patient          PatientInfo         `bson:"patient" json:"patient"`
	
	// Validation
	ValidationErrors []string            `bson:"validation_errors,omitempty" json:"validation_errors,omitempty"`
	
	// Adjudication Results
	Adjudication     *AdjudicationResult `bson:"adjudication,omitempty" json:"adjudication,omitempty"`
	
	// Payment
	PaymentSessionID string              `bson:"payment_session_id,omitempty" json:"payment_session_id,omitempty"`
	PaymentURL       string              `bson:"payment_url,omitempty" json:"payment_url,omitempty"`
	
	// Shipping
	TrackingNumber   string              `bson:"tracking_number,omitempty" json:"tracking_number,omitempty"`
	ShippingLabelURL string              `bson:"shipping_label_url,omitempty" json:"shipping_label_url,omitempty"`
	
	// Timestamps
	CreatedAt        time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time           `bson:"updated_at" json:"updated_at"`
}

// PrescriberInfo contains prescriber/HCP information
type PrescriberInfo struct {
	NPI          string `bson:"npi" json:"npi"`
	DEANumber    string `bson:"dea_number,omitempty" json:"dea_number,omitempty"`
	FirstName    string `bson:"first_name" json:"first_name"`
	LastName     string `bson:"last_name" json:"last_name"`
	Phone        string `bson:"phone,omitempty" json:"phone,omitempty"`
	FaxNumber    string `bson:"fax_number,omitempty" json:"fax_number,omitempty"`
	Address      Address `bson:"address,omitempty" json:"address,omitempty"`
}

// MedicationInfo contains drug/medication details
type MedicationInfo struct {
	NDC          string  `bson:"ndc" json:"ndc"`
	Name         string  `bson:"name" json:"name"`
	Strength     string  `bson:"strength,omitempty" json:"strength,omitempty"`
	Form         string  `bson:"form,omitempty" json:"form,omitempty"` // tablet, capsule, etc.
	Quantity     float64 `bson:"quantity" json:"quantity"`
	DaysSupply   int     `bson:"days_supply,omitempty" json:"days_supply,omitempty"`
	Directions   string  `bson:"directions" json:"directions"`
	Refills      int     `bson:"refills,omitempty" json:"refills,omitempty"`
}

// PatientInfo contains patient demographic information
type PatientInfo struct {
	FirstName    string    `bson:"first_name" json:"first_name"`
	LastName     string    `bson:"last_name" json:"last_name"`
	DateOfBirth  time.Time `bson:"date_of_birth" json:"date_of_birth"`
	Gender       string    `bson:"gender,omitempty" json:"gender,omitempty"`
	Phone        string    `bson:"phone,omitempty" json:"phone,omitempty"`
	Email        string    `bson:"email,omitempty" json:"email,omitempty"`
	Address      Address   `bson:"address" json:"address"`
}

// Address represents a physical address
type Address struct {
	Street1    string `bson:"street1" json:"street1"`
	Street2    string `bson:"street2,omitempty" json:"street2,omitempty"`
	City       string `bson:"city" json:"city"`
	State      string `bson:"state" json:"state"`
	ZipCode    string `bson:"zip_code" json:"zip_code"`
	Country    string `bson:"country,omitempty" json:"country,omitempty"`
}

// AdjudicationResult contains insurance claim results
type AdjudicationResult struct {
	Reimbursement   float64   `bson:"reimbursement" json:"reimbursement"`
	CouponAmount    float64   `bson:"coupon_amount" json:"coupon_amount"`
	PatientCopay    float64   `bson:"patient_copay" json:"patient_copay"`
	ProcessedAt     time.Time `bson:"processed_at" json:"processed_at"`
}

