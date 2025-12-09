package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Patient represents a patient in the system.
type Patient struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName          string             `bson:"first_name" json:"first_name" validate:"required"`
	LastName           string             `bson:"last_name" json:"last_name" validate:"required"`
	DateOfBirth        string             `bson:"date_of_birth" json:"date_of_birth" validate:"required"` // Format: YYYY-MM-DD
	Sex                string             `bson:"sex" json:"sex" validate:"required,oneof=M F O U"`        // M/F/O/U
	Email              string             `bson:"email" json:"email" validate:"required,email"`
	Phone              string             `bson:"phone" json:"phone" validate:"required"`
	Address            Address            `bson:"address" json:"address" validate:"required"`
	InsuranceProfileID primitive.ObjectID `bson:"insurance_profile_id,omitempty" json:"insurance_profile_id,omitempty"`
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at" json:"updated_at"`
}

// Address represents a physical address.
type Address struct {
	Line1       string      `bson:"line1" json:"line1" validate:"required"`
	Line2       string      `bson:"line2,omitempty" json:"line2,omitempty"`
	City        string      `bson:"city" json:"city" validate:"required"`
	State       string      `bson:"state" json:"state" validate:"required,len=2"` // Two-letter state code
	ZIP         string      `bson:"zip" json:"zip" validate:"required"`
	Country     string      `bson:"country" json:"country" validate:"required"` // Default: "US"
	Coordinates GeoLocation `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
}

// GeoLocation represents latitude/longitude coordinates.
type GeoLocation struct {
	Latitude  float64 `bson:"lat" json:"lat"`
	Longitude float64 `bson:"lng" json:"lng"`
}

// Prescriber represents a healthcare provider.
type Prescriber struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName   string             `bson:"first_name" json:"first_name" validate:"required"`
	LastName    string             `bson:"last_name" json:"last_name" validate:"required"`
	NPI         string             `bson:"npi" json:"npi" validate:"required,len=10"` // 10-digit NPI
	DEA         string             `bson:"dea,omitempty" json:"dea,omitempty"`        // For controlled substances
	ClinicName  string             `bson:"clinic_name" json:"clinic_name"`
	ClinicPhone string             `bson:"clinic_phone" json:"clinic_phone" validate:"required"`
	Address     Address            `bson:"address" json:"address" validate:"required"`
	Specialty   string             `bson:"specialty,omitempty" json:"specialty,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// Pharmacy represents a partner pharmacy.
type Pharmacy struct {
	ID                   primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Name                 string              `bson:"name" json:"name" validate:"required"`
	LicenseNumber        string              `bson:"license_number" json:"license_number" validate:"required"`
	NPI                  string              `bson:"npi" json:"npi" validate:"required,len=10"`
	Address              Address             `bson:"address" json:"address" validate:"required"`
	Phone                string              `bson:"phone" json:"phone" validate:"required"`
	Email                string              `bson:"email" json:"email" validate:"email"`
	Capabilities         PharmacyCapability  `bson:"capabilities" json:"capabilities"`
	InsuranceContracts   []InsuranceContract `bson:"insurance_contracts" json:"insurance_contracts"`
	Capacity             PharmacyCapacity    `bson:"capacity" json:"capacity"`
	Performance          PharmacyPerformance `bson:"performance" json:"performance"`
	Status               string              `bson:"status" json:"status" validate:"required,oneof=active inactive suspended"` // active/inactive/suspended
	APIEndpoint          string              `bson:"api_endpoint,omitempty" json:"api_endpoint,omitempty"`                     // For real-time integration
	HasRealtimeAPI       bool                `bson:"has_realtime_api" json:"has_realtime_api"`
	CreatedAt            time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt            time.Time           `bson:"updated_at" json:"updated_at"`
}

// PharmacyCapability defines what the pharmacy can handle.
type PharmacyCapability struct {
	SpecialtyPharmacy    bool     `bson:"specialty_pharmacy" json:"specialty_pharmacy"`
	ColdChain            bool     `bson:"cold_chain" json:"cold_chain"`                         // Refrigerated drugs
	ControlledSubstances bool     `bson:"controlled_substances" json:"controlled_substances"`   // DEA requirements
	Compounding          bool     `bson:"compounding" json:"compounding"`                       // Custom formulations
	SpecialtyDrugs       []string `bson:"specialty_drugs" json:"specialty_drugs"`               // List of NDC codes
	MaxDaysSupply        int      `bson:"max_days_supply" json:"max_days_supply"`               // Default: 90
}

// InsuranceContract represents pharmacy's contract with a payer.
type InsuranceContract struct {
	Payer         string    `bson:"payer" json:"payer" validate:"required"` // e.g., "Blue Cross Blue Shield"
	NetworkTier   string    `bson:"network_tier" json:"network_tier" validate:"oneof=preferred standard out_of_network"`
	ContractStart time.Time `bson:"contract_start" json:"contract_start"`
	ContractEnd   time.Time `bson:"contract_end" json:"contract_end"`
	IsActive      bool      `bson:"is_active" json:"is_active"`
}

// PharmacyCapacity tracks pharmacy workload.
type PharmacyCapacity struct {
	MaxDailyRx         int `bson:"max_daily_rx" json:"max_daily_rx"`                 // Max prescriptions per day
	CurrentDailyRx     int `bson:"current_daily_rx" json:"current_daily_rx"`         // Current count today
	MaxConcurrentFills int `bson:"max_concurrent_fills" json:"max_concurrent_fills"` // Max active fills
	CurrentConcurrent  int `bson:"current_concurrent" json:"current_concurrent"`     // Currently being filled
}

// PharmacyPerformance tracks pharmacy quality metrics.
type PharmacyPerformance struct {
	AvgFulfillmentTimeHours float64 `bson:"avg_fulfillment_time_hours" json:"avg_fulfillment_time_hours"` // Average time to fill
	FillAccuracyRate        float64 `bson:"fill_accuracy_rate" json:"fill_accuracy_rate"`                 // 0.0-1.0
	CustomerSatisfaction    float64 `bson:"customer_satisfaction" json:"customer_satisfaction"`           // 1.0-5.0
	OnTimeDeliveryRate      float64 `bson:"on_time_delivery_rate" json:"on_time_delivery_rate"`           // 0.0-1.0
}

// InsuranceProfile stores patient insurance information.
type InsuranceProfile struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID       primitive.ObjectID `bson:"patient_id" json:"patient_id"`
	PayerName       string             `bson:"payer_name" json:"payer_name" validate:"required"` // Insurance company name
	MemberID        string             `bson:"member_id" json:"member_id" validate:"required"`   // Member/Subscriber ID
	GroupNumber     string             `bson:"group_number,omitempty" json:"group_number,omitempty"`
	BIN             string             `bson:"bin" json:"bin" validate:"required,len=6"` // 6-digit BIN
	PCN             string             `bson:"pcn,omitempty" json:"pcn,omitempty"`       // Processor Control Number
	PlanType        string             `bson:"plan_type" json:"plan_type"`               // commercial/medicare/medicaid/etc
	IsGovernment    bool               `bson:"is_government" json:"is_government"`       // True for Medicare/Medicaid/VA/TRICARE
	CardFrontURL    string             `bson:"card_front_url,omitempty" json:"card_front_url,omitempty"`
	CardBackURL     string             `bson:"card_back_url,omitempty" json:"card_back_url,omitempty"`
	VerifiedAt      *time.Time         `bson:"verified_at,omitempty" json:"verified_at,omitempty"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

// Prescription represents the main prescription order entity.
// Note: previously called "Order" but renamed to "Prescription" for clarity.
type Prescription struct {
	ID                     primitive.ObjectID       `bson:"_id,omitempty" json:"id"`
	PrescriptionNumber     string                   `bson:"prescription_number" json:"prescription_number" validate:"required"`
	Status                 string                   `bson:"status" json:"status" validate:"required"`
	StatusHistory          []StatusEntry            `bson:"status_history" json:"status_history"`
	PatientID              primitive.ObjectID       `bson:"patient_id" json:"patient_id" validate:"required"`
	PrescriberID           primitive.ObjectID       `bson:"prescriber_id" json:"prescriber_id" validate:"required"`
	Medication             Medication               `bson:"medication" json:"medication" validate:"required"`
	NCPDPRawFileID         primitive.ObjectID       `bson:"ncpdp_raw_file_id,omitempty" json:"ncpdp_raw_file_id,omitempty"`
	ValidationErrors       []ValidationError        `bson:"validation_errors,omitempty" json:"validation_errors,omitempty"`
	ValidationChecks       ValidationChecks         `bson:"validation_checks,omitempty" json:"validation_checks,omitempty"`
	ValidatedAt            *time.Time               `bson:"validated_at,omitempty" json:"validated_at,omitempty"`
	EnrollmentID           primitive.ObjectID       `bson:"enrollment_id,omitempty" json:"enrollment_id,omitempty"`
	EnrollmentCompletedAt  *time.Time               `bson:"enrollment_completed_at,omitempty" json:"enrollment_completed_at,omitempty"`
	PharmacyRecommendations []PharmacyRecommendation `bson:"pharmacy_recommendations,omitempty" json:"pharmacy_recommendations,omitempty"`
	SelectedPharmacyID     primitive.ObjectID       `bson:"selected_pharmacy_id,omitempty" json:"selected_pharmacy_id,omitempty"`
	PharmacySelectedAt     *time.Time               `bson:"pharmacy_selected_at,omitempty" json:"pharmacy_selected_at,omitempty"`
	PharmacySelectedBy     string                   `bson:"pharmacy_selected_by,omitempty" json:"pharmacy_selected_by,omitempty"`
	AdjudicationID         primitive.ObjectID       `bson:"adjudication_id,omitempty" json:"adjudication_id,omitempty"`
	AdjudicatedAt          *time.Time               `bson:"adjudicated_at,omitempty" json:"adjudicated_at,omitempty"`
	PaymentID              primitive.ObjectID       `bson:"payment_id,omitempty" json:"payment_id,omitempty"`
	PaidAt                 *time.Time               `bson:"paid_at,omitempty" json:"paid_at,omitempty"`
	ShipmentID             primitive.ObjectID       `bson:"shipment_id,omitempty" json:"shipment_id,omitempty"`
	ShippedAt              *time.Time               `bson:"shipped_at,omitempty" json:"shipped_at,omitempty"`
	DeliveredAt            *time.Time               `bson:"delivered_at,omitempty" json:"delivered_at,omitempty"`
	Notes                  string                   `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedAt              time.Time                `bson:"created_at" json:"created_at"`
	UpdatedAt              time.Time                `bson:"updated_at" json:"updated_at"`
}

