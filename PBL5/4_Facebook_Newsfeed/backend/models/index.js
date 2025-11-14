const sequelize = require('../config/database');
const User = require('./user');
const Post = require('./post');

// Initialize models
const models = {
  User,
  Post,
  sequelize,
};

module.exports = models;