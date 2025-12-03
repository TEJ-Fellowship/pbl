require("dotenv").config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Local PostgreSQL configuration
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'facebook-server';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

// Construct DATABASE_URL for local PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT||6379;
const REDIS_TTL = parseInt(process.env.REDIS_TTL||60);
const REDIS_TTL_DEFAULT = parseInt(process.env.REDIS_TTL_DEFAULT||600);


module.exports = {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_TTL,
    REDIS_TTL_DEFAULT
}