package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ============================================
// CORE ENTITIES
// ============================================

// Patient represents a patient in the system
type Patient struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	FirstName          string             `bson:"first_name" validate:"required"`
	LastName           string             `bson:"last_name" validate:"required"`
	DateOfBirth        string             `bson:"date_of_birth" validate:"required"`     // Format: YYYY-MM-DD
	Sex                string             `bson:"sex" validate:"required,oneof=M F O U"` // M/F/O/U
	Email              string             `bson:"email" validate:"required,email"`
	Phone              string             `bson:"phone" validate:"required"`
	Address            Address            `bson:"address" validate:"required"`
	InsuranceProfileID primitive.ObjectID `bson:"insurance_profile_id,omitempty"`
	CreatedAt          time.Time          `bson:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at"`
}

// Address represents a physical address
type Address struct {
	Line1       string      `bson:"line1" validate:"required"`
	Line2       string      `bson:"line2,omitempty"`
	City        string      `bson:"city" validate:"required"`
	State       string      `bson:"state" validate:"required,len=2"` // Two-letter state code
	ZIP         string      `bson:"zip" validate:"required"`
	Country     string      `bson:"country" validate:"required"` // Default: "US"
	Coordinates GeoLocation `bson:"coordinates,omitempty"`
}

// GeoLocation represents latitude/longitude coordinates
type GeoLocation struct {
	Latitude  float64 `bson:"lat"`
	Longitude float64 `bson:"lng"`
}

// Prescriber represents a healthcare provider
type Prescriber struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	FirstName   string             `bson:"first_name" validate:"required"`
	LastName    string             `bson:"last_name" validate:"required"`
	NPI         string             `bson:"npi" validate:"required,len=10"` // 10-digit NPI
	DEA         string             `bson:"dea,omitempty"`                  // For controlled substances
	ClinicName  string             `bson:"clinic_name"`
	ClinicPhone string             `bson:"clinic_phone" validate:"required"`
	Address     Address            `bson:"address" validate:"required"`
	Specialty   string             `bson:"specialty,omitempty"`
	CreatedAt   time.Time          `bson:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"`
}

// Pharmacy represents a partner pharmacy
type Pharmacy struct {
	ID                 primitive.ObjectID  `bson:"_id,omitempty"`
	Name               string              `bson:"name" validate:"required"`
	LicenseNumber      string              `bson:"license_number" validate:"required"`
	NPI                string              `bson:"npi" validate:"required,len=10"`
	Address            Address             `bson:"address" validate:"required"`
	Phone              string              `bson:"phone" validate:"required"`
	Email              string              `bson:"email" validate:"email"`
	Capabilities       PharmacyCapability  `bson:"capabilities"`
	InsuranceContracts []InsuranceContract `bson:"insurance_contracts"`
	Capacity           PharmacyCapacity    `bson:"capacity"`
	Performance        PharmacyPerformance `bson:"performance"`
	Status             string              `bson:"status" validate:"required,oneof=active inactive suspended"` // active/inactive/suspended
	APIEndpoint        string              `bson:"api_endpoint,omitempty"`                                     // For real-time integration
	HasRealtimeAPI     bool                `bson:"has_realtime_api"`
	CreatedAt          time.Time           `bson:"created_at"`
	UpdatedAt          time.Time           `bson:"updated_at"`
}

// PharmacyCapability defines what the pharmacy can handle
type PharmacyCapability struct {
	SpecialtyPharmacy    bool     `bson:"specialty_pharmacy"`
	ColdChain            bool     `bson:"cold_chain"`            // Refrigerated drugs
	ControlledSubstances bool     `bson:"controlled_substances"` // DEA requirements
	Compounding          bool     `bson:"compounding"`           // Custom formulations
	SpecialtyDrugs       []string `bson:"specialty_drugs"`       // List of NDC codes
	MaxDaysSupply        int      `bson:"max_days_supply"`       // Default: 90
}

// InsuranceContract represents pharmacy's contract with a payer
type InsuranceContract struct {
	Payer         string    `bson:"payer" validate:"required"`                                       // e.g., "Blue Cross Blue Shield"
	NetworkTier   string    `bson:"network_tier" validate:"oneof=preferred standard out_of_network"` // preferred/standard/out_of_network
	ContractStart time.Time `bson:"contract_start"`
	ContractEnd   time.Time `bson:"contract_end"`
	IsActive      bool      `bson:"is_active"`
}

