const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../util/db");

class Player extends Model {}

Player.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_score: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
    },
    games_played: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "player",
    tableName: "players",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Player;