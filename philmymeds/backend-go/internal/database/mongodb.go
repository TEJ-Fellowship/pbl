package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient   *mongo.Client
	MongoDatabase *mongo.Database
)

// ConnectMongoDB initializes MongoDB connection
func ConnectMongoDB() error {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		return fmt.Errorf("MONGODB_URI environment variable is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel() //remember to defer this to avoid memory leaks

	clientOptions := options.Client().ApplyURI(mongoURI)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	MongoClient = client

	// Extract database name from URI or use default
	dbName := "philmymeds"
	MongoDatabase = client.Database(dbName)

	log.Println("✅ Successfully connected to MongoDB")
	return nil
}

// DisconnectMongoDB closes MongoDB connection
func DisconnectMongoDB() error {
	if MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return MongoClient.Disconnect(ctx)
	}
	return nil
}

// GetCollection returns a MongoDB collection
func GetCollection(name string) *mongo.Collection {
	if MongoDatabase == nil {
		log.Fatal("MongoDB database not initialized")
	}
	return MongoDatabase.Collection(name)
}
