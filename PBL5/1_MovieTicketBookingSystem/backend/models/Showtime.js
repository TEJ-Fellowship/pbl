const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Showtime = sequelize.define(
  "Showtime",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    movie_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "movies",
        key: "id",
      },
    },
    screen_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "screens",
        key: "id",
      },
    },
    show_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    available_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "cancelled", "completed"),
      defaultValue: "active",
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
    tableName: "showtimes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Showtime;