// Prescription status constants.
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

// StatusEntry tracks status changes over time.
type StatusEntry struct {
	Status    string    `bson:"status" json:"status" validate:"required"`
	Reason    string    `bson:"reason,omitempty" json:"reason,omitempty"`
	UpdatedBy string    `bson:"updated_by,omitempty" json:"updated_by,omitempty"` // user ID or "system"
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

// Medication represents prescription medication details.
type Medication struct {
	DrugName          string `bson:"drug_name" json:"drug_name" validate:"required"`
	BrandName         string `bson:"brand_name,omitempty" json:"brand_name,omitempty"`
	GenericName       string `bson:"generic_name,omitempty" json:"generic_name,omitempty"`
	NDC               string `bson:"ndc" json:"ndc" validate:"required"`           // National Drug Code
	Strength          string `bson:"strength" json:"strength" validate:"required"` // e.g., "40mg/0.8mL"
	Dosage            string `bson:"dosage" json:"dosage" validate:"required"`     // e.g., "40mg"
	Form              string `bson:"form" json:"form"`                             // tablet/capsule/injection/etc
	Route             string `bson:"route" json:"route"`                           // oral/subcutaneous/IV/etc
	SIG               string `bson:"sig" json:"sig" validate:"required"`           // Directions for use
	Quantity          int    `bson:"quantity" json:"quantity" validate:"required,gt=0"`
	DaysSupply        int    `bson:"days_supply" json:"days_supply" validate:"required,gt=0"`
	Refills           int    `bson:"refills" json:"refills" validate:"min=0"`
	IsControlled      bool   `bson:"is_controlled" json:"is_controlled"`
	DEASchedule       string `bson:"dea_schedule,omitempty" json:"dea_schedule,omitempty"` // C-II, C-III, etc
	RequiresColdChain bool   `bson:"requires_cold_chain" json:"requires_cold_chain"`
	DAW               int    `bson:"daw" json:"daw"` // Dispense As Written code (0-9)
}

// ValidationError represents a validation failure.
type ValidationError struct {
	Field    string `bson:"field" json:"field"`       // Which field failed
	Error    string `bson:"error" json:"error"`       // Error message
	Severity string `bson:"severity" json:"severity"` // critical/warning/info
}

// ValidationChecks tracks which validations passed.
type ValidationChecks struct {
	NPIValid       bool `bson:"npi_valid" json:"npi_valid"`
	DEAValid       bool `bson:"dea_valid" json:"dea_valid"`
	NDCValid       bool `bson:"ndc_valid" json:"ndc_valid"`
	RequiredFields bool `bson:"required_fields" json:"required_fields"`
	SIGFormat      bool `bson:"sig_format" json:"sig_format"`
	QuantityValid  bool `bson:"quantity_valid" json:"quantity_valid"`
	DaysSupplyValid bool `bson:"days_supply_valid" json:"days_supply_valid"`
}

// PharmacyRecommendation represents a scored pharmacy option.
type PharmacyRecommendation struct {
	PharmacyID         primitive.ObjectID `bson:"pharmacy_id" json:"pharmacy_id"`
	PharmacyName       string             `bson:"pharmacy_name" json:"pharmacy_name"`
	Location           Address            `bson:"location" json:"location"`
	DistanceMiles      float64            `bson:"distance_miles" json:"distance_miles"`
	InsuranceNetwork   string             `bson:"insurance_network" json:"insurance_network"` // preferred/standard/out_of_network
	Score              PharmacyScore      `bson:"score" json:"score"`
	EstimatedFillTime  string             `bson:"estimated_fill_time" json:"estimated_fill_time"` // e.g., "24 hours"
	CapacityAvailable  bool               `bson:"capacity_available" json:"capacity_available"`
	RecommendationRank int                `bson:"recommendation_rank" json:"recommendation_rank"` // 1-5
}

// PharmacyScore represents the scoring breakdown.
type PharmacyScore struct {
	TotalScore float64            `bson:"total_score" json:"total_score"` // 0.0-1.0
	Breakdown  map[string]float64 `bson:"breakdown" json:"breakdown"`     // distance: 0.26, network: 0.25, etc
}

// Enrollment represents patient enrollment process.
type Enrollment struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PrescriptionID     primitive.ObjectID `bson:"prescription_id" json:"prescription_id" validate:"required"`
	PatientID          primitive.ObjectID `bson:"patient_id" json:"patient_id" validate:"required"`
	MagicLinkToken     string             `bson:"magic_link_token" json:"magic_link_token" validate:"required"`
	TokenExpiresAt     time.Time          `bson:"token_expires_at" json:"token_expires_at"`
	TokenUsed          bool               `bson:"token_used" json:"token_used"`
	InsuranceProfileID primitive.ObjectID `bson:"insurance_profile_id,omitempty" json:"insurance_profile_id,omitempty"`
	InsuranceVerified  bool               `bson:"insurance_verified" json:"insurance_verified"`
	HIPAAConsent       bool               `bson:"hipaa_consent" json:"hipaa_consent"`
	HIPAAConsentText   string             `bson:"hipaa_consent_text,omitempty" json:"hipaa_consent_text,omitempty"`
	SignatureDataURL   string             `bson:"signature_data_url,omitempty" json:"signature_data_url,omitempty"` // Base64 signature image
	SignatureName      string             `bson:"signature_name,omitempty" json:"signature_name,omitempty"`
	SignatureDate      *time.Time         `bson:"signature_date,omitempty" json:"signature_date,omitempty"`
	SignatureIPAddress string             `bson:"signature_ip_address,omitempty" json:"signature_ip_address,omitempty"`
	IncomeRange        string             `bson:"income_range,omitempty" json:"income_range,omitempty"` // e.g., "50000-75000"
	IncomeAttested     bool               `bson:"income_attested" json:"income_attested"`
	Status             string             `bson:"status" json:"status"` // pending/in_progress/completed/expired
	CompletedAt        *time.Time         `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt          time.Time          `bson:"updated_at" json:"updated_at"`
}

// ManufacturerProgram represents a copay assistance program.
// This data is used by pharmacy during adjudication.
type ManufacturerProgram struct {
	ID                 primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	ProgramCode        string              `bson:"program_code" json:"program_code" validate:"required"`
	ProgramName        string              `bson:"program_name" json:"program_name" validate:"required"`
	Manufacturer       ManufacturerInfo    `bson:"manufacturer" json:"manufacturer"`
	Drug               DrugMapping         `bson:"drug" json:"drug"`
	ProgramCredentials ProgramCredentials  `bson:"program_credentials" json:"program_credentials"`
	ProgramType        string              `bson:"program_type" json:"program_type"` // copay_card/voucher/patient_assistance
	MaxAnnualBenefit   float64             `bson:"max_annual_benefit" json:"max_annual_benefit"`
	MaxPerPrescription float64             `bson:"max_per_prescription" json:"max_per_prescription"`
	CopayReductionMethod string            `bson:"copay_reduction_method" json:"copay_reduction_method"` // reduce_to_amount/percentage_off/pay_first
	TargetCopay        float64             `bson:"target_copay,omitempty" json:"target_copay,omitempty"`
	DiscountPercentage float64             `bson:"discount_percentage,omitempty" json:"discount_percentage,omitempty"`
	EligibilityRules   ProgramEligibility  `bson:"eligibility_rules" json:"eligibility_rules"`
	AdjudicationEndpoint AdjudicationEndpoint `bson:"adjudication_endpoint" json:"adjudication_endpoint"`
	Status             string              `bson:"status" json:"status"` // active/inactive/suspended
	EffectiveDates     EffectiveDates      `bson:"effective_dates" json:"effective_dates"`
	TermsURL           string              `bson:"terms_url,omitempty" json:"terms_url,omitempty"`
	CreatedAt          time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt          time.Time           `bson:"updated_at" json:"updated_at"`
}

// ManufacturerInfo represents the drug manufacturer.
type ManufacturerInfo struct {
	ID   string `bson:"id" json:"id"`     // e.g., "mfr_abbvie"
	Name string `bson:"name" json:"name"` // e.g., "AbbVie Inc."
}

// DrugMapping maps program to specific drugs.
type DrugMapping struct {
	NDC              string `bson:"ndc" json:"ndc" validate:"required"` // National Drug Code
	BrandName        string `bson:"brand_name" json:"brand_name"`
	GenericName      string `bson:"generic_name,omitempty" json:"generic_name,omitempty"`
	GenericAvailable bool   `bson:"generic_available" json:"generic_available"`
}

// ProgramCredentials used by pharmacy to submit secondary claim.
type ProgramCredentials struct {
	BIN     string `bson:"bin" json:"bin" validate:"required,len=6"` // e.g., "004682"
	PCN     string `bson:"pcn" json:"pcn" validate:"required"`       // e.g., "CNRX"
	GroupID string `bson:"group_id,omitempty" json:"group_id,omitempty"`
}

// ProgramEligibility defines who can use the program.
type ProgramEligibility struct {
	InsuranceTypesAllowed   []string     `bson:"insurance_types_allowed" json:"insurance_types_allowed"`
	InsuranceTypesExcluded  []string     `bson:"insurance_types_excluded" json:"insurance_types_excluded"`
	RequiresCommercialPrimary bool       `bson:"requires_commercial_primary" json:"requires_commercial_primary"`
	AgeMinimum              int          `bson:"age_minimum,omitempty" json:"age_minimum,omitempty"`
	AgeMaximum              int          `bson:"age_maximum,omitempty" json:"age_maximum,omitempty"`
	IncomeLimits            *IncomeLimits `bson:"income_limits,omitempty" json:"income_limits,omitempty"`
	DiagnosisCodes          []string     `bson:"diagnosis_codes,omitempty" json:"diagnosis_codes,omitempty"`
	PriorAuthAcceptable     bool         `bson:"prior_auth_acceptable" json:"prior_auth_acceptable"`
}

// IncomeLimits for patient assistance programs.
type IncomeLimits struct {
	MaxHouseholdIncome  float64 `bson:"max_household_income" json:"max_household_income"`   // Annual
	FederalPovertyLevel float64 `bson:"federal_poverty_level" json:"federal_poverty_level"` // Percentage, e.g., 400 = 400% FPL
}

// AdjudicationEndpoint for pharmacy to connect.
type AdjudicationEndpoint struct {
	Type string `bson:"type" json:"type"` // ncpdp_telecom/rest_api/legacy
	Host string `bson:"host" json:"host"`
	Port int    `bson:"port" json:"port"`
}

// EffectiveDates for program validity period.
type EffectiveDates struct {
	Start time.Time `bson:"start" json:"start"`
	End   time.Time `bson:"end" json:"end"`
}

// Adjudication represents the complete adjudication result (primary + manufacturer).
type Adjudication struct {
	ID                   primitive.ObjectID    `bson:"_id,omitempty" json:"id"`
	PrescriptionID       primitive.ObjectID    `bson:"prescription_id" json:"prescription_id" validate:"required"`
	PharmacyID           primitive.ObjectID    `bson:"pharmacy_id" json:"pharmacy_id" validate:"required"`
	PrimaryInsurance     PrimaryInsuranceClaim `bson:"primary_insurance" json:"primary_insurance"`
	PriorAuthRequired    bool                  `bson:"prior_auth_required" json:"prior_auth_required"`
	PriorAuthID          primitive.ObjectID    `bson:"prior_auth_id,omitempty" json:"prior_auth_id,omitempty"`
	ManufacturerPrograms []ManufacturerProgramClaim `bson:"manufacturer_programs" json:"manufacturer_programs"`
	CostBreakdown        CostBreakdown         `bson:"cost_breakdown" json:"cost_breakdown"`
	Status               string                `bson:"status" json:"status"` // pending/completed/failed
	CompletedAt          *time.Time            `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
	CreatedAt            time.Time             `bson:"created_at" json:"created_at"`
	UpdatedAt            time.Time             `bson:"updated_at" json:"updated_at"`
}

