const { DataTypes } = require("sequelize");

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("players", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      username: {
        type: DataTypes.TEXT,
        unique: true,
      },
      email: {
        type: DataTypes.TEXT,
      },
      level: {
        type: DataTypes.INTEGER,
      },
      total_score: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      games_played: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("players");
  },
};