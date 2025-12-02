package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Patient represents a patient in the system
type Patient struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName       string             `bson:"first_name" json:"first_name"`
	LastName        string             `bson:"last_name" json:"last_name"`
	DateOfBirth     time.Time          `bson:"date_of_birth" json:"date_of_birth"`
	Gender          string             `bson:"gender,omitempty" json:"gender,omitempty"`
	Phone           string             `bson:"phone,omitempty" json:"phone,omitempty"`
	Email           string             `bson:"email,omitempty" json:"email,omitempty"`
	Address         Address            `bson:"address" json:"address"`
	Insurance       *InsuranceInfo     `bson:"insurance,omitempty" json:"insurance,omitempty"`
	IsEnrolled      bool               `bson:"is_enrolled" json:"is_enrolled"`
	HIPAAConsent    bool               `bson:"hipaa_consent" json:"hipaa_consent"`
	ConsentDate     *time.Time         `bson:"consent_date,omitempty" json:"consent_date,omitempty"`
	CouponEnrolled  bool               `bson:"coupon_enrolled" json:"coupon_enrolled"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

// InsuranceInfo contains patient insurance details
type InsuranceInfo struct {
	CarrierName     string `bson:"carrier_name" json:"carrier_name"`
	MemberID        string `bson:"member_id" json:"member_id"`
	GroupNumber     string `bson:"group_number,omitempty" json:"group_number,omitempty"`
	BIN             string `bson:"bin,omitempty" json:"bin,omitempty"`
	PCN             string `bson:"pcn,omitempty" json:"pcn,omitempty"`
	CardImageFront  string `bson:"card_image_front,omitempty" json:"card_image_front,omitempty"`
	CardImageBack   string `bson:"card_image_back,omitempty" json:"card_image_back,omitempty"`
}

