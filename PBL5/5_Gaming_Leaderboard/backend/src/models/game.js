const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../util/db");

class GameMode extends Model {}

GameMode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    max_score_per_game: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    avg_game_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "gameMode",
    tableName: "game_modes",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = GameMode;