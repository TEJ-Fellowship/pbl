// MongoDB seed script for sample prescriptions
// This runs automatically when MongoDB container starts

db = db.getSiblingDB('pharmonico');

// Create indexes
db.prescriptions.createIndex({ "status": 1 });
db.prescriptions.createIndex({ "patient_id": 1 });
db.prescriptions.createIndex({ "pharmacy_id": 1 });
db.prescriptions.createIndex({ "created_at": -1 });
db.prescriptions.createIndex({ "patient.last_name": 1, "patient.first_name": 1 });

// Create indexes for patients
db.patients.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.patients.createIndex({ "phone": 1 }, { sparse: true });

// Create indexes for magic links
db.magic_links.createIndex({ "token": 1 }, { unique: true });
db.magic_links.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

// Create indexes for enrollments
db.enrollments.createIndex({ "patient_id": 1 });
db.enrollments.createIndex({ "prescription_id": 1 });

// Seed sample prescriptions
db.prescriptions.insertMany([
  {
    status: "received",
    prescriber: {
      npi: "1122334455",
      dea_number: "AB1234567",
      first_name: "Sarah",
      last_name: "Johnson",
      phone: "555-DOC-0001",
      address: {
        street1: "100 Medical Plaza",
        city: "San Francisco",
        state: "CA",
        zip_code: "94105",
        country: "USA"
      }
    },
    medication: {
      ndc: "00069-0150-83",
      name: "Lipitor",
      strength: "20mg",
      form: "tablet",
      quantity: 30,
      days_supply: 30,
      directions: "Take one tablet by mouth once daily",
      refills: 5
    },
    patient: {
      first_name: "John",
      last_name: "Smith",
      date_of_birth: new Date("1980-05-15"),
      gender: "male",
      phone: "555-555-1001",
      email: "john.smith@example.com",
      address: {
        street1: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip_code: "94102",
        country: "USA"
      }
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    status: "validated",
    prescriber: {
      npi: "2233445566",
      first_name: "Michael",
      last_name: "Chen",
      phone: "555-DOC-0002",
      address: {
        street1: "200 Health Center Drive",
        city: "San Jose",
        state: "CA",
        zip_code: "95110",
        country: "USA"
      }
    },
    medication: {
      ndc: "00006-0021-31",
      name: "Januvia",
      strength: "100mg",
      form: "tablet",
      quantity: 30,
      days_supply: 30,
      directions: "Take one tablet by mouth once daily with or without food",
      refills: 3
    },
    patient: {
      first_name: "Maria",
      last_name: "Garcia",
      date_of_birth: new Date("1975-08-22"),
      gender: "female",
      phone: "555-555-2002",
      email: "maria.garcia@example.com",
      address: {
        street1: "456 Oak Avenue",
        city: "San Jose",
        state: "CA",
        zip_code: "95112",
        country: "USA"
      }
    },
    created_at: new Date(Date.now() - 3600000), // 1 hour ago
    updated_at: new Date()
  },
  {
    status: "validation_issue",
    validation_errors: ["Missing DEA number for controlled substance", "Prescriber NPI not verified"],
    prescriber: {
      npi: "9999999999",
      first_name: "Unknown",
      last_name: "Doctor",
      address: {
        city: "Unknown",
        state: "CA",
        zip_code: "00000"
      }
    },
    medication: {
      ndc: "00591-0385-01",
      name: "Hydrocodone/Acetaminophen",
      strength: "5-325mg",
      form: "tablet",
      quantity: 20,
      days_supply: 10,
      directions: "Take one tablet every 4-6 hours as needed for pain",
      refills: 0
    },
    patient: {
      first_name: "Robert",
      last_name: "Williams",
      date_of_birth: new Date("1965-12-10"),
      gender: "male",
      phone: "555-555-3003",
      address: {
        street1: "789 Pine Road",
        city: "Oakland",
        state: "CA",
        zip_code: "94612",
        country: "USA"
      }
    },
    created_at: new Date(Date.now() - 7200000), // 2 hours ago
    updated_at: new Date()
  },
  {
    status: "awaiting_enrollment",
    prescriber: {
      npi: "3344556677",
      dea_number: "BC2345678",
      first_name: "Emily",
      last_name: "Davis",
      phone: "555-DOC-0004",
      address: {
        street1: "300 Wellness Blvd",
        city: "Los Angeles",
        state: "CA",
        zip_code: "90012",
        country: "USA"
      }
    },
    medication: {
      ndc: "00002-7510-01",
      name: "Humira",
      strength: "40mg/0.4mL",
      form: "injection",
      quantity: 2,
      days_supply: 28,
      directions: "Inject 40mg subcutaneously every other week",
      refills: 5
    },
    patient: {
      first_name: "Jennifer",
      last_name: "Lee",
      date_of_birth: new Date("1988-03-28"),
      gender: "female",
      phone: "555-555-4004",
      email: "jennifer.lee@example.com",
      address: {
        street1: "1010 Sunset Blvd",
        city: "Los Angeles",
        state: "CA",
        zip_code: "90028",
        country: "USA"
      }
    },
    created_at: new Date(Date.now() - 86400000), // 1 day ago
    updated_at: new Date()
  },
  {
    status: "pharmacy_selected",
    pharmacy_id: db.pharmacies.findOne({ npi: "1234567890" })._id,
    prescriber: {
      npi: "4455667788",
      first_name: "David",
      last_name: "Kim",
      phone: "555-DOC-0005",
      address: {
        street1: "400 Medical Tower",
        city: "Sacramento",
        state: "CA",
        zip_code: "95814",
        country: "USA"
      }
    },
    medication: {
      ndc: "00093-7180-98",
      name: "Metformin",
      strength: "500mg",
      form: "tablet",
      quantity: 60,
      days_supply: 30,
      directions: "Take one tablet by mouth twice daily with meals",
      refills: 11
    },
    patient: {
      first_name: "James",
      last_name: "Wilson",
      date_of_birth: new Date("1970-07-04"),
      gender: "male",
      phone: "555-555-5005",
      email: "james.wilson@example.com",
      address: {
        street1: "555 Capitol Mall",
        city: "Sacramento",
        state: "CA",
        zip_code: "95814",
        country: "USA"
      }
    },
    created_at: new Date(Date.now() - 172800000), // 2 days ago
    updated_at: new Date()
  }
]);

print("✅ Sample prescriptions seeded successfully!");
print("Total prescriptions:", db.prescriptions.countDocuments());
print("  - received:", db.prescriptions.countDocuments({ status: "received" }));
print("  - validated:", db.prescriptions.countDocuments({ status: "validated" }));
print("  - validation_issue:", db.prescriptions.countDocuments({ status: "validation_issue" }));
print("  - awaiting_enrollment:", db.prescriptions.countDocuments({ status: "awaiting_enrollment" }));
print("  - pharmacy_selected:", db.prescriptions.countDocuments({ status: "pharmacy_selected" }));

