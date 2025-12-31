package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var PostgresPool *pgxpool.Pool

// ConnectPostgres initializes PostgreSQL connection pool
func ConnectPostgres() error {
	host := os.Getenv("POSTGRES_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5431"
	}

	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = "sanjeev"
	}

	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "password"
	}

	dbname := os.Getenv("POSTGRES_DB")
	if dbname == "" {
		dbname = "philmymedspg"
	}

	connString := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	log.Printf("🔌 Connecting to PostgreSQL at %s:%s (database: %s)", host, port, dbname)

	// Use longer timeout for Docker (PostgreSQL might be starting up)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection with retries (for Docker startup)
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		if err := pool.Ping(ctx); err != nil {
			if i < maxRetries-1 {
				log.Printf("⏳ PostgreSQL not ready yet, retrying... (%d/%d)", i+1, maxRetries)
				time.Sleep(2 * time.Second)
				continue
			}
			return fmt.Errorf("failed to ping PostgreSQL after %d attempts: %w", maxRetries, err)
		}
		break
	}

	PostgresPool = pool
	log.Printf("✅ Successfully connected to PostgreSQL at %s:%s", host, port)
	return nil
}

// ClosePostgres closes PostgreSQL connection pool
func ClosePostgres() {
	if PostgresPool != nil {
		PostgresPool.Close()
	}
}
