// Loads env & config
import dotenv from "dotenv";
dotenv.config();

// Export all configs
export const DATABASE_URL = process.env.DATABASE_URL;
export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const REDIS_HOST = process.env.REDIS_HOST;
