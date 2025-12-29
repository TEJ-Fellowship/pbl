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

type PrescriptionRepository struct {
	collection *mongo.Collection
}

func NewPrescriptionRepository() *PrescriptionRepository {
	return &PrescriptionRepository{
		collection: database.GetCollection("prescriptions"),
	}
}

// FindAll finds all prescriptions
func (r *PrescriptionRepository) FindAll(ctx context.Context) ([]*models.Prescription, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var prescriptions []*models.Prescription
	if err := cursor.All(ctx, &prescriptions); err != nil {
		return nil, err
	}
	return prescriptions, nil
}

// Create creates a new prescription
func (r *PrescriptionRepository) Create(ctx context.Context, prescription *models.Prescription) error {
	prescription.CreatedAt = time.Now()
	prescription.UpdatedAt = time.Now()

	// Set default status if not provided
	if prescription.Status == "" {
		prescription.Status = models.StatusReceived
	}

	// Initialize status history
	if len(prescription.StatusHistory) == 0 {
		prescription.StatusHistory = []models.StatusEntry{
			{
				Status:    prescription.Status,
				Reason:    "Prescription created",
				UpdatedBy: "system",
				Timestamp: time.Now(),
			},
		}
	}

	result, err := r.collection.InsertOne(ctx, prescription)
	if err != nil {
		return err
	}

	prescription.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// FindByID finds a prescription by ID
func (r *PrescriptionRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Prescription, error) {
	var prescription models.Prescription
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&prescription)
	if err != nil {
		return nil, err
	}
	return &prescription, nil
}

// FindByPrescriptionNumber finds a prescription by prescription numbePr
func (r *PrescriptionRepository) FindByPrescriptionNumber(ctx context.Context, prescriptionNumber string) (*models.Prescription, error) {
	var prescription models.Prescription
	err := r.collection.FindOne(ctx, bson.M{"prescription_number": prescriptionNumber}).Decode(&prescription)
	if err != nil {
		return nil, err
	}
	return &prescription, nil
}

// FindByPatientID finds all prescriptions for a patient
func (r *PrescriptionRepository) FindByPatientID(ctx context.Context, patientID primitive.ObjectID) ([]*models.Prescription, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"patient_id": patientID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var prescriptions []*models.Prescription
	if err := cursor.All(ctx, &prescriptions); err != nil {
		return nil, err
	}
	return prescriptions, nil
}

// FindByPrescriberID finds all prescriptions for a prescriber
func (r *PrescriptionRepository) FindByPrescriberID(ctx context.Context, prescriberID primitive.ObjectID) ([]*models.Prescription, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"prescriber_id": prescriberID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var prescriptions []*models.Prescription
	if err := cursor.All(ctx, &prescriptions); err != nil {
		return nil, err
	}
	return prescriptions, nil
}

// Update updates a prescription
func (r *PrescriptionRepository) Update(ctx context.Context, id primitive.ObjectID, prescription *models.Prescription) error {
	prescription.UpdatedAt = time.Now()
	update := bson.M{
		"$set": prescription,
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)
	return err
}

// Delete deletes a prescription
func (r *PrescriptionRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

// UpdateStatus updates the status of a prescription and adds to status history
func (r *PrescriptionRepository) UpdateStatus(ctx context.Context, id primitive.ObjectID, status string, reason string, updatedBy string) error {
	statusEntry := models.StatusEntry{
		Status:    status,
		Reason:    reason,
		UpdatedBy: updatedBy,
		Timestamp: time.Now(),
	}

	update := bson.M{
		"$set": bson.M{
			"status":     status,
			"updated_at": time.Now(),
		},
		"$push": bson.M{
			"status_history": statusEntry,
		},
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)
	return err
}
