package services

import "errors"

// Service-level errors
var (
	ErrPatientNotFound      = errors.New("patient not found")
	ErrPatientAlreadyExists = errors.New("patient with this email already exists")
	ErrInvalidID            = errors.New("invalid ID format")
	ErrNotImplemented       = errors.New("not implemented")
)
