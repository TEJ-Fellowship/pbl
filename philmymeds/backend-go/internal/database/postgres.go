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
		user = "admin"
	}

	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "password"
	}

	dbname := os.Getenv("POSTGRES_DB")
	if dbname == "" {
		dbname = "philmymeds"
	}

	connString := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	PostgresPool = pool
	log.Println("✅ Successfully connected to PostgreSQL")
	return nil
}

// ClosePostgres closes PostgreSQL connection pool
func ClosePostgres() {
	if PostgresPool != nil {
		PostgresPool.Close()
	}
}
