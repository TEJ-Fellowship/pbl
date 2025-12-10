# MongoDB Data Model Diagram

This diagram shows the high-level relationships between MongoDB collections in the PhilMyMeds prescription fulfillment system.

```mermaid
erDiagram
    %% Core Entities
    Patient ||--o{ InsuranceProfile : "has"
    Patient ||--o{ Prescription : "receives"
    Patient ||--o{ Enrollment : "enrolls"
    Patient ||--o{ Payment : "pays"
    Patient ||--o{ Notification : "receives"
    Patient ||--o| FileAsset : "uploads"
    
    Prescriber ||--o{ Prescription : "prescribes"
    
    Pharmacy ||--o{ Prescription : "fulfills"
    Pharmacy ||--o{ Adjudication : "processes"
    Pharmacy ||--o{ Shipment : "ships"
    Pharmacy ||--o| FileAsset : "generates"
    
    %% Prescription Workflow
    Prescription ||--o| Enrollment : "requires"
    Prescription ||--o| Adjudication : "has"
    Prescription ||--o| PriorAuthorization : "may_require"
    Prescription ||--o| Payment : "requires"
    Prescription ||--o| Shipment : "has"
    Prescription ||--o{ Notification : "triggers"
    Prescription ||--o| FileAsset : "references"
    
    %% Enrollment
    Enrollment }o--o| InsuranceProfile : "verifies"
    
    %% Adjudication
    Adjudication }o--o| PriorAuthorization : "may_require"
    Adjudication }o--o{ ManufacturerProgram : "uses"
    
    %% Manufacturer Programs
    ManufacturerProgram ||--o{ Adjudication : "applied_in"
    
    %% User (Operations Team)
    User ||--o{ Prescription : "selects_pharmacy_for"
    
    %% Embedded Documents (shown as attributes)
    Patient {
        ObjectID _id PK
        string first_name
        string last_name
        string email
        ObjectID insurance_profile_id FK
        Address address "embedded"
    }
    
    Prescriber {
        ObjectID _id PK
        string npi
        string first_name
        string last_name
        Address address "embedded"
    }
    
    Pharmacy {
        ObjectID _id PK
        string name
        string npi
        string license_number
        Address address "embedded"
        PharmacyCapability capabilities "embedded"
        array InsuranceContract insurance_contracts "embedded"
        PharmacyCapacity capacity "embedded"
        PharmacyPerformance performance "embedded"
    }
    
    InsuranceProfile {
        ObjectID _id PK
        ObjectID patient_id FK
        string payer_name
        string member_id
        string bin
        string pcn
    }
    
    Prescription {
        ObjectID _id PK
        string prescription_number
        string status
        ObjectID patient_id FK
        ObjectID prescriber_id FK
        ObjectID selected_pharmacy_id FK
        ObjectID enrollment_id FK
        ObjectID adjudication_id FK
        ObjectID payment_id FK
        ObjectID shipment_id FK
        string pharmacy_selected_by "user_id"
        Medication medication "embedded"
        array StatusEntry status_history "embedded"
        array PharmacyRecommendation pharmacy_recommendations "embedded"
    }
    
    Enrollment {
        ObjectID _id PK
        ObjectID prescription_id FK
        ObjectID patient_id FK
        ObjectID insurance_profile_id FK
        string magic_link_token
        bool hipaa_consent
        string status
    }
    
    ManufacturerProgram {
        ObjectID _id PK
        string program_code
        string program_name
        ManufacturerInfo manufacturer "embedded"
        DrugMapping drug "embedded"
        ProgramCredentials program_credentials "embedded"
        ProgramEligibility eligibility_rules "embedded"
    }
    
    Adjudication {
        ObjectID _id PK
        ObjectID prescription_id FK
        ObjectID pharmacy_id FK
        ObjectID prior_auth_id FK
        PrimaryInsuranceClaim primary_insurance "embedded"
        array ManufacturerProgramClaim manufacturer_programs "embedded"
        CostBreakdown cost_breakdown "embedded"
    }
    
    PriorAuthorization {
        ObjectID _id PK
        ObjectID prescription_id FK
        string payer_name
        string status
        array ObjectID supporting_docs FK
    }
    
    Payment {
        ObjectID _id PK
        ObjectID prescription_id FK
        ObjectID patient_id FK
        float64 amount
        string status
        string stripe_payment_intent_id
    }
    
    Shipment {
        ObjectID _id PK
        ObjectID prescription_id FK
        ObjectID pharmacy_id FK
        string tracking_number
        string carrier
        Address shipping_address "embedded"
        array ShipmentEvent tracking_history "embedded"
    }
    
    FileAsset {
        ObjectID _id PK
        string type
        ObjectID prescription_id FK
        ObjectID patient_id FK
        ObjectID pharmacy_id FK
        string storage_url
    }
    
    Notification {
        ObjectID _id PK
        ObjectID prescription_id FK
        ObjectID patient_id FK
        string type
        string channel
        string status
    }
    
    User {
        ObjectID _id PK
        string username
        string email
        string role
        string status
    }
```

