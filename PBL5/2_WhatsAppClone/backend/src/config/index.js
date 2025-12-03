// Loads env & config
import dotenv from "dotenv";
dotenv.config();

// Export all configs
export const DATABASE_URL = process.env.DATABASE_URL;
export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const REDIS_HOST = process.env.REDIS_HOST;

// Astra DB Configuration
export const ASTRA_CLIENT_ID = process.env.ASTRA_CLIENT_ID;
export const ASTRA_SECRET = process.env.ASTRA_SECRET;
export const ASTRA_TOKEN = process.env.ASTRA_TOKEN;
export const ASTRA_KEYSPACE = process.env.ASTRA_KEYSPACE;
export const ASTRA_SECURE_CONNECT_BUNDLE = process.env.ASTRA_SECURE_CONNECT_BUNDLE;
