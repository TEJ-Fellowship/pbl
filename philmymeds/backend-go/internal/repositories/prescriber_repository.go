package repositories

import (
	"context"
	"log"
	"time"

	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/database"
	"github.com/TEJ-Fellowship/pbl/philmymeds/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type PrescriberRepository struct {
	collection *mongo.Collection
}

func NewPrescriberRepository() *PrescriberRepository {
	return &PrescriberRepository{
		collection: database.GetCollection("prescribers"),
	}
}

// Create creates a new prescriber
func (r *PrescriberRepository) Create(ctx context.Context, prescriber *models.Prescriber) error {
	log.Println("🟢 [REPOSITORY] CreatePrescriber - Starting database insert...")
	log.Printf("🟢 [REPOSITORY] CreatePrescriber - Prescriber data: NPI=%s, Name=%s %s",
		prescriber.NPI, prescriber.FirstName, prescriber.LastName)

	prescriber.CreatedAt = time.Now()
	prescriber.UpdatedAt = time.Now()
	log.Printf("🟢 [REPOSITORY] CreatePrescriber - Set timestamps: CreatedAt=%v, UpdatedAt=%v",
		prescriber.CreatedAt, prescriber.UpdatedAt)

	log.Println("🟢 [REPOSITORY] CreatePrescriber - Executing InsertOne to MongoDB...")
	result, err := r.collection.InsertOne(ctx, prescriber)
	if err != nil {
		log.Printf("🔴 [REPOSITORY] CreatePrescriber - MongoDB insert error: %v", err)
		return err
	}

	prescriber.ID = result.InsertedID.(primitive.ObjectID)
	log.Printf("🟢 [REPOSITORY] CreatePrescriber - Success! Inserted with ID: %s", prescriber.ID.Hex())
	return nil
}

// FindByID finds a prescriber by ID
func (r *PrescriberRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Prescriber, error) {
	var prescriber models.Prescriber
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&prescriber)
	if err != nil {
		return nil, err
	}
	return &prescriber, nil
}

// FindByNPI finds a prescriber by NPI
func (r *PrescriberRepository) FindByNPI(ctx context.Context, npi string) (*models.Prescriber, error) {
	var prescriber models.Prescriber
	err := r.collection.FindOne(ctx, bson.M{"npi": npi}).Decode(&prescriber)
	if err != nil {
		return nil, err
	}
	return &prescriber, nil
}

// FindAll finds all prescribers
func (r *PrescriberRepository) FindAll(ctx context.Context) ([]*models.Prescriber, error) {
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var prescribers []*models.Prescriber
	if err := cursor.All(ctx, &prescribers); err != nil {
		return nil, err
	}
	return prescribers, nil
}

// Update updates a prescriber
func (r *PrescriberRepository) Update(ctx context.Context, id primitive.ObjectID, prescriber *models.Prescriber) error {
	prescriber.UpdatedAt = time.Now()
	update := bson.M{
		"$set": prescriber,
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		update,
	)
	return err
}

// Delete deletes a prescriber
func (r *PrescriberRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
