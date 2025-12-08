const { Sequelize } = require('sequelize');
const { DATABASE_URL, NODE_ENV } = require('../utils/config');
require('dotenv').config();

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 100,             // Maximum 100 connections
        min: 2,              // Minimum 2 connections (keep warm)
        acquire: 100000,      // Max time to wait for connection (100 seconds)
        idle: 100000,         // Close idle connections after 100 seconds
        evict: 1000          // Check for idle connections every 1 second
    }
});

module.exports = sequelize;