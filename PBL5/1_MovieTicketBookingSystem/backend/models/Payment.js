// backend/models/Payment.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "bookings",
        key: "id",
      },
      unique: true, // One payment per booking
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM(
        "credit_card",
        "debit_card",
        "eSewa",
        "Khalti",
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "success",
        "failed",
        "refunded"
      ),
      defaultValue: "pending",
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idempotency_key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Payment;
