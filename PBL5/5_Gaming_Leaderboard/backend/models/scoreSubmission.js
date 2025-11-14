const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../src/util/db");

class ScoreSubmission extends Model {}

ScoreSubmission.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    playerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "player_id",
      references: {
        model: "players",
        key: "id",
      },
    },
    gameModeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "game_mode_id",
      references: {
        model: "game_modes",
        key: "id",
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameDurationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "game_duration_seconds",
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "submitted_at",
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: "is_valid",
    },
  },
  {
    sequelize,
    modelName: "scoreSubmission",
    tableName: "score_submissions",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ScoreSubmission;