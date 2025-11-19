const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['post_id', 'created_at'],
      name: 'idx_comments_post',
    },
    {
      fields: ['user_id'],
      name: 'idx_comments_user',
    },
  ],
  hooks: {
    // After a comment is created, increment comments_count on the post
    afterCreate: async (comment, options) => {
      const Post = require('./Post');
      await Post.increment('comments_count', {
        where: { id: comment.post_id },
        transaction: options.transaction
      });
    },
    // After a comment is deleted, decrement comments_count on the post
    afterDestroy: async (comment, options) => {
      const Post = require('./Post');
      await Post.decrement('comments_count', {
        where: { id: comment.post_id },
        transaction: options.transaction
      });
    }
  }
});

module.exports = Comment;

