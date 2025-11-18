// PostgreSQL repository implementation
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../config/postgres.js";

class User extends Model {}
class Conversation extends Model {}

User.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "users",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    modelName: "user",
  }
);

Conversation.init(
  {
    conversation_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    user2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_message_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_message_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_message_sender_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    user1_last_read_message_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user2_last_read_message_id: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "conversations",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    modelName: "conversation",
  }
);

// Define associations
User.hasMany(Conversation, {
  foreignKey: "user1_id",
  as: "conversationsAsUser1",
});
User.hasMany(Conversation, {
  foreignKey: "user2_id",
  as: "conversationsAsUser2",
});
User.hasMany(Conversation, {
  foreignKey: "last_message_sender_id",
  as: "sentMessages",
});
Conversation.belongsTo(User, { foreignKey: "user1_id", as: "user1" });
Conversation.belongsTo(User, { foreignKey: "user2_id", as: "user2" });
Conversation.belongsTo(User, {
  foreignKey: "last_message_sender_id",
  as: "lastMessageSender",
});

export { User, Conversation };
