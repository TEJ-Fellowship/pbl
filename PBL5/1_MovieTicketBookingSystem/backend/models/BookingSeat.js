const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const BookingSeat = sequelize.define(
  "BookingSeat",
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
    },
    seat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "seats",
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "booking_seats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = BookingSeat;
