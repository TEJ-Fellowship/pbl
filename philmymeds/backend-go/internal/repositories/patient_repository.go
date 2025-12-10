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

type PatientRepository struct {
	collection *mongo.Collection
}

func NewPatientRepository() *PatientRepository {
	return &PatientRepository{
		collection: database.GetCollection("patients"),
	}
}

// Create creates a new patient
func (r *PatientRepository) Create(ctx context.Context, patient *models.Patient) error {
	patient.CreatedAt = time.Now()
	patient.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, patient)
	if err != nil {
		return err
	}

	patient.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// FindByID finds a patient by ID
func (r *PatientRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Patient, error) {
	var patient models.Patient
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&patient)
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

// FindByEmail finds a patient by email
func (r *PatientRepository) FindByEmail(ctx context.Context, email string) (*models.Patient, error) {
	var patient models.Patient
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&patient)
	if err != nil {
		return nil, err
	}
	return &patient, nil
}

// Update updates a patient
func (r *PatientRepository) Update(ctx context.Context, id primitive.ObjectID, patient *models.Patient) error {
	patient.UpdatedAt = time.Now()
	update := bson.M{
		"$set": patient,
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)
	return err
}

// Delete deletes a patient
func (r *PatientRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
