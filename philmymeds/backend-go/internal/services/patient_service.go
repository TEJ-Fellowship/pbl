package services

import (
	"context"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// PatientService handles business logic for patients
type PatientService struct {
	repo *repositories.PatientRepository
}

// NewPatientService creates a new patient service
func NewPatientService(repo *repositories.PatientRepository) *PatientService {
	return &PatientService{
		repo: repo,
	}
}

// CreatePatient creates a new patient
func (s *PatientService) CreatePatient(ctx context.Context, patientDTO *dto.PatientDTO) (*dto.PatientDTO, error) {
	// Convert DTO to model
	patient, err := patientDTO.ToModel()
	if err != nil {
		return nil, err
	}

	// Check if patient with email already exists
	existing, err := s.repo.FindByEmail(ctx, patient.Email)
	if err == nil && existing != nil {
		return nil, ErrPatientAlreadyExists
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Create patient via repository
	if err := s.repo.Create(ctx, patient); err != nil {
		return nil, err
	}

	// Convert back to DTO
	return dto.PatientToDTO(patient), nil
}

// CreateOrGetPatient creates a patient if it doesn't exist, or returns existing one by email
func (s *PatientService) CreateOrGetPatient(ctx context.Context, patientDTO *dto.PatientDTO) (*dto.PatientDTO, error) {
	// Try to find existing patient by email
	if patientDTO.Email != "" {
		existing, err := s.repo.FindByEmail(ctx, patientDTO.Email)
		if err == nil && existing != nil {
			// Patient exists, return it
			return dto.PatientToDTO(existing), nil
		}
		if err != nil && err != mongo.ErrNoDocuments {
			return nil, err
		}
	}

	// Patient doesn't exist, create it
	return s.CreatePatient(ctx, patientDTO)
}

// GetPatientByID retrieves a patient by ID
func (s *PatientService) GetPatientByID(ctx context.Context, id string) (*dto.PatientDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	patient, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPatientNotFound
		}
		return nil, err
	}

	return dto.PatientToDTO(patient), nil
}

// GetPatientByEmail retrieves a patient by email
func (s *PatientService) GetPatientByEmail(ctx context.Context, email string) (*dto.PatientDTO, error) {
	patient, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPatientNotFound
		}
		return nil, err
	}

	return dto.PatientToDTO(patient), nil
}

// UpdatePatient updates an existing patient
func (s *PatientService) UpdatePatient(ctx context.Context, id string, patientDTO *dto.PatientDTO) (*dto.PatientDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Check if patient exists
	existing, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPatientNotFound
		}
		return nil, err
	}

	// Convert DTO to model
	patient, err := patientDTO.ToModel()
	if err != nil {
		return nil, err
	}

	// Preserve the ID and timestamps
	patient.ID = objectID
	patient.CreatedAt = existing.CreatedAt

	// Update patient via repository
	if err := s.repo.Update(ctx, objectID, patient); err != nil {
		return nil, err
	}

	// Fetch updated patient
	updated, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	return dto.PatientToDTO(updated), nil
}

// DeletePatient deletes a patient by ID
func (s *PatientService) DeletePatient(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidID
	}

	// Check if patient exists
	_, err = s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrPatientNotFound
		}
		return err
	}

	// Delete patient via repository
	return s.repo.Delete(ctx, objectID)
}

// ListPatients retrieves all patients (placeholder for pagination)
func (s *PatientService) ListPatients(ctx context.Context) ([]*dto.PatientDTO, error) {
	// Note: This is a placeholder. In production, you'd add pagination
	// For now, we'll need to add a FindAll method to repository
	// This is just showing the service layer structure
	return nil, ErrNotImplemented
}
