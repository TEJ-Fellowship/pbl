const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const SeatReservation = sequelize.define(
  "SeatReservation",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    showtime_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "showtimes",
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
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("reserved", "expired", "confirmed"),
      defaultValue: "reserved",
    },
    reserved_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "seat_reservations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = SeatReservation;
