package config

import (
	"os"
)

// Config holds all application configuration
type Config struct {
	// Server
	Port        string
	Environment string

	// MongoDB
	MongoURI      string
	MongoDatabase string

	// PostgreSQL
	PostgresURI string

	// MinIO (S3-compatible storage)
	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string

	// Stripe
	StripeSecretKey      string
	StripeWebhookSecret  string

	// Shippo
	ShippoAPIKey string

	// SendGrid
	SendGridAPIKey string

	// Twilio
	TwilioAccountSID string
	TwilioAuthToken  string
	TwilioFromNumber string

	// JWT
	JWTSecret     string
	JWTExpiration string

	// Gemini API (for mock prescription generation)
	GeminiAPIKey string
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		// Server
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),

		// MongoDB
		MongoURI:      getEnv("MONGO_URI", "mongodb://mongodb:27017"),
		MongoDatabase: getEnv("MONGO_DATABASE", "pharmonico"),

		// PostgreSQL
		PostgresURI: getEnv("POSTGRES_URI", "postgres://postgres:postgres@postgres:5432/pharmonico?sslmode=disable"),

		// MinIO
		MinioEndpoint:  getEnv("MINIO_ENDPOINT", "minio:9000"),
		MinioAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    getEnv("MINIO_BUCKET", "pharmonico"),

		// Stripe
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),

		// Shippo
		ShippoAPIKey: getEnv("SHIPPO_API_KEY", ""),

		// SendGrid
		SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),

		// Twilio
		TwilioAccountSID: getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioAuthToken:  getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioFromNumber: getEnv("TWILIO_FROM_NUMBER", ""),

		// JWT
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpiration: getEnv("JWT_EXPIRATION", "24h"),

		// Gemini
		GeminiAPIKey: getEnv("GEMINI_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