// PharmacyCapacity tracks pharmacy workload
type PharmacyCapacity struct {
	MaxDailyRx         int `bson:"max_daily_rx"`         // Max prescriptions per day
	CurrentDailyRx     int `bson:"current_daily_rx"`     // Current count today
	MaxConcurrentFills int `bson:"max_concurrent_fills"` // Max active fills
	CurrentConcurrent  int `bson:"current_concurrent"`   // Currently being filled
}

// PharmacyPerformance tracks pharmacy quality metrics
type PharmacyPerformance struct {
	AvgFulfillmentTimeHours float64 `bson:"avg_fulfillment_time_hours"` // Average time to fill
	FillAccuracyRate        float64 `bson:"fill_accuracy_rate"`         // 0.0-1.0
	CustomerSatisfaction    float64 `bson:"customer_satisfaction"`      // 1.0-5.0
	OnTimeDeliveryRate      float64 `bson:"on_time_delivery_rate"`      // 0.0-1.0
}

// InsuranceProfile stores patient insurance information
type InsuranceProfile struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	PatientID    primitive.ObjectID `bson:"patient_id"`
	PayerName    string             `bson:"payer_name" validate:"required"` // Insurance company name
	MemberID     string             `bson:"member_id" validate:"required"`  // Member/Subscriber ID
	GroupNumber  string             `bson:"group_number,omitempty"`         // Group ID
	BIN          string             `bson:"bin" validate:"required,len=6"`  // 6-digit BIN
	PCN          string             `bson:"pcn,omitempty"`                  // Processor Control Number
	PlanType     string             `bson:"plan_type"`                      // commercial/medicare/medicaid/etc
	IsGovernment bool               `bson:"is_government"`                  // True for Medicare/Medicaid/VA/TRICARE
	CardFrontURL string             `bson:"card_front_url,omitempty"`
	CardBackURL  string             `bson:"card_back_url,omitempty"`
	VerifiedAt   *time.Time         `bson:"verified_at,omitempty"`
	CreatedAt    time.Time          `bson:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"`
}

// ============================================
// PRESCRIPTION (ORDER) ENTITY
// ============================================

// Prescription represents the main prescription order entity
// Note: Previously called "Order" but renamed to "Prescription" for clarity
type Prescription struct {
	ID                      primitive.ObjectID       `bson:"_id,omitempty"`
	PrescriptionNumber      string                   `bson:"prescription_number" validate:"required"` // Human-readable ID
	Status                  string                   `bson:"status" validate:"required"`              // See PrescriptionStatus constants
	StatusHistory           []StatusEntry            `bson:"status_history"`
	PatientID               primitive.ObjectID       `bson:"patient_id" validate:"required"`
	PrescriberID            primitive.ObjectID       `bson:"prescriber_id" validate:"required"`
	Medication              Medication               `bson:"medication" validate:"required"`
	NCPDPRawFileID          primitive.ObjectID       `bson:"ncpdp_raw_file_id,omitempty"`
	ValidationErrors        []ValidationError        `bson:"validation_errors,omitempty"`
	ValidationChecks        ValidationChecks         `bson:"validation_checks,omitempty"`
	ValidatedAt             *time.Time               `bson:"validated_at,omitempty"`
	EnrollmentID            primitive.ObjectID       `bson:"enrollment_id,omitempty"`
	EnrollmentCompletedAt   *time.Time               `bson:"enrollment_completed_at,omitempty"`
	PharmacyRecommendations []PharmacyRecommendation `bson:"pharmacy_recommendations,omitempty"`
	SelectedPharmacyID      primitive.ObjectID       `bson:"selected_pharmacy_id,omitempty"`
	PharmacySelectedAt      *time.Time               `bson:"pharmacy_selected_at,omitempty"`
	PharmacySelectedBy      string                   `bson:"pharmacy_selected_by,omitempty"` // ops user ID
	AdjudicationID          primitive.ObjectID       `bson:"adjudication_id,omitempty"`
	AdjudicatedAt           *time.Time               `bson:"adjudicated_at,omitempty"`
	PaymentID               primitive.ObjectID       `bson:"payment_id,omitempty"`
	PaidAt                  *time.Time               `bson:"paid_at,omitempty"`
	ShipmentID              primitive.ObjectID       `bson:"shipment_id,omitempty"`
	ShippedAt               *time.Time               `bson:"shipped_at,omitempty"`
	DeliveredAt             *time.Time               `bson:"delivered_at,omitempty"`
	Notes                   string                   `bson:"notes,omitempty"`
	CreatedAt               time.Time                `bson:"created_at"`
	UpdatedAt               time.Time                `bson:"updated_at"`
}

