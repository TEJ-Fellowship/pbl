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
  hooks: {
    // After a like is created, increment likes_count on the post
    afterCreate: async (like, options) => {
      const Post = require('./Post');
      await Post.increment('likes_count', {
        where: { id: like.post_id },
        transaction: options.transaction
      });
    },
    // After a like is deleted, decrement likes_count on the post
    afterDestroy: async (like, options) => {
      const Post = require('./Post');
      await Post.decrement('likes_count', {
        where: { id: like.post_id },
        transaction: options.transaction
      });
    }
  }
});

module.exports = Like;

