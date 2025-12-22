package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// PrescriptionService handles business logic for prescriptions
type PrescriptionService struct {
	repo *repositories.PrescriptionRepository
}

// NewPrescriptionService creates a new prescription service
func NewPrescriptionService(repo *repositories.PrescriptionRepository) *PrescriptionService {
	return &PrescriptionService{
		repo: repo,
	}
}

// GetAllPrescriptions retrieves all prescriptions
func (s *PrescriptionService) GetAllPrescriptions(ctx context.Context) ([]*dto.PrescriptionDTO, error) {
	prescriptions, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	dtos := make([]*dto.PrescriptionDTO, len(prescriptions))
	for i, p := range prescriptions {
		dtos[i] = dto.PrescriptionToDTO(p)
	}
	return dtos, nil
}

// CreatePrescription creates a new prescription
func (s *PrescriptionService) CreatePrescription(ctx context.Context, prescriptionDTO *dto.PrescriptionDTO) (*dto.PrescriptionDTO, error) {
	log.Println("🟡 [SERVICE] CreatePrescription - Starting...")
	log.Printf("🟡 [SERVICE] CreatePrescription - Input DTO: PatientID=%s, PrescriberID=%s, Status=%s",
		prescriptionDTO.PatientID, prescriptionDTO.PrescriberID, prescriptionDTO.Status)

	// Convert DTO to model
	log.Println("🟡 [SERVICE] CreatePrescription - Converting DTO to Model...")
	prescription, err := prescriptionDTO.ToModel()
	if err != nil {
		log.Printf("🔴 [SERVICE] CreatePrescription - Error converting DTO: %v", err)
		return nil, err
	}
	log.Printf("🟡 [SERVICE] CreatePrescription - Model created: PrescriptionNumber=%s, Status=%s",
		prescription.PrescriptionNumber, prescription.Status)

	// Generate prescription number if not provided
	if prescription.PrescriptionNumber == "" {
		prescription.PrescriptionNumber = s.generatePrescriptionNumber()
		log.Printf("🟡 [SERVICE] CreatePrescription - Generated prescription number: %s", prescription.PrescriptionNumber)
	} else {
		log.Printf("🟡 [SERVICE] CreatePrescription - Using provided prescription number: %s", prescription.PrescriptionNumber)
	}

	// Check if prescription number already exists
	log.Printf("🟡 [SERVICE] CreatePrescription - Checking if prescription number exists: %s", prescription.PrescriptionNumber)
	existing, err := s.repo.FindByPrescriptionNumber(ctx, prescription.PrescriptionNumber)
	if err == nil && existing != nil {
		log.Printf("🔴 [SERVICE] CreatePrescription - Prescription number already exists: %s", prescription.PrescriptionNumber)
		return nil, ErrPrescriptionAlreadyExists
	}
	if err != nil && err != mongo.ErrNoDocuments {
		log.Printf("🔴 [SERVICE] CreatePrescription - Error checking existing: %v", err)
		return nil, err
	}
	log.Println("🟡 [SERVICE] CreatePrescription - Prescription number is unique ✓")

	// Set default status if not provided
	if prescription.Status == "" {
		prescription.Status = models.StatusReceived
		log.Printf("🟡 [SERVICE] CreatePrescription - Set default status: %s", prescription.Status)
	} else {
		log.Printf("🟡 [SERVICE] CreatePrescription - Using provided status: %s", prescription.Status)
	}

	// Create prescription via repository
	// Note: Repository handles CreatedAt and UpdatedAt timestamps
	log.Println("🟡 [SERVICE] CreatePrescription - Calling repository to create...")
	if err := s.repo.Create(ctx, prescription); err != nil {
		log.Printf("🔴 [SERVICE] CreatePrescription - Repository error: %v", err)
		return nil, err
	}
	log.Printf("🟢 [SERVICE] CreatePrescription - Repository created successfully! ID: %s", prescription.ID.Hex())

	// Convert back to DTO
	log.Println("🟡 [SERVICE] CreatePrescription - Converting Model back to DTO...")
	result := dto.PrescriptionToDTO(prescription)
	log.Printf("🟢 [SERVICE] CreatePrescription - Success! Returning DTO with ID: %s", result.ID)
	return result, nil
}