// Prescription Status Constants
const (
	StatusReceived                  = "received"
	StatusValidating                = "validating"
	StatusValidationFailed          = "validation_failed"
	StatusValidated                 = "validated"
	StatusAwaitingEnrollment        = "awaiting_enrollment"
	StatusEnrolling                 = "enrolling"
	StatusEnrolled                  = "enrolled"
	StatusAwaitingPharmacySelection = "awaiting_pharmacy_selection"
	StatusPharmacySelected          = "pharmacy_selected"
	StatusAwaitingAdjudication      = "awaiting_adjudication"
	StatusAdjudicating              = "adjudicating"
	StatusPriorAuthRequired         = "prior_auth_required"
	StatusPriorAuthPending          = "prior_auth_pending"
	StatusAdjudicated               = "adjudicated"
	StatusAwaitingPayment           = "awaiting_payment"
	StatusPaymentPending            = "payment_pending"
	StatusPaid                      = "paid"
	StatusFulfilling                = "fulfilling"
	StatusShipped                   = "shipped"
	StatusInTransit                 = "in_transit"
	StatusDelivered                 = "delivered"
	StatusCompleted                 = "completed"
	StatusCancelled                 = "cancelled"
	StatusOnHold                    = "on_hold"
)

// StatusEntry tracks status changes over time
type StatusEntry struct {
	Status    string    `bson:"status" validate:"required"`
	Reason    string    `bson:"reason,omitempty"`
	UpdatedBy string    `bson:"updated_by,omitempty"` // user ID or "system"
	Timestamp time.Time `bson:"timestamp"`
}

// Medication represents prescription medication details
type Medication struct {
	DrugName          string `bson:"drug_name" validate:"required"`
	BrandName         string `bson:"brand_name,omitempty"`
	GenericName       string `bson:"generic_name,omitempty"`
	NDC               string `bson:"ndc" validate:"required"`      // National Drug Code
	Strength          string `bson:"strength" validate:"required"` // e.g., "40mg/0.8mL"
	Dosage            string `bson:"dosage" validate:"required"`   // e.g., "40mg"
	Form              string `bson:"form"`                         // tablet/capsule/injection/etc
	Route             string `bson:"route"`                        // oral/subcutaneous/IV/etc
	SIG               string `bson:"sig" validate:"required"`      // Directions for use
	Quantity          int    `bson:"quantity" validate:"required,gt=0"`
	DaysSupply        int    `bson:"days_supply" validate:"required,gt=0"`
	Refills           int    `bson:"refills" validate:"min=0"`
	IsControlled      bool   `bson:"is_controlled"`
	DEASchedule       string `bson:"dea_schedule,omitempty"` // C-II, C-III, etc
	RequiresColdChain bool   `bson:"requires_cold_chain"`
	DAW               int    `bson:"daw"` // Dispense As Written code (0-9)
}

// ValidationError represents a validation failure
type ValidationError struct {
	Field    string `bson:"field"`    // Which field failed
	Error    string `bson:"error"`    // Error message
	Severity string `bson:"severity"` // critical/warning/info
}

// ValidationChecks tracks which validations passed
type ValidationChecks struct {
	NPIValid        bool `bson:"npi_valid"`
	DEAValid        bool `bson:"dea_valid"`
	NDCValid        bool `bson:"ndc_valid"`
	RequiredFields  bool `bson:"required_fields"`
	SIGFormat       bool `bson:"sig_format"`
	QuantityValid   bool `bson:"quantity_valid"`
	DaysSupplyValid bool `bson:"days_supply_valid"`
}

// PharmacyRecommendation represents a scored pharmacy option
type PharmacyRecommendation struct {
	PharmacyID         primitive.ObjectID `bson:"pharmacy_id"`
	PharmacyName       string             `bson:"pharmacy_name"`
	Location           Address            `bson:"location"`
	DistanceMiles      float64            `bson:"distance_miles"`
	InsuranceNetwork   string             `bson:"insurance_network"` // preferred/standard/out_of_network
	Score              PharmacyScore      `bson:"score"`
	EstimatedFillTime  string             `bson:"estimated_fill_time"` // e.g., "24 hours"
	CapacityAvailable  bool               `bson:"capacity_available"`
	RecommendationRank int                `bson:"recommendation_rank"` // 1-5
}

