import { DataTypes } from 'sequelize';

export default {
    up: async ({ context: queryInterface }) => {
        await queryInterface.createTable('conversations', {
            conversation_id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            user1_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user2_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'user_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
                    model: 'users',
                    key: 'user_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            user1_last_read_message_id: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            user2_last_read_message_id: {
                type: DataTypes.TEXT,
                allowNull: true,
            }
        });

        // Add indexes for better query performance
        await queryInterface.addIndex('conversations', ['user1_id']);
        await queryInterface.addIndex('conversations', ['user2_id']);
        await queryInterface.addIndex('conversations', ['last_message_time']);
    },
    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('conversations');
    }
};

