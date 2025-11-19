const { Sequelize } = require('sequelize');
const { DATABASE_URL, NODE_ENV } = require('../utils/config');
require('dotenv').config();

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: DATABASE_URL && DATABASE_URL.includes('render.com') ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

module.exports = sequelize;