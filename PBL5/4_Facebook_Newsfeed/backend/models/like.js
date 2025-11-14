const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  post_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'posts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['post_id'],
      name: 'idx_likes_post',
    },
    {
      fields: ['user_id'],
      name: 'idx_likes_user',
    },
  ],
});

module.exports = Like;

