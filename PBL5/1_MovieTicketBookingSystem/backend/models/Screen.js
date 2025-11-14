const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Screen = sequelize.define(
  "Screen",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    theater_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "theaters",
        key: "id",
      },
    },
    screen_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seat_layout: {
      type: DataTypes.JSONB,
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
    tableName: "screens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Screen;
