package services

import "errors"

// Service-level errors
var (
	ErrPatientNotFound           = errors.New("patient not found")
	ErrPatientAlreadyExists      = errors.New("patient with this email already exists")
	ErrPrescriptionNotFound      = errors.New("prescription not found")
	ErrPrescriptionAlreadyExists = errors.New("prescription with this number already exists")
	ErrInvalidID                 = errors.New("invalid ID format")
	ErrNotImplemented            = errors.New("not implemented")
)
