const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Seat = sequelize.define(
  "Seat",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    screen_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "screens",
        key: "id",
      },
    },
    seat_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    row_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    column_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seat_type: {
      type: DataTypes.ENUM("regular", "premium", "vip"),
      defaultValue: "regular",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "seats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = Seat;
