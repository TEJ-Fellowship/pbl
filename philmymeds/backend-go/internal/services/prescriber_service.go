package services

import (
	"context"
	"log"

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
	log.Println("🟡 [SERVICE] CreatePrescriber - Starting...")
	log.Printf("🟡 [SERVICE] CreatePrescriber - Input DTO: NPI=%s, Name=%s %s",
		prescriberDTO.NPI, prescriberDTO.FirstName, prescriberDTO.LastName)

	// Convert DTO to model
	log.Println("🟡 [SERVICE] CreatePrescriber - Converting DTO to Model...")
	prescriber, err := prescriberDTO.ToModel()
	if err != nil {
		log.Printf("🔴 [SERVICE] CreatePrescriber - Error converting DTO: %v", err)
		return nil, err
	}
	log.Printf("🟡 [SERVICE] CreatePrescriber - Model created: NPI=%s", prescriber.NPI)

	// Check if prescriber with NPI already exists
	log.Printf("🟡 [SERVICE] CreatePrescriber - Checking if NPI exists: %s", prescriber.NPI)
	existing, err := s.repo.FindByNPI(ctx, prescriber.NPI)
	if err == nil && existing != nil {
		log.Printf("🔴 [SERVICE] CreatePrescriber - Prescriber with NPI already exists: %s", prescriber.NPI)
		return nil, ErrPrescriberAlreadyExists
	}
	if err != nil && err != mongo.ErrNoDocuments {
		log.Printf("🔴 [SERVICE] CreatePrescriber - Error checking existing: %v", err)
		return nil, err
	}
	log.Println("🟡 [SERVICE] CreatePrescriber - NPI is unique ✓")

	// Create prescriber via repository
	log.Println("🟡 [SERVICE] CreatePrescriber - Calling repository to create...")
	if err := s.repo.Create(ctx, prescriber); err != nil {
		log.Printf("🔴 [SERVICE] CreatePrescriber - Repository error: %v", err)
		return nil, err
	}
	log.Printf("🟢 [SERVICE] CreatePrescriber - Repository created successfully! ID: %s", prescriber.ID.Hex())

	// Convert back to DTO
	log.Println("🟡 [SERVICE] CreatePrescriber - Converting Model back to DTO...")
	result := dto.PrescriberToDTO(prescriber)
	log.Printf("🟢 [SERVICE] CreatePrescriber - Success! Returning DTO with ID: %s", result.ID)
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

	// Preserve the ID and created timestamp
	prescriber.ID = objectID
	prescriber.CreatedAt = existing.CreatedAt

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
