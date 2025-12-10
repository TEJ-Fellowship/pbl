# Repository Pattern Explained

## What is a Repository?

A **Repository** is a design pattern that acts as a **mediator** between your business logic and database. It provides a clean interface for data operations without exposing database implementation details.

## Current Architecture

```
┌─────────────────┐
│   HTTP Handler  │  (e.g., CreatePatientHandler)
└────────┬────────┘
         │ uses
         ↓
┌─────────────────┐
│  Repository     │  (e.g., PatientRepository)
│  - Create()     │
│  - FindByID()   │
│  - Update()     │
│  - Delete()     │
└────────┬────────┘
         │ uses
         ↓
┌─────────────────┐
│   Database      │  (MongoDB)
│   - Collection  │
│   - BSON        │
└─────────────────┘
```

## Example: With Repository (Current)

```go
// Handler/Service Layer
func CreatePatientHandler(w http.ResponseWriter, r *http.Request) {
    // Parse request
    var dto dto.PatientDTO
    json.NewDecoder(r.Body).Decode(&dto)
    
    // Convert to model
    patient, _ := dto.ToModel()
    
    // Use repository (clean, simple)
    repo := repositories.NewPatientRepository()
    err := repo.Create(r.Context(), patient)
    
    // Handle response
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    
    // Convert back to DTO and return
    responseDTO := dto.PatientToDTO(patient)
    json.NewEncoder(w).Encode(responseDTO)
}
```

## Example: Without Repository (Direct Database Access)

```go
// Handler/Service Layer - BAD PRACTICE
func CreatePatientHandler(w http.ResponseWriter, r *http.Request) {
    // Parse request
    var dto dto.PatientDTO
    json.NewDecoder(r.Body).Decode(&dto)
    
    // Convert to model
    patient, _ := dto.ToModel()
    
    // Direct database access - MESSY!
    patient.CreatedAt = time.Now()
    patient.UpdatedAt = time.Now()
    
    collection := database.GetCollection("patients")
    result, err := collection.InsertOne(r.Context(), patient)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    
    patient.ID = result.InsertedID.(primitive.ObjectID)
    
    // Convert back to DTO and return
    responseDTO := dto.PatientToDTO(patient)
    json.NewEncoder(w).Encode(responseDTO)
}
```

## Problems Without Repository

### 1. **Code Duplication**
Every handler needs to:
- Set `CreatedAt` and `UpdatedAt`
- Handle MongoDB errors
- Convert ObjectIDs
- Write the same database queries

```go
// Handler 1
collection := database.GetCollection("patients")
patient.CreatedAt = time.Now()
patient.UpdatedAt = time.Now()
result, err := collection.InsertOne(ctx, patient)
// ... error handling

// Handler 2 (duplicate code!)
collection := database.GetCollection("prescriptions")
prescription.CreatedAt = time.Now()
prescription.UpdatedAt = time.Now()
result, err := collection.InsertOne(ctx, prescription)
// ... error handling

// Handler 3 (duplicate again!)
// ... same pattern repeated
```

### 2. **Hard to Test**
```go
// Without Repository - Can't easily mock MongoDB
func TestCreatePatient(t *testing.T) {
    // How do you test this without a real MongoDB connection?
    collection := database.GetCollection("patients")
    // ... need to set up test database, clean up, etc.
}

// With Repository - Easy to mock
func TestCreatePatient(t *testing.T) {
    mockRepo := &MockPatientRepository{}
    // Test your handler logic without database
}
```

### 3. **Hard to Change Database**
If you want to switch from MongoDB to PostgreSQL:

**Without Repository:**
- Change EVERY handler
- Change EVERY service
- Update ALL database queries
- Risk breaking everything

**With Repository:**
- Change ONLY the repository implementation
- Handlers/services remain unchanged

### 4. **Business Logic Mixed with Data Access**
```go
// Without Repository - Business logic mixed with DB code
func ProcessPrescription(prescriptionID string) {
    // Business logic
    if prescription.Status == "pending" {
        // Database code mixed in
        collection := database.GetCollection("prescriptions")
        filter := bson.M{"_id": id}
        update := bson.M{"$set": bson.M{"status": "processing"}}
        collection.UpdateOne(ctx, filter, update)
        
        // More business logic
        if prescription.Medication.IsControlled {
            // More database code
            collection := database.GetCollection("audit_logs")
            // ...
        }
    }
}
```

### 5. **Inconsistent Error Handling**
```go
// Handler 1
if err == mongo.ErrNoDocuments {
    return 404
}

// Handler 2
if err == mongo.ErrNoDocuments {
    return http.StatusNotFound
}

// Handler 3
if errors.Is(err, mongo.ErrNoDocuments) {
    return 404
}
// Inconsistent patterns everywhere!
```

## Benefits of Repository Pattern

### ✅ **Single Responsibility**
- Repository: Only handles data access
- Handler: Only handles HTTP requests
- Service: Only handles business logic

