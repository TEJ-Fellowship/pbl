const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

module.exports = sequelize;