// PharmacyScore represents the scoring breakdown
type PharmacyScore struct {
	TotalScore float64            `bson:"total_score"` // 0.0-1.0
	Breakdown  map[string]float64 `bson:"breakdown"`   // distance: 0.26, network: 0.25, etc
}

// ============================================
// ENROLLMENT
// ============================================

// Enrollment represents patient enrollment process
type Enrollment struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	PrescriptionID     primitive.ObjectID `bson:"prescription_id" validate:"required"`
	PatientID          primitive.ObjectID `bson:"patient_id" validate:"required"`
	MagicLinkToken     string             `bson:"magic_link_token" validate:"required"`
	TokenExpiresAt     time.Time          `bson:"token_expires_at"`
	TokenUsed          bool               `bson:"token_used"`
	InsuranceProfileID primitive.ObjectID `bson:"insurance_profile_id,omitempty"`
	InsuranceVerified  bool               `bson:"insurance_verified"`
	HIPAAConsent       bool               `bson:"hipaa_consent"`
	HIPAAConsentText   string             `bson:"hipaa_consent_text,omitempty"`
	SignatureDataURL   string             `bson:"signature_data_url,omitempty"` // Base64 signature image
	SignatureName      string             `bson:"signature_name,omitempty"`
	SignatureDate      *time.Time         `bson:"signature_date,omitempty"`
	SignatureIPAddress string             `bson:"signature_ip_address,omitempty"`
	IncomeRange        string             `bson:"income_range,omitempty"` // e.g., "50000-75000"
	IncomeAttested     bool               `bson:"income_attested"`
	Status             string             `bson:"status"` // pending/in_progress/completed/expired
	CompletedAt        *time.Time         `bson:"completed_at,omitempty"`
	CreatedAt          time.Time          `bson:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at"`
}

// ============================================
// MANUFACTURER PROGRAMS
// ============================================

// ManufacturerProgram represents a copay assistance program
// This data is used by pharmacy during adjudication
type ManufacturerProgram struct {
	ID                   primitive.ObjectID   `bson:"_id,omitempty"`
	ProgramCode          string               `bson:"program_code" validate:"required"` // Unique code
	ProgramName          string               `bson:"program_name" validate:"required"`
	Manufacturer         ManufacturerInfo     `bson:"manufacturer"`
	Drug                 DrugMapping          `bson:"drug"`
	ProgramCredentials   ProgramCredentials   `bson:"program_credentials"`
	ProgramType          string               `bson:"program_type"` // copay_card/voucher/patient_assistance
	MaxAnnualBenefit     float64              `bson:"max_annual_benefit"`
	MaxPerPrescription   float64              `bson:"max_per_prescription"`
	CopayReductionMethod string               `bson:"copay_reduction_method"`        // reduce_to_amount/percentage_off/pay_first
	TargetCopay          float64              `bson:"target_copay,omitempty"`        // e.g., $5
	DiscountPercentage   float64              `bson:"discount_percentage,omitempty"` // e.g., 0.75 for 75% off
	EligibilityRules     ProgramEligibility   `bson:"eligibility_rules"`
	AdjudicationEndpoint AdjudicationEndpoint `bson:"adjudication_endpoint"`
	Status               string               `bson:"status"` // active/inactive/suspended
	EffectiveDates       EffectiveDates       `bson:"effective_dates"`
	TermsURL             string               `bson:"terms_url,omitempty"`
	CreatedAt            time.Time            `bson:"created_at"`
	UpdatedAt            time.Time            `bson:"updated_at"`
}

// ManufacturerInfo represents the drug manufacturer
type ManufacturerInfo struct {
	ID   string `bson:"id"`   // e.g., "mfr_abbvie"
	Name string `bson:"name"` // e.g., "AbbVie Inc."
}

// DrugMapping maps program to specific drugs
type DrugMapping struct {
	NDC              string `bson:"ndc" validate:"required"` // National Drug Code
	BrandName        string `bson:"brand_name"`              // e.g., "Humira"
	GenericName      string `bson:"generic_name,omitempty"`
	GenericAvailable bool   `bson:"generic_available"`
}