### ✅ **DRY (Don't Repeat Yourself)**
```go
// Write once in repository
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    patient.CreatedAt = time.Now()
    patient.UpdatedAt = time.Now()
    // ... all the logic in one place
}

// Use everywhere
repo.Create(ctx, patient)  // Handler 1
repo.Create(ctx, patient)  // Handler 2
repo.Create(ctx, patient)  // Service 1
```

### ✅ **Easy Testing**
```go
// Mock repository for testing
type MockPatientRepository struct {
    CreateFunc func(ctx context.Context, patient *models.Patient) error
}

func (m *MockPatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    return m.CreateFunc(ctx, patient)
}

// Test handler without database
func TestHandler(t *testing.T) {
    mockRepo := &MockPatientRepository{
        CreateFunc: func(ctx context.Context, patient *models.Patient) error {
            return nil // Simulate success
        },
    }
    // Test your handler
}
```

### ✅ **Consistent Interface**
```go
// All repositories follow same pattern
type PatientRepository interface {
    Create(ctx context.Context, patient *models.Patient) error
    FindByID(ctx context.Context, id primitive.ObjectID) (*models.Patient, error)
    Update(ctx context.Context, id primitive.ObjectID, patient *models.Patient) error
    Delete(ctx context.Context, id primitive.ObjectID) error
}

type PrescriptionRepository interface {
    Create(ctx context.Context, prescription *models.Prescription) error
    FindByID(ctx context.Context, id primitive.ObjectID) (*models.Prescription, error)
    // ... same pattern
}
```

### ✅ **Database Abstraction**
```go
// Repository hides MongoDB details
func (r *PatientRepository) FindByEmail(ctx context.Context, email string) (*models.Patient, error) {
    // MongoDB-specific code hidden here
    err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&patient)
    return &patient, err
}

// Handler doesn't know about MongoDB
patient, err := repo.FindByEmail(ctx, email)
```

## Real-World Example: Switching Databases

### Scenario: Migrate from MongoDB to PostgreSQL

**Without Repository:**
```go
// ❌ Change EVERY handler
func CreatePatientHandler(w http.ResponseWriter, r *http.Request) {
    // OLD: MongoDB
    collection := database.GetCollection("patients")
    result, err := collection.InsertOne(ctx, patient)
    
    // NEW: PostgreSQL (change everywhere!)
    query := "INSERT INTO patients (...) VALUES (...) RETURNING id"
    err := db.QueryRow(query, ...).Scan(&patient.ID)
    // ... change 50+ handlers
}
```

**With Repository:**
```go
// ✅ Change ONLY repository
// OLD: MongoDB implementation
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    result, err := r.collection.InsertOne(ctx, patient)
    // ...
}

// NEW: PostgreSQL implementation
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    query := "INSERT INTO patients (...) VALUES (...) RETURNING id"
    err := r.db.QueryRow(query, ...).Scan(&patient.ID)
    // ...
}

// Handlers remain unchanged! ✅
func CreatePatientHandler(w http.ResponseWriter, r *http.Request) {
    repo := repositories.NewPatientRepository()
    err := repo.Create(ctx, patient)  // Same interface!
}
```

## When Can You Skip Repository?

### Small Projects (Prototyping)
- Quick prototypes
- Single developer
- Won't scale
- No testing needed

### Simple CRUD Apps
- Very simple operations
- No complex queries
- No business logic

### Direct ORM Usage
- Using an ORM that already abstracts database
- ORM provides repository-like functionality

## Best Practices

### 1. **One Repository Per Entity**
```
repositories/
  ├── patient_repository.go
  ├── prescription_repository.go
  ├── pharmacy_repository.go
  └── ...
```

### 2. **Repository Interface (Optional but Recommended)**
```go
type PatientRepository interface {
    Create(ctx context.Context, patient *models.Patient) error
    FindByID(ctx context.Context, id primitive.ObjectID) (*models.Patient, error)
    FindByEmail(ctx context.Context, email string) (*models.Patient, error)
    Update(ctx context.Context, id primitive.ObjectID, patient *models.Patient) error
    Delete(ctx context.Context, id primitive.ObjectID) error
}
```

### 3. **Keep Business Logic Out**
```go
// ❌ BAD: Business logic in repository
func (r *PatientRepository) CreateWithValidation(ctx context.Context, patient *models.Patient) error {
    // Business logic - should be in service layer
    if patient.Age < 18 {
        return errors.New("patient must be 18+")
    }
    // ...
}

// ✅ GOOD: Repository only handles data
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    // Only data access logic
    result, err := r.collection.InsertOne(ctx, patient)
    // ...
}
```

## Summary

| Aspect | Without Repository | With Repository |
|--------|-------------------|-----------------|
| **Code Duplication** | High | Low |
| **Testability** | Hard | Easy |
| **Maintainability** | Low | High |
| **Database Switching** | Change everything | Change repository only |
| **Consistency** | Inconsistent | Consistent |
| **Separation of Concerns** | Mixed | Clean |

**Bottom Line:** Repository pattern is essential for maintainable, testable, and scalable applications. It's worth the small overhead for the long-term benefits.