// PrimaryInsuranceClaim represents the primary insurance adjudication.
type PrimaryInsuranceClaim struct {
	ClaimID         string                 `bson:"claim_id" json:"claim_id"`
	PayerName       string                 `bson:"payer_name" json:"payer_name"`
	SubmittedAt     time.Time              `bson:"submitted_at" json:"submitted_at"`
	RespondedAt     *time.Time             `bson:"responded_at,omitempty" json:"responded_at,omitempty"`
	Status          string                 `bson:"status" json:"status"` // approved/rejected/pending
	RejectionReason string                 `bson:"rejection_reason,omitempty" json:"rejection_reason,omitempty"`
	DrugCost        float64                `bson:"drug_cost" json:"drug_cost"`           // AWP or WAC
	InsurancePaid   float64                `bson:"insurance_paid" json:"insurance_paid"` // What insurance covers
	PatientCopay    float64                `bson:"patient_copay" json:"patient_copay"`   // Before manufacturer discount
	RawResponse     map[string]interface{} `bson:"raw_response,omitempty" json:"raw_response,omitempty"` // Full NCPDP response
}

// ManufacturerProgramClaim represents manufacturer program adjudication.
type ManufacturerProgramClaim struct {
	ProgramID        primitive.ObjectID    `bson:"program_id" json:"program_id"`
	ProgramName      string                `bson:"program_name" json:"program_name"`
	ProgramBIN       string                `bson:"program_bin" json:"program_bin"`
	ProgramPCN       string                `bson:"program_pcn" json:"program_pcn"`
	SubmittedAt      time.Time             `bson:"submitted_at" json:"submitted_at"`
	RespondedAt      *time.Time            `bson:"responded_at,omitempty" json:"responded_at,omitempty"`
	Status           string                `bson:"status" json:"status"` // approved/rejected/pending
	ApprovalCode     string                `bson:"approval_code,omitempty" json:"approval_code,omitempty"`
	RejectionReason  string                `bson:"rejection_reason,omitempty" json:"rejection_reason,omitempty"`
	DiscountAmount   float64               `bson:"discount_amount" json:"discount_amount"`
	ReducedCopay     float64               `bson:"reduced_copay" json:"reduced_copay"`
	RemainingBenefit float64               `bson:"remaining_benefit,omitempty" json:"remaining_benefit,omitempty"`
	RawResponse      map[string]interface{} `bson:"raw_response,omitempty" json:"raw_response,omitempty"`
}