// ProgramCredentials used by pharmacy to submit secondary claim
type ProgramCredentials struct {
	BIN     string `bson:"bin" validate:"required,len=6"` // e.g., "004682"
	PCN     string `bson:"pcn" validate:"required"`       // e.g., "CNRX"
	GroupID string `bson:"group_id,omitempty"`            // e.g., "HUMIRA"
}

// ProgramEligibility defines who can use the program
type ProgramEligibility struct {
	InsuranceTypesAllowed     []string      `bson:"insurance_types_allowed"`     // ["commercial", "marketplace"]
	InsuranceTypesExcluded    []string      `bson:"insurance_types_excluded"`    // ["medicare", "medicaid", "tricare", "va"]
	RequiresCommercialPrimary bool          `bson:"requires_commercial_primary"` // True: Must have commercial insurance
	AgeMinimum                int           `bson:"age_minimum,omitempty"`       // e.g., 18
	AgeMaximum                int           `bson:"age_maximum,omitempty"`
	IncomeLimits              *IncomeLimits `bson:"income_limits,omitempty"`   // For PAPs
	DiagnosisCodes            []string      `bson:"diagnosis_codes,omitempty"` // ICD-10 codes
	PriorAuthAcceptable       bool          `bson:"prior_auth_acceptable"`
}

// IncomeLimits for patient assistance programs
type IncomeLimits struct {
	MaxHouseholdIncome  float64 `bson:"max_household_income"`  // Annual
	FederalPovertyLevel float64 `bson:"federal_poverty_level"` // Percentage, e.g., 400 = 400% FPL
}

// AdjudicationEndpoint for pharmacy to connect
type AdjudicationEndpoint struct {
	Type string `bson:"type"` // ncpdp_telecom/rest_api/legacy
	Host string `bson:"host"` // e.g., "claims.abbviecopay.com"
	Port int    `bson:"port"` // e.g., 8080
}

// EffectiveDates for program validity period
type EffectiveDates struct {
	Start time.Time `bson:"start"`
	End   time.Time `bson:"end"`
}

// ============================================
// ADJUDICATION (Done by Pharmacy)
// ============================================

// Adjudication represents the complete adjudication result
// This includes BOTH primary insurance AND manufacturer program results
type Adjudication struct {
	ID                   primitive.ObjectID         `bson:"_id,omitempty"`
	PrescriptionID       primitive.ObjectID         `bson:"prescription_id" validate:"required"`
	PharmacyID           primitive.ObjectID         `bson:"pharmacy_id" validate:"required"`
	PrimaryInsurance     PrimaryInsuranceClaim      `bson:"primary_insurance"`
	PriorAuthRequired    bool                       `bson:"prior_auth_required"`
	PriorAuthID          primitive.ObjectID         `bson:"prior_auth_id,omitempty"`
	ManufacturerPrograms []ManufacturerProgramClaim `bson:"manufacturer_programs"`
	CostBreakdown        CostBreakdown              `bson:"cost_breakdown"`
	Status               string                     `bson:"status"` // pending/completed/failed
	CompletedAt          *time.Time                 `bson:"completed_at,omitempty"`
	CreatedAt            time.Time                  `bson:"created_at"`
	UpdatedAt            time.Time                  `bson:"updated_at"`
}

// PrimaryInsuranceClaim represents the primary insurance adjudication
type PrimaryInsuranceClaim struct {
	ClaimID         string                 `bson:"claim_id"`
	PayerName       string                 `bson:"payer_name"`
	SubmittedAt     time.Time              `bson:"submitted_at"`
	RespondedAt     *time.Time             `bson:"responded_at,omitempty"`
	Status          string                 `bson:"status"` // approved/rejected/pending
	RejectionReason string                 `bson:"rejection_reason,omitempty"`
	DrugCost        float64                `bson:"drug_cost"`              // AWP or WAC
	InsurancePaid   float64                `bson:"insurance_paid"`         // What insurance covers
	PatientCopay    float64                `bson:"patient_copay"`          // Before manufacturer discount
	RawResponse     map[string]interface{} `bson:"raw_response,omitempty"` // Full NCPDP response
}

