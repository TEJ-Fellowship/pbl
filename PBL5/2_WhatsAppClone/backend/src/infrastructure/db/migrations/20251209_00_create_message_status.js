import { DataTypes } from "sequelize";

export default {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable("message_status", {
      message_id: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "conversations",
          key: "conversation_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
      },
      status: {
        type: DataTypes.ENUM("sent", "delivered", "read"),
        allowNull: false,
        defaultValue: "sent",
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex("message_status", ["conversation_id"]);
    await queryInterface.addIndex("message_status", ["user_id"]);
    await queryInterface.addIndex("message_status", ["status"]);
    await queryInterface.addIndex("message_status", ["updated_at"]);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable("message_status");
  },
};