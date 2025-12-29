package services

import (
	"context"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// PrescriberService handles business logic for prescribers
type PrescriberService struct {
	repo *repositories.PrescriberRepository
}

// NewPrescriberService creates a new prescriber service
func NewPrescriberService(repo *repositories.PrescriberRepository) *PrescriberService {
	return &PrescriberService{
		repo: repo,
	}
}

// CreatePrescriber creates a new prescriber
func (s *PrescriberService) CreatePrescriber(ctx context.Context, prescriberDTO *dto.PrescriberDTO) (*dto.PrescriberDTO, error) {
	// Convert DTO to model
	prescriber, err := prescriberDTO.ToModel()
	if err != nil {
		return nil, err
	}

	// Check if prescriber with NPI already exists
	existing, err := s.repo.FindByNPI(ctx, prescriber.NPI)
	if err == nil && existing != nil {
		return nil, ErrPrescriberAlreadyExists
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Create prescriber via repository
	if err := s.repo.Create(ctx, prescriber); err != nil {
		return nil, err
	}

	// Convert back to DTO
	result := dto.PrescriberToDTO(prescriber)
	return result, nil
}

// GetPrescriberByID retrieves a prescriber by ID
func (s *PrescriberService) GetPrescriberByID(ctx context.Context, id string) (*dto.PrescriberDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	prescriber, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriberNotFound
		}
		return nil, err
	}

	return dto.PrescriberToDTO(prescriber), nil
}

// GetPrescriberByNPI retrieves a prescriber by NPI
func (s *PrescriberService) GetPrescriberByNPI(ctx context.Context, npi string) (*dto.PrescriberDTO, error) {
	prescriber, err := s.repo.FindByNPI(ctx, npi)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriberNotFound
		}
		return nil, err
	}

	return dto.PrescriberToDTO(prescriber), nil
}

// CreateOrGetPrescriber creates a prescriber if it doesn't exist, or returns existing one by NPI
func (s *PrescriberService) CreateOrGetPrescriber(ctx context.Context, prescriberDTO *dto.PrescriberDTO) (*dto.PrescriberDTO, error) {
	// Try to find existing prescriber by NPI
	existing, err := s.repo.FindByNPI(ctx, prescriberDTO.NPI)
	if err == nil && existing != nil {
		// Prescriber exists, return it
		return dto.PrescriberToDTO(existing), nil
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Prescriber doesn't exist, create it
	return s.CreatePrescriber(ctx, prescriberDTO)
}

// GetAllPrescribers retrieves all prescribers
func (s *PrescriberService) GetAllPrescribers(ctx context.Context) ([]*dto.PrescriberDTO, error) {
	prescribers, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	dtos := make([]*dto.PrescriberDTO, len(prescribers))
	for i, p := range prescribers {
		dtos[i] = dto.PrescriberToDTO(p)
	}
	return dtos, nil
}

// UpdatePrescriber updates an existing prescriber
func (s *PrescriberService) UpdatePrescriber(ctx context.Context, id string, prescriberDTO *dto.PrescriberDTO) (*dto.PrescriberDTO, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Check if prescriber exists
	existing, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrPrescriberNotFound
		}
		return nil, err
	}

	// Convert DTO to model
	prescriber, err := prescriberDTO.ToModel()
	if err != nil {
		return nil, err
	}

	// Preserve the ID, created timestamp, and immutable fields
	prescriber.ID = objectID
	prescriber.CreatedAt = existing.CreatedAt
	prescriber.NPI = existing.NPI // NPI is immutable

	// Update prescriber via repository
	if err := s.repo.Update(ctx, objectID, prescriber); err != nil {
		return nil, err
	}

	// Fetch updated prescriber
	updated, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	return dto.PrescriberToDTO(updated), nil
}

// DeletePrescriber deletes a prescriber by ID
func (s *PrescriberService) DeletePrescriber(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidID
	}

	// Check if prescriber exists
	_, err = s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return ErrPrescriberNotFound
		}
		return err
	}

	// Delete prescriber via repository
	return s.repo.Delete(ctx, objectID)
}
