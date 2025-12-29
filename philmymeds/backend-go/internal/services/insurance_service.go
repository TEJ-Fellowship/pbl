package services

import (
	"context"
	"strings"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/dto"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/repositories"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// InsuranceService handles business logic for insurance profiles
type InsuranceService struct {
	repo *repositories.InsuranceRepository
}

// NewInsuranceService creates a new insurance service
func NewInsuranceService(repo *repositories.InsuranceRepository) *InsuranceService {
	return &InsuranceService{
		repo: repo,
	}
}

// CreateInsuranceProfile creates a new insurance profile
func (s *InsuranceService) CreateInsuranceProfile(ctx context.Context, patientID string, insuranceReq *dto.InsuranceInfoRequest) (*models.InsuranceProfile, error) {
	patientObjectID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, ErrInvalidID
	}

	// Determine if government insurance
	planType := strings.ToLower(insuranceReq.PlanType)
	isGovernment := planType == "medicare" || planType == "medicaid" || planType == "tricare" || planType == "va"

	insurance := &models.InsuranceProfile{
		PatientID:    patientObjectID,
		PayerName:    insuranceReq.PayerName,
		MemberID:     insuranceReq.MemberID,
		GroupNumber:  insuranceReq.GroupNumber,
		BIN:          insuranceReq.BIN,
		PCN:          insuranceReq.PCN,
		PlanType:     insuranceReq.PlanType,
		IsGovernment: isGovernment,
	}

	if err := s.repo.Create(ctx, insurance); err != nil {
		return nil, err
	}

	return insurance, nil
}

// GetInsuranceProfileByID retrieves an insurance profile by ID
func (s *InsuranceService) GetInsuranceProfileByID(ctx context.Context, id string) (*models.InsuranceProfile, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidID
	}

	insurance, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrInsuranceProfileNotFound
		}
		return nil, err
	}

	return insurance, nil
}

// GetInsuranceProfilesByPatientID retrieves all insurance profiles for a patient
func (s *InsuranceService) GetInsuranceProfilesByPatientID(ctx context.Context, patientID string) ([]*models.InsuranceProfile, error) {
	objectID, err := primitive.ObjectIDFromHex(patientID)
	if err != nil {
		return nil, ErrInvalidID
	}

	return s.repo.FindByPatientID(ctx, objectID)
}

