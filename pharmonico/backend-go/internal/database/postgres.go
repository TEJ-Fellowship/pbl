package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PostgresDB wraps the PostgreSQL connection pool
type PostgresDB struct {
	Pool *pgxpool.Pool
}

// NewPostgresDB creates a new PostgreSQL connection pool
func NewPostgresDB(uri string) (*PostgresDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, uri)
	if err != nil {
		return nil, err
	}

	// Ping to verify connection
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return &PostgresDB{Pool: pool}, nil
}

// Close closes the PostgreSQL connection pool
func (p *PostgresDB) Close() {
	p.Pool.Close()
}