// CostBreakdown represents the final cost calculation.
type CostBreakdown struct {
	TotalDrugCost        float64  `bson:"total_drug_cost" json:"total_drug_cost"`               // Original drug cost
	InsuranceCovered     float64  `bson:"insurance_covered" json:"insurance_covered"`           // Insurance payment
	InitialCopay         float64  `bson:"initial_copay" json:"initial_copay"`                   // Before manufacturer discount
	ManufacturerDiscount float64  `bson:"manufacturer_discount" json:"manufacturer_discount"`   // Total program discount
	FinalPatientCopay    float64  `bson:"final_patient_copay" json:"final_patient_copay"`       // What patient actually pays
	PatientSavings       float64  `bson:"patient_savings" json:"patient_savings"`               // Total savings
	ProgramsApplied      []string `bson:"programs_applied" json:"programs_applied"`            // List of program names
}

// PriorAuthorization represents PA workflow.
type PriorAuthorization struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PrescriptionID primitive.ObjectID `bson:"prescription_id" json:"prescription_id" validate:"required"`
	PayerName      string             `bson:"payer_name" json:"payer_name" validate:"required"`
	RequestedAt    time.Time          `bson:"requested_at" json:"requested_at"`
	RequestedBy    string             `bson:"requested_by" json:"requested_by"` // prescriber NPI or pharmacy
	RequestReason  string             `bson:"request_reason" json:"request_reason"`
	DiagnosisCodes []string           `bson:"diagnosis_codes" json:"diagnosis_codes"` // ICD-10
	ClinicalNotes  string             `bson:"clinical_notes,omitempty" json:"clinical_notes,omitempty"`
	SupportingDocs []primitive.ObjectID `bson:"supporting_docs,omitempty" json:"supporting_docs,omitempty"`
	Status         string             `bson:"status" json:"status"` // pending/approved/denied/more_info_needed
	ApprovalCode   string             `bson:"approval_code,omitempty" json:"approval_code,omitempty"`
	DenialReason   string             `bson:"denial_reason,omitempty" json:"denial_reason,omitempty"`
	RespondedAt    *time.Time         `bson:"responded_at,omitempty" json:"responded_at,omitempty"`
	ExpiresAt      *time.Time         `bson:"expires_at,omitempty" json:"expires_at,omitempty"`
	AppealID       primitive.ObjectID `bson:"appeal_id,omitempty" json:"appeal_id,omitempty"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
}

// Payment represents payment processing.
type Payment struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PrescriptionID        primitive.ObjectID `bson:"prescription_id" json:"prescription_id" validate:"required"`
	PatientID             primitive.ObjectID `bson:"patient_id" json:"patient_id" validate:"required"`
	Amount                float64            `bson:"amount" json:"amount" validate:"required,gt=0"`
	Currency              string             `bson:"currency" json:"currency"` // "USD"
	StripePaymentLink     string             `bson:"stripe_payment_link,omitempty" json:"stripe_payment_link,omitempty"`
	StripeSessionID       string             `bson:"stripe_session_id,omitempty" json:"stripe_session_id,omitempty"`
	StripePaymentIntentID string             `bson:"stripe_payment_intent_id,omitempty" json:"stripe_payment_intent_id,omitempty"`
	Status                string             `bson:"status" json:"status"` // pending/completed/failed/refunded/cancelled
	PaymentMethod         string             `bson:"payment_method,omitempty" json:"payment_method,omitempty"` // card/ach/etc
	LinkCreatedAt         time.Time          `bson:"link_created_at" json:"link_created_at"`
	LinkExpiresAt         time.Time          `bson:"link_expires_at" json:"link_expires_at"`
	PaidAt                *time.Time         `bson:"paid_at,omitempty" json:"paid_at,omitempty"`
	ReceiptURL            string             `bson:"receipt_url,omitempty" json:"receipt_url,omitempty"`
	RefundID              primitive.ObjectID `bson:"refund_id,omitempty" json:"refund_id,omitempty"`
	RefundAmount          float64            `bson:"refund_amount,omitempty" json:"refund_amount,omitempty"`
	RefundedAt            *time.Time         `bson:"refunded_at,omitempty" json:"refunded_at,omitempty"`
	CreatedAt             time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt             time.Time          `bson:"updated_at" json:"updated_at"`
}

// Shipment represents shipping and tracking.
type Shipment struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PrescriptionID    primitive.ObjectID `bson:"prescription_id" json:"prescription_id" validate:"required"`
	PharmacyID        primitive.ObjectID `bson:"pharmacy_id" json:"pharmacy_id" validate:"required"`
	ShippoShipmentID  string             `bson:"shippo_shipment_id,omitempty" json:"shippo_shipment_id,omitempty"`
	ShippoRateID      string             `bson:"shippo_rate_id,omitempty" json:"shippo_rate_id,omitempty"`
	ShippoTransactionID string           `bson:"shippo_transaction_id,omitempty" json:"shippo_transaction_id,omitempty"`
	Carrier           string             `bson:"carrier" json:"carrier" validate:"required"` // USPS/UPS/FedEx
	ServiceLevel      string             `bson:"service_level" json:"service_level"`         // Ground/Priority/Overnight
	TrackingNumber    string             `bson:"tracking_number" json:"tracking_number" validate:"required"`
	TrackingURL       string             `bson:"tracking_url,omitempty" json:"tracking_url,omitempty"`
	LabelURL          string             `bson:"label_url,omitempty" json:"label_url,omitempty"`
	LabelFileID       primitive.ObjectID `bson:"label_file_id,omitempty" json:"label_file_id,omitempty"`
	ShippingAddress   Address            `bson:"shipping_address" json:"shipping_address"`
	ShippingCost      float64            `bson:"shipping_cost,omitempty" json:"shipping_cost,omitempty"`
	Status            string             `bson:"status" json:"status"` // label_created/picked_up/in_transit/out_for_delivery/delivered/exception
	EstimatedDelivery *time.Time         `bson:"estimated_delivery,omitempty" json:"estimated_delivery,omitempty"`
	ActualDelivery    *time.Time         `bson:"actual_delivery,omitempty" json:"actual_delivery,omitempty"`
	TrackingHistory   []ShipmentEvent    `bson:"tracking_history" json:"tracking_history"`
	RequiresSignature bool               `bson:"requires_signature" json:"requires_signature"`
	RequiresColdChain bool               `bson:"requires_cold_chain" json:"requires_cold_chain"`
	CreatedAt         time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt         time.Time          `bson:"updated_at" json:"updated_at"`
}

// ShipmentEvent represents tracking updates.
type ShipmentEvent struct {
	Status    string    `bson:"status" json:"status" validate:"required"`
	Location  string    `bson:"location,omitempty" json:"location,omitempty"` // City, State
	Message   string    `bson:"message,omitempty" json:"message,omitempty"`   // Carrier message
	Timestamp time.Time `bson:"timestamp" json:"timestamp"`
}

// FileAsset represents uploaded files (insurance cards, labels, etc.).
type FileAsset struct {
	ID             primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Type           string              `bson:"type" json:"type" validate:"required"` // insurance_card_front/insurance_card_back/shipping_label/ncpdp_raw/etc
	Filename       string              `bson:"filename" json:"filename"`
	ContentType    string              `bson:"content_type" json:"content_type"`
	FileSize       int64               `bson:"file_size" json:"file_size"` // bytes
	StorageURL     string              `bson:"storage_url" json:"storage_url"` // MinIO/S3 URL
	IsEncrypted    bool                `bson:"is_encrypted" json:"is_encrypted"` // PHI should be encrypted
	EncryptionAlgo string              `bson:"encryption_algo,omitempty" json:"encryption_algo,omitempty"` // e.g., "aes-256-gcm"
	PrescriptionID *primitive.ObjectID `bson:"prescription_id,omitempty" json:"prescription_id,omitempty"`
	PatientID      *primitive.ObjectID `bson:"patient_id,omitempty" json:"patient_id,omitempty"`
	PharmacyID     *primitive.ObjectID `bson:"pharmacy_id,omitempty" json:"pharmacy_id,omitempty"`
	UploadedBy     string              `bson:"uploaded_by,omitempty" json:"uploaded_by,omitempty"` // user ID or "patient" or "system"
	CreatedAt      time.Time           `bson:"created_at" json:"created_at"`
}

// Notification represents a notification sent to a patient.
type Notification struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PrescriptionID primitive.ObjectID `bson:"prescription_id" json:"prescription_id"`
	PatientID      primitive.ObjectID `bson:"patient_id" json:"patient_id"`
	Type           string             `bson:"type" json:"type"`     // enrollment_invite/payment_request/shipment_update/delivery_confirmation
	Channel        string             `bson:"channel" json:"channel"` // email/sms
	EmailTo        string             `bson:"email_to,omitempty" json:"email_to,omitempty"`
	EmailSubject   string             `bson:"email_subject,omitempty" json:"email_subject,omitempty"`
	EmailBody      string             `bson:"email_body,omitempty" json:"email_body,omitempty"`
	SendGridMessageID string          `bson:"sendgrid_message_id,omitempty" json:"sendgrid_message_id,omitempty"`
	SMSTo          string             `bson:"sms_to,omitempty" json:"sms_to,omitempty"`
	SMSBody        string             `bson:"sms_body,omitempty" json:"sms_body,omitempty"`
	TwilioMessageSID string           `bson:"twilio_message_sid,omitempty" json:"twilio_message_sid,omitempty"`
	Status         string             `bson:"status" json:"status"` // pending/sent/delivered/failed
	SentAt         *time.Time         `bson:"sent_at,omitempty" json:"sent_at,omitempty"`
	DeliveredAt    *time.Time         `bson:"delivered_at,omitempty" json:"delivered_at,omitempty"`
	FailureReason  string             `bson:"failure_reason,omitempty" json:"failure_reason,omitempty"`
	RetryCount     int                `bson:"retry_count" json:"retry_count"`
	MaxRetries     int                `bson:"max_retries" json:"max_retries"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updated_at"`
}

