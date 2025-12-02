// MongoDB seed script for pharmacies
// This runs automatically when MongoDB container starts

db = db.getSiblingDB('pharmonico');

// Create indexes
db.pharmacies.createIndex({ "location": "2dsphere" });
db.pharmacies.createIndex({ "npi": 1 }, { unique: true });
db.pharmacies.createIndex({ "is_active": 1 });
db.pharmacies.createIndex({ "accepted_insurers": 1 });

// Seed pharmacies
db.pharmacies.insertMany([
  {
    name: "MedCare Pharmacy",
    npi: "1234567890",
    ncpdp_id: "5712345",
    phone: "555-100-1001",
    fax: "555-100-1002",
    email: "contact@medcare-pharmacy.example.com",
    address: {
      street1: "100 Healthcare Blvd",
      street2: "Suite 101",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-122.4194, 37.7749]
    },
    accepted_insurers: ["Aetna", "Blue Cross", "Cigna", "United Healthcare", "Medicare"],
    specialty_types: ["general", "specialty"],
    current_capacity: 45,
    max_capacity: 100,
    is_active: true,
    operating_hours: {
      monday: { open: "08:00", close: "20:00" },
      tuesday: { open: "08:00", close: "20:00" },
      wednesday: { open: "08:00", close: "20:00" },
      thursday: { open: "08:00", close: "20:00" },
      friday: { open: "08:00", close: "20:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "10:00", close: "15:00" }
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Valley Health Pharmacy",
    npi: "2345678901",
    ncpdp_id: "5712346",
    phone: "555-200-2001",
    fax: "555-200-2002",
    email: "info@valleyhealth-rx.example.com",
    address: {
      street1: "250 Valley Drive",
      city: "San Jose",
      state: "CA",
      zip_code: "95110",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-121.8863, 37.3382]
    },
    accepted_insurers: ["Aetna", "Blue Cross", "Kaiser", "Medicare", "Medicaid"],
    specialty_types: ["general"],
    current_capacity: 30,
    max_capacity: 80,
    is_active: true,
    operating_hours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "14:00" }
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Specialty Care Rx",
    npi: "3456789012",
    ncpdp_id: "5712347",
    phone: "555-300-3001",
    fax: "555-300-3002",
    email: "rx@specialtycare.example.com",
    address: {
      street1: "500 Medical Center Way",
      street2: "Building C",
      city: "Oakland",
      state: "CA",
      zip_code: "94612",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-122.2711, 37.8044]
    },
    accepted_insurers: ["Aetna", "Blue Cross", "Cigna", "United Healthcare", "Express Scripts"],
    specialty_types: ["specialty", "oncology", "immunology"],
    current_capacity: 15,
    max_capacity: 50,
    is_active: true,
    operating_hours: {
      monday: { open: "08:00", close: "17:00" },
      tuesday: { open: "08:00", close: "17:00" },
      wednesday: { open: "08:00", close: "17:00" },
      thursday: { open: "08:00", close: "17:00" },
      friday: { open: "08:00", close: "17:00" }
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Downtown Pharmacy Plus",
    npi: "4567890123",
    ncpdp_id: "5712348",
    phone: "555-400-4001",
    email: "downtown@pharmacyplus.example.com",
    address: {
      street1: "789 Main Street",
      city: "Los Angeles",
      state: "CA",
      zip_code: "90012",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522]
    },
    accepted_insurers: ["Blue Cross", "Cigna", "Humana", "Medicare", "Medicaid"],
    specialty_types: ["general", "compounding"],
    current_capacity: 60,
    max_capacity: 120,
    is_active: true,
    operating_hours: {
      monday: { open: "07:00", close: "22:00" },
      tuesday: { open: "07:00", close: "22:00" },
      wednesday: { open: "07:00", close: "22:00" },
      thursday: { open: "07:00", close: "22:00" },
      friday: { open: "07:00", close: "22:00" },
      saturday: { open: "08:00", close: "20:00" },
      sunday: { open: "09:00", close: "18:00" }
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "Community Care Pharmacy",
    npi: "5678901234",
    ncpdp_id: "5712349",
    phone: "555-500-5001",
    fax: "555-500-5002",
    email: "care@communitypharmacy.example.com",
    address: {
      street1: "321 Community Lane",
      city: "Sacramento",
      state: "CA",
      zip_code: "95814",
      country: "USA"
    },
    location: {
      type: "Point",
      coordinates: [-121.4944, 38.5816]
    },
    accepted_insurers: ["Aetna", "Kaiser", "United Healthcare", "Medicare", "Medicaid", "Tricare"],
    specialty_types: ["general"],
    current_capacity: 25,
    max_capacity: 60,
    is_active: true,
    operating_hours: {
      monday: { open: "08:30", close: "18:30" },
      tuesday: { open: "08:30", close: "18:30" },
      wednesday: { open: "08:30", close: "18:30" },
      thursday: { open: "08:30", close: "18:30" },
      friday: { open: "08:30", close: "18:30" },
      saturday: { open: "09:00", close: "13:00" }
    },
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print("✅ Pharmacies seeded successfully!");
print("Total pharmacies:", db.pharmacies.countDocuments());

