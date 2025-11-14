const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Movie = sequelize.define(
  "Movie",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING(100),
    },
    language: {
      type: DataTypes.STRING(50),
    },
    rating: {
      type: DataTypes.STRING(10),
    },
    poster_url: {
      type: DataTypes.STRING(500),
    },
    release_date: {
      type: DataTypes.DATEONLY,
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
    tableName: "movies",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = Movie;