// ValidationJob represents a validation job (PostgreSQL job table reference).
type ValidationJob struct {
	ID           int64   `db:"id"`
	JobID        string  `db:"job_id"`
	PrescriptionID string `db:"prescription_id"` // MongoDB ObjectID as string
	Status       string  `db:"status"`           // pending/processing/completed/failed
	RetryCount   int     `db:"retry_count"`
	MaxRetries   int     `db:"max_retries"`
	ErrorMessage string  `db:"error_message"`
	LockedAt     *time.Time `db:"locked_at"`
	LockedBy     string  `db:"locked_by"` // worker ID
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	CompletedAt  *time.Time `db:"completed_at"`
}

// EnrollmentJob represents an enrollment monitoring job.
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

// RoutingJob represents a pharmacy routing job.
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

// AdjudicationJob represents an insurance adjudication job.
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

// PaymentJob represents a payment monitoring job.
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

// ShippingJob represents a shipping label generation job.
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

// TrackingJob represents a delivery tracking job.
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

// AuditLog represents HIPAA-compliant audit trail.
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

// User represents an operations team member.
type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username     string             `bson:"username" json:"username" validate:"required"`
	Email        string             `bson:"email" json:"email" validate:"required,email"`
	PasswordHash string             `bson:"password_hash" json:"-"` // Never expose in JSON
	FirstName    string             `bson:"first_name" json:"first_name"`
	LastName     string             `bson:"last_name" json:"last_name"`
	Role         string             `bson:"role" json:"role"` // admin/ops_manager/ops_agent
	Status       string             `bson:"status" json:"status"` // active/inactive/suspended
	LastLoginAt  *time.Time         `bson:"last_login_at,omitempty" json:"last_login_at,omitempty"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

// Session represents a JWT session (stored in Redis).
type Session struct {
	SessionID string    `json:"session_id"`
	UserID    string    `json:"user_id"` // MongoDB ObjectID as string
	Role      string    `json:"role"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}


