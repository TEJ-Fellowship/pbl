import { DataTypes } from "sequelize";

export default {
  up: async ({ context: queryInterface }) => {
    // Create groups table
    await queryInterface.createTable("groups", {
      group_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      group_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      group_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    });

    // Create group_members table
    await queryInterface.createTable("group_members", {
      group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups",
          key: "group_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        primaryKey: true,
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
      role: {
        type: DataTypes.ENUM("admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Update conversations table to support groups
    await queryInterface.addColumn("conversations", "conversation_type", {
      type: DataTypes.ENUM("direct", "group"),
      allowNull: false,
      defaultValue: "direct",
    });

    await queryInterface.addColumn("conversations", "group_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "groups",
        key: "group_id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // Add indexes
    await queryInterface.addIndex("groups", ["created_by"]);
    await queryInterface.addIndex("group_members", ["group_id"]);
    await queryInterface.addIndex("group_members", ["user_id"]);
    await queryInterface.addIndex("conversations", ["group_id"]);
    await queryInterface.addIndex("conversations", ["conversation_type"]);
  }, 
  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn("conversations", "group_id");
    await queryInterface.removeColumn("conversations", "conversation_type");
    await queryInterface.dropTable("group_members");
    await queryInterface.dropTable("groups");
  },
};