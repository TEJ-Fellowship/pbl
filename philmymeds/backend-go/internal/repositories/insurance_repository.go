package repositories

import (
	"context"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type InsuranceRepository struct {
	collection *mongo.Collection
}

func NewInsuranceRepository() *InsuranceRepository {
	return &InsuranceRepository{
		collection: database.GetCollection("insurance_profiles"),
	}
}

// Create creates a new insurance profile
func (r *InsuranceRepository) Create(ctx context.Context, insurance *models.InsuranceProfile) error {
	insurance.CreatedAt = time.Now()
	insurance.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, insurance)
	if err != nil {
		return err
	}

	insurance.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// FindByID finds an insurance profile by ID
func (r *InsuranceRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.InsuranceProfile, error) {
	var insurance models.InsuranceProfile
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&insurance)
	if err != nil {
		return nil, err
	}
	return &insurance, nil
}

// FindByPatientID finds insurance profiles for a patient
func (r *InsuranceRepository) FindByPatientID(ctx context.Context, patientID primitive.ObjectID) ([]*models.InsuranceProfile, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"patient_id": patientID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var profiles []*models.InsuranceProfile
	if err := cursor.All(ctx, &profiles); err != nil {
		return nil, err
	}
	return profiles, nil
}

// Update updates an insurance profile
func (r *InsuranceRepository) Update(ctx context.Context, id primitive.ObjectID, insurance *models.InsuranceProfile) error {
	insurance.UpdatedAt = time.Now()
	update := bson.M{
		"$set": insurance,
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)
	return err
}

// Delete deletes an insurance profile
func (r *InsuranceRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
