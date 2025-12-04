require("dotenv").config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT||6379;
const REDIS_TTL = parseInt(process.env.REDIS_TTL||60);
const REDIS_TTL_DEFAULT = parseInt(process.env.REDIS_TTL_DEFAULT||600);

const KAFKA_BROKERS = process.env.KAFKA_BROKERS 
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID 


module.exports = {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_TTL,
    REDIS_TTL_DEFAULT,
    KAFKA_BROKERS,
    KAFKA_CLIENT_ID
}