// GetPrescriptionByID retrieves a prescription by ID
func (s *PrescriptionService) GetPrescriptionByID(ctx context.Context, id string) (*dto.PrescriptionDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	prescription, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriptionNotFound
		}
		return nil, err
	}

	return dto.PrescriptionToDTO(prescription), nil
}

// GetPrescriptionByPrescriptionNumber retrieves a prescription by prescription number
func (s *PrescriptionService) GetPrescriptionByPrescriptionNumber(ctx context.Context, prescriptionNumber string) (*dto.PrescriptionDTO, error) {
	prescription, err := s.repo.FindByPrescriptionNumber(ctx, prescriptionNumber)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriptionNotFound
		}
		return nil, err
	}

	return dto.PrescriptionToDTO(prescription), nil
}

// GetPrescriptionsByPatientID retrieves all prescriptions for a patient
func (s *PrescriptionService) GetPrescriptionsByPatientID(ctx context.Context, patientID string) ([]*dto.PrescriptionDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, ErrInvalidID
	}

	prescriptions, err := s.repo.FindByPatientID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	// Convert to DTOs
	dtos := make([]*dto.PrescriptionDTO, len(prescriptions))
	for i, p := range prescriptions {
		dtos[i] = dto.PrescriptionToDTO(p)
	}

	return dtos, nil
}

// GetPrescriptionsByPrescriberID retrieves all prescriptions for a prescriber
func (s *PrescriptionService) GetPrescriptionsByPrescriberID(ctx context.Context, prescriberID string) ([]*dto.PrescriptionDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(prescriberID)
	if err != nil {
		return nil, ErrInvalidID
	}

	prescriptions, err := s.repo.FindByPrescriberID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	// Convert to DTOs
	dtos := make([]*dto.PrescriptionDTO, len(prescriptions))
	for i, p := range prescriptions {
		dtos[i] = dto.PrescriptionToDTO(p)
	}

	return dtos, nil
}

// UpdatePrescription updates an existing prescription
func (s *PrescriptionService) UpdatePrescription(ctx context.Context, id string, prescriptionDTO *dto.PrescriptionDTO) (*dto.PrescriptionDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Check if prescription exists
	existing, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriptionNotFound
		}
		return nil, err
	}

	// Convert DTO to model
	prescription, err := prescriptionDTO.ToModel()
	if err != nil {
		return nil, err
	}

	// Preserve the ID and created timestamp
	prescription.ID = objectID
	prescription.CreatedAt = existing.CreatedAt
	prescription.UpdatedAt = time.Now()

	// Update prescription via repository
	if err := s.repo.Update(ctx, objectID, prescription); err != nil {
		return nil, err
	}

	// Fetch updated prescription
	updated, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	return dto.PrescriptionToDTO(updated), nil
}

// DeletePrescription deletes a prescription by ID
func (s *PrescriptionService) DeletePrescription(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidID
	}

	// Check if prescription exists
	_, err = s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrPrescriptionNotFound
		}
		return err
	}

	// Delete prescription via repository
	return s.repo.Delete(ctx, objectID)
}

// UpdatePrescriptionStatus updates the status of a prescription
func (s *PrescriptionService) UpdatePrescriptionStatus(ctx context.Context, id string, status string, reason string, updatedBy string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidID
	}

	// Check if prescription exists
	_, err = s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrPrescriptionNotFound
		}
		return err
	}

	// Update status via repository
	return s.repo.UpdateStatus(ctx, objectID, status, reason, updatedBy)
}

// generatePrescriptionNumber generates a unique prescription number
func (s *PrescriptionService) generatePrescriptionNumber() string {
	// Simple implementation: timestamp-based number
	// In production, you might want a more sophisticated approach
	return fmt.Sprintf("RX-%d", time.Now().Unix())
}
