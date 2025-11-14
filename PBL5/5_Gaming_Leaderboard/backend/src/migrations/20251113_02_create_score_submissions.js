const { DataTypes } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("score_submissions", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      player_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "players",
          key: "id",
        },
      },
      game_mode_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "game_modes",
          key: "id",
        },
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      game_duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    // Add index on player_id and submitted_at (DESC)
    await queryInterface.addIndex("score_submissions", ["player_id", "submitted_at"], {
      name: "idx_player_scores",
      order: [null, "DESC"],
    });
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("score_submissions");
  },
};