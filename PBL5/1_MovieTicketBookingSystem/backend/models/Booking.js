const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    showtime_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "showtimes",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "reserved",
        "confirmed",
        "cancelled",
        "expired"
      ),
      defaultValue: "pending",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    confirmed_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Booking;
