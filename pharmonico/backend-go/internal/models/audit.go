package models

import (
	"time"
)

// AuditLog represents an audit log entry in PostgreSQL
type AuditLog struct {
	ID             int64     `json:"id" db:"id"`
	EntityType     string    `json:"entity_type" db:"entity_type"`         // prescription, patient, pharmacy, etc.
	EntityID       string    `json:"entity_id" db:"entity_id"`             // MongoDB ObjectID as string
	Action         string    `json:"action" db:"action"`                   // created, updated, status_changed, etc.
	Actor          string    `json:"actor" db:"actor"`                     // user_id, system, worker_name
	PreviousStatus *string   `json:"previous_status,omitempty" db:"previous_status"`
	NewStatus      *string   `json:"new_status,omitempty" db:"new_status"`
	Payload        *string   `json:"payload,omitempty" db:"payload"`       // JSON with additional details
	IPAddress      *string   `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent      *string   `json:"user_agent,omitempty" db:"user_agent"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

