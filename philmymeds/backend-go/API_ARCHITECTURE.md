# API Architecture

This document explains the layered architecture used in the PhilMyMeds API.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Request                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Router Layer (chi router)                                 │
│  - Route definitions                                        │
│  - Middleware setup                                         │
│  - URL parameter parsing                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Handler Layer (HTTP handlers)                            │
│  - Request parsing                                          │
│  - Response formatting                                      │
│  - HTTP status codes                                        │
│  - Error handling                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (Business logic)                            │
│  - Business rules                                           │
│  - Validation                                               │
│  - Data transformation                                      │
│  - Orchestration                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Repository Layer (Data access)                            │
│  - Database operations                                      │
│  - Query building                                            │
│  - Data persistence                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  Database Layer (MongoDB)                                   │
│  - Data storage                                             │
│  - Collections                                              │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Router Layer (`internal/router/`)
- **Purpose**: Define routes and middleware
- **Responsibilities**:
  - Route registration
  - Middleware configuration (logging, recovery, etc.)
  - URL parameter extraction
  - Dependency injection (repositories → services → handlers)

**Example:**
```go
r.Route("/api/v1/patients", func(r chi.Router) {
    r.Post("/", patientHandler.CreatePatient)
    r.Get("/{id}", patientHandler.GetPatient)
})
```

### 2. Handler Layer (`internal/handlers/`)
- **Purpose**: Handle HTTP requests and responses
- **Responsibilities**:
  - Parse HTTP request (JSON, query params, URL params)
  - Call service layer
  - Format HTTP response (JSON)
  - Handle HTTP status codes
  - Error response formatting

**Example:**
```go
func (h *PatientHandler) CreatePatient(w http.ResponseWriter, r *http.Request) {
    var patientDTO dto.PatientDTO
    json.NewDecoder(r.Body).Decode(&patientDTO)
    
    created, err := h.service.CreatePatient(r.Context(), &patientDTO)
    if err != nil {
        RespondWithError(w, http.StatusBadRequest, "Failed", err)
        return
    }
    
    RespondWithJSON(w, http.StatusCreated, created)
}
```

### 3. Service Layer (`internal/services/`)
- **Purpose**: Business logic and orchestration
- **Responsibilities**:
  - Business rules validation
  - Data validation
  - Orchestrate multiple repository calls
  - Transform data between DTOs and models
  - Handle business-level errors

**Example:**
```go
func (s *PatientService) CreatePatient(ctx context.Context, patientDTO *dto.PatientDTO) (*dto.PatientDTO, error) {
    // Check if patient exists
    existing, err := s.repo.FindByEmail(ctx, patient.Email)
    if err == nil && existing != nil {
        return nil, ErrPatientAlreadyExists
    }
    
    // Create patient
    patient, _ := patientDTO.ToModel()
    err = s.repo.Create(ctx, patient)
    return dto.PatientToDTO(patient), err
}
```

### 4. Repository Layer (`internal/repositories/`)
- **Purpose**: Data access abstraction
- **Responsibilities**:
  - Database operations (CRUD)
  - Query building
  - Data persistence
  - Handle database-specific errors

**Example:**
```go
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
    patient.CreatedAt = time.Now()
    patient.UpdatedAt = time.Now()
    result, err := r.collection.InsertOne(ctx, patient)
    patient.ID = result.InsertedID.(primitive.ObjectID)
    return err
}
```

### 5. Database Layer (`internal/database/`)
- **Purpose**: Database connection and configuration
- **Responsibilities**:
  - Database connection management
  - Collection access
  - Connection pooling

## API Endpoints

### Patient Endpoints

#### Create Patient
```http
POST /api/v1/patients
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "555-1234",
  "date_of_birth": "1990-01-01",
  "sex": "M",
  "address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  ...
}
```

#### Get Patient by ID
```http
GET /api/v1/patients/{id}
```

#### Get Patient by Email
```http
GET /api/v1/patients/email/{email}
```

#### Update Patient
```http
PUT /api/v1/patients/{id}
Content-Type: application/json

{
  "first_name": "Jane",
  ...
}
```

#### Delete Patient
```http
DELETE /api/v1/patients/{id}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Bad Request",
  "message": "Invalid request payload",
  "details": "json: cannot unmarshal string into Go struct"
}
```

## Running the API

```bash
# Build
go build ./cmd/api

# Run
./api

# Or directly
go run ./cmd/api
```

The server will start on port 8080 (or PORT environment variable).

## Testing the API

### Create a patient
```bash
curl -X POST http://localhost:8080/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "date_of_birth": "1990-01-01",
    "sex": "M",
    "address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    }
  }'
```

### Get patient by ID
```bash
curl http://localhost:8080/api/v1/patients/{id}
```

### Update patient
```bash
curl -X PUT http://localhost:8080/api/v1/patients/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    ...
  }'
```

### Delete patient
```bash
curl -X DELETE http://localhost:8080/api/v1/patients/{id}
```

## Adding New Endpoints

To add a new endpoint (e.g., Prescription):

1. **Create Repository** (`internal/repositories/prescription_repository.go`)
2. **Create Service** (`internal/services/prescription_service.go`)
3. **Create Handler** (`internal/handlers/prescription_handler.go`)
4. **Add Routes** (`internal/router/router.go`)

Example:
```go
// In router.go
prescriptionRepo := repositories.NewPrescriptionRepository()
prescriptionService := services.NewPrescriptionService(prescriptionRepo)
prescriptionHandler := handlers.NewPrescriptionHandler(prescriptionService)

r.Route("/prescriptions", func(r chi.Router) {
    r.Post("/", prescriptionHandler.CreatePrescription)
    r.Get("/{id}", prescriptionHandler.GetPrescription)
    // ... more routes
})
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Easy to mock dependencies for unit testing
3. **Maintainability**: Changes in one layer don't affect others
4. **Scalability**: Easy to add new features following the same pattern
5. **Reusability**: Services can be used by multiple handlers (HTTP, gRPC, CLI)