## Collection Relationships Summary

### One-to-Many Relationships
- **Patient** → Prescription (one patient can have many prescriptions)
- **Patient** → InsuranceProfile (one patient can have multiple insurance profiles)
- **Patient** → Enrollment (one patient can have multiple enrollments)
- **Patient** → Payment (one patient can have multiple payments)
- **Prescriber** → Prescription (one prescriber can write many prescriptions)
- **Pharmacy** → Prescription (one pharmacy can fulfill many prescriptions)
- **Pharmacy** → Adjudication (one pharmacy processes many adjudications)
- **Pharmacy** → Shipment (one pharmacy ships many shipments)
- **Prescription** → Notification (one prescription triggers many notifications)
- **User** → Prescription (one user can select pharmacies for many prescriptions)

### One-to-One Relationships
- **Prescription** → Enrollment (one prescription requires one enrollment)
- **Prescription** → Adjudication (one prescription has one adjudication)
- **Prescription** → Payment (one prescription requires one payment)
- **Prescription** → Shipment (one prescription has one shipment)
- **Adjudication** → PriorAuthorization (one adjudication may require one PA)

### Many-to-Many Relationships
- **ManufacturerProgram** ↔ Adjudication (programs can be applied to multiple adjudications, adjudications can use multiple programs)

## Embedded Documents

The following are embedded within parent documents (not separate collections):

- **Address** - embedded in Patient, Prescriber, Pharmacy, Shipment
- **GeoLocation** - embedded in Address
- **PharmacyCapability** - embedded in Pharmacy
- **InsuranceContract** - embedded array in Pharmacy
- **PharmacyCapacity** - embedded in Pharmacy
- **PharmacyPerformance** - embedded in Pharmacy
- **Medication** - embedded in Prescription
- **StatusEntry** - embedded array in Prescription
- **PharmacyRecommendation** - embedded array in Prescription
- **PharmacyScore** - embedded in PharmacyRecommendation
- **PrimaryInsuranceClaim** - embedded in Adjudication
- **ManufacturerProgramClaim** - embedded array in Adjudication
- **CostBreakdown** - embedded in Adjudication
- **ShipmentEvent** - embedded array in Shipment

## Notes

1. **String References**: Some relationships use string IDs instead of ObjectID references:
   - `Prescription.PharmacySelectedBy` - stores User ID as string
   - `StatusEntry.UpdatedBy` - stores User ID or "system" as string
   - `FileAsset.UploadedBy` - stores User ID, "patient", or "system" as string

2. **Optional Relationships**: Many foreign keys are optional (omitempty), allowing for partial data during workflow stages.

3. **PostgreSQL Tables**: The following are stored in PostgreSQL, not MongoDB:
   - Job tables (ValidationJob, EnrollmentJob, RoutingJob, etc.)
   - AuditLog

4. **Redis**: Session data is stored in Redis, not MongoDB.