// ManufacturerProgramClaim represents manufacturer program adjudication
type ManufacturerProgramClaim struct {
	ProgramID        primitive.ObjectID     `bson:"program_id"`
	ProgramName      string                 `bson:"program_name"`
	ProgramBIN       string                 `bson:"program_bin"`
	ProgramPCN       string                 `bson:"program_pcn"`
	SubmittedAt      time.Time              `bson:"submitted_at"`
	RespondedAt      *time.Time             `bson:"responded_at,omitempty"`
	Status           string                 `bson:"status"` // approved/rejected/pending
	ApprovalCode     string                 `bson:"approval_code,omitempty"`
	RejectionReason  string                 `bson:"rejection_reason,omitempty"`
	DiscountAmount   float64                `bson:"discount_amount"`             // Amount covered by program
	ReducedCopay     float64                `bson:"reduced_copay"`               // Final patient copay
	RemainingBenefit float64                `bson:"remaining_benefit,omitempty"` // Remaining annual benefit
	RawResponse      map[string]interface{} `bson:"raw_response,omitempty"`
}

// CostBreakdown represents the final cost calculation
type CostBreakdown struct {
	TotalDrugCost        float64  `bson:"total_drug_cost"`       // Original drug cost
	InsuranceCovered     float64  `bson:"insurance_covered"`     // Insurance payment
	InitialCopay         float64  `bson:"initial_copay"`         // Before manufacturer discount
	ManufacturerDiscount float64  `bson:"manufacturer_discount"` // Total program discount
	FinalPatientCopay    float64  `bson:"final_patient_copay"`   // What patient actually pays
	PatientSavings       float64  `bson:"patient_savings"`       // Total savings
	ProgramsApplied      []string `bson:"programs_applied"`      // List of program names
}

// ============================================
// PRIOR AUTHORIZATION
// ============================================

// PriorAuthorization represents PA workflow
type PriorAuthorization struct {
	ID             primitive.ObjectID   `bson:"_id,omitempty"`
	PrescriptionID primitive.ObjectID   `bson:"prescription_id" validate:"required"`
	PayerName      string               `bson:"payer_name" validate:"required"`
	RequestedAt    time.Time            `bson:"requested_at"`
	RequestedBy    string               `bson:"requested_by"` // prescriber NPI or pharmacy
	RequestReason  string               `bson:"request_reason"`
	DiagnosisCodes []string             `bson:"diagnosis_codes"` // ICD-10
	ClinicalNotes  string               `bson:"clinical_notes,omitempty"`
	SupportingDocs []primitive.ObjectID `bson:"supporting_docs,omitempty"` // FileAsset IDs
	Status         string               `bson:"status"`                    // pending/approved/denied/more_info_needed
	ApprovalCode   string               `bson:"approval_code,omitempty"`
	DenialReason   string               `bson:"denial_reason,omitempty"`
	RespondedAt    *time.Time           `bson:"responded_at,omitempty"`
	ExpiresAt      *time.Time           `bson:"expires_at,omitempty"`
	AppealID       primitive.ObjectID   `bson:"appeal_id,omitempty"`
	CreatedAt      time.Time            `bson:"created_at"`
	UpdatedAt      time.Time            `bson:"updated_at"`
}

// ============================================
// PAYMENT
// ============================================

// Payment represents payment processing
type Payment struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty"`
	PrescriptionID        primitive.ObjectID `bson:"prescription_id" validate:"required"`
	PatientID             primitive.ObjectID `bson:"patient_id" validate:"required"`
	Amount                float64            `bson:"amount" validate:"required,gt=0"` // Final copay amount
	Currency              string             `bson:"currency"`                        // "USD"
	StripePaymentLink     string             `bson:"stripe_payment_link,omitempty"`
	StripeSessionID       string             `bson:"stripe_session_id,omitempty"`
	StripePaymentIntentID string             `bson:"stripe_payment_intent_id,omitempty"`
	Status                string             `bson:"status"`                   // pending/completed/failed/refunded/cancelled
	PaymentMethod         string             `bson:"payment_method,omitempty"` // card/ach/etc
	LinkCreatedAt         time.Time          `bson:"link_created_at"`
	LinkExpiresAt         time.Time          `bson:"link_expires_at"`
	PaidAt                *time.Time         `bson:"paid_at,omitempty"`
	ReceiptURL            string             `bson:"receipt_url,omitempty"`
	RefundID              primitive.ObjectID `bson:"refund_id,omitempty"`
	RefundAmount          float64            `bson:"refund_amount,omitempty"`
	RefundedAt            *time.Time         `bson:"refunded_at,omitempty"`
	CreatedAt             time.Time          `bson:"created_at"`
	UpdatedAt             time.Time          `bson:"updated_at"`
}

// ============================================
// SHIPMENT
// ============================================

// Shipment represents shipping and tracking
type Shipment struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"`
	PrescriptionID      primitive.ObjectID `bson:"prescription_id" validate:"required"`
	PharmacyID          primitive.ObjectID `bson:"pharmacy_id" validate:"required"`
	ShippoShipmentID    string             `bson:"shippo_shipment_id,omitempty"`
	ShippoRateID        string             `bson:"shippo_rate_id,omitempty"`
	ShippoTransactionID string             `bson:"shippo_transaction_id,omitempty"`
	Carrier             string             `bson:"carrier" validate:"required"` // USPS/UPS/FedEx
	ServiceLevel        string             `bson:"service_level"`               // Ground/Priority/Overnight
	TrackingNumber      string             `bson:"tracking_number" validate:"required"`
	TrackingURL         string             `bson:"tracking_url,omitempty"`
	LabelURL            string             `bson:"label_url,omitempty"`
	LabelFileID         primitive.ObjectID `bson:"label_file_id,omitempty"`
	ShippingAddress     Address            `bson:"shipping_address"`
	ShippingCost        float64            `bson:"shipping_cost,omitempty"`
	Status              string             `bson:"status"` // label_created/picked_up/in_transit/out_for_delivery/delivered/exception
	EstimatedDelivery   *time.Time         `bson:"estimated_delivery,omitempty"`
	ActualDelivery      *time.Time         `bson:"actual_delivery,omitempty"`
	TrackingHistory     []ShipmentEvent    `bson:"tracking_history"`
	RequiresSignature   bool               `bson:"requires_signature"`
	RequiresColdChain   bool               `bson:"requires_cold_chain"`
	CreatedAt           time.Time          `bson:"created_at"`
	UpdatedAt           time.Time          `bson:"updated_at"`
}

// ShipmentEvent represents tracking updates
type ShipmentEvent struct {
	Status    string    `bson:"status" validate:"required"`
	Location  string    `bson:"location,omitempty"` // City, State
	Message   string    `bson:"message,omitempty"`  // Carrier message
	Timestamp time.Time `bson:"timestamp"`
}

// ============================================
// FILE ASSETS
// ============================================

// FileAsset represents uploaded files (insurance cards, labels, etc.)
type FileAsset struct {
	ID             primitive.ObjectID  `bson:"_id,omitempty"`
	Type           string              `bson:"type" validate:"required"` // insurance_card_front/insurance_card_back/shipping_label/ncpdp_raw/etc
	Filename       string              `bson:"filename"`
	ContentType    string              `bson:"content_type"`
	FileSize       int64               `bson:"file_size"`                 // bytes
	StorageURL     string              `bson:"storage_url"`               // MinIO/S3 URL
	IsEncrypted    bool                `bson:"is_encrypted"`              // PHI should be encrypted
	EncryptionAlgo string              `bson:"encryption_algo,omitempty"` // e.g., "aes-256-gcm"
	PrescriptionID *primitive.ObjectID `bson:"prescription_id,omitempty"`
	PatientID      *primitive.ObjectID `bson:"patient_id,omitempty"`
	PharmacyID     *primitive.ObjectID `bson:"pharmacy_id,omitempty"`
	UploadedBy     string              `bson:"uploaded_by,omitempty"` // user ID or "patient" or "system"
	CreatedAt      time.Time           `bson:"created_at"`
}

// ============================================
// NOTIFICATIONS
// ============================================

// Notification represents a notification sent to a patient
type Notification struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"`
	PrescriptionID    primitive.ObjectID `bson:"prescription_id"`
	PatientID         primitive.ObjectID `bson:"patient_id"`
	Type              string             `bson:"type"`    // enrollment_invite/payment_request/shipment_update/delivery_confirmation
	Channel           string             `bson:"channel"` // email/sms
	EmailTo           string             `bson:"email_to,omitempty"`
	EmailSubject      string             `bson:"email_subject,omitempty"`
	EmailBody         string             `bson:"email_body,omitempty"`
	SendGridMessageID string             `bson:"sendgrid_message_id,omitempty"`
	SMSTo             string             `bson:"sms_to,omitempty"`
	SMSBody           string             `bson:"sms_body,omitempty"`
	TwilioMessageSID  string             `bson:"twilio_message_sid,omitempty"`
	Status            string             `bson:"status"` // pending/sent/delivered/failed
	SentAt            *time.Time         `bson:"sent_at,omitempty"`
	DeliveredAt       *time.Time         `bson:"delivered_at,omitempty"`
	FailureReason     string             `bson:"failure_reason,omitempty"`
	RetryCount        int                `bson:"retry_count"`
	MaxRetries        int                `bson:"max_retries"`
	CreatedAt         time.Time          `bson:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at"`
}

// ============================================
// JOB QUEUE (PostgreSQL)
// ============================================

// These structs are for PostgreSQL job tables, not MongoDB
// Include here for reference

// ValidationJob represents a validation job
type ValidationJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"` // MongoDB ObjectID as string
	Status         string     `db:"status"`          // pending/processing/completed/failed
	RetryCount     int        `db:"retry_count"`
	MaxRetries     int        `db:"max_retries"`
	ErrorMessage   string     `db:"error_message"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"` // worker ID
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// EnrollmentJob represents an enrollment monitoring job
type EnrollmentJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	EnrollmentID   string     `db:"enrollment_id"`
	Status         string     `db:"status"`
	CheckType      string     `db:"check_type"` // expiry_check/completion_check/reminder
	NextCheckAt    time.Time  `db:"next_check_at"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// RoutingJob represents a pharmacy routing job
type RoutingJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	Status         string     `db:"status"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// AdjudicationJob represents an insurance adjudication job
type AdjudicationJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	PharmacyID     string     `db:"pharmacy_id"`
	Status         string     `db:"status"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// PaymentJob represents a payment monitoring job
type PaymentJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	PaymentID      string     `db:"payment_id"`
	Status         string     `db:"status"`
	CheckType      string     `db:"check_type"` // timeout_check/status_sync
	NextCheckAt    time.Time  `db:"next_check_at"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// ShippingJob represents a shipping label generation job
type ShippingJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	PharmacyID     string     `db:"pharmacy_id"`
	Status         string     `db:"status"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// TrackingJob represents a delivery tracking job
type TrackingJob struct {
	ID             int64      `db:"id"`
	JobID          string     `db:"job_id"`
	PrescriptionID string     `db:"prescription_id"`
	ShipmentID     string     `db:"shipment_id"`
	TrackingNumber string     `db:"tracking_number"`
	Status         string     `db:"status"`
	LastCheckedAt  *time.Time `db:"last_checked_at"`
	NextCheckAt    time.Time  `db:"next_check_at"`
	RetryCount     int        `db:"retry_count"`
	LockedAt       *time.Time `db:"locked_at"`
	LockedBy       string     `db:"locked_by"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	CompletedAt    *time.Time `db:"completed_at"`
}

// ============================================
// AUDIT LOGS (PostgreSQL)
// ============================================

// AuditLog represents HIPAA-compliant audit trail
type AuditLog struct {
	ID             int64                  `db:"id"`
	EventType      string                 `db:"event_type"`      // validation/enrollment/payment/etc
	PrescriptionID string                 `db:"prescription_id"` // MongoDB ObjectID as string
	UserID         string                 `db:"user_id"`         // user ID or "system" or "patient"
	Action         string                 `db:"action"`          // specific action taken
	Details        map[string]interface{} `db:"details"`         // JSONB in PostgreSQL
	IPAddress      string                 `db:"ip_address"`
	UserAgent      string                 `db:"user_agent"`
	CreatedAt      time.Time              `db:"created_at"`
}

// ============================================
// USER & AUTHENTICATION
// ============================================

// User represents an operations team member
type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Username     string             `bson:"username" validate:"required"`
	Email        string             `bson:"email" validate:"required,email"`
	PasswordHash string             `bson:"password_hash"` // Never expose in JSON
	FirstName    string             `bson:"first_name"`
	LastName     string             `bson:"last_name"`
	Role         string             `bson:"role"`   // admin/ops_manager/ops_agent
	Status       string             `bson:"status"` // active/inactive/suspended
	LastLoginAt  *time.Time         `bson:"last_login_at,omitempty"`
	CreatedAt    time.Time          `bson:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"`
}

// Session represents a JWT session (stored in Redis)
type Session struct {
	SessionID string    `json:"session_id"`
	UserID    string    `json:"user_id"` // MongoDB ObjectID as string
	Role      string    `json:"role"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
