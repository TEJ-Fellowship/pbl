require("dotenv").config();

module.exports = {
  // Database URLs
  DATABASE_URL1: process.env.DATABASE_URL1, // Primary (write)
  DATABASE_URL2: process.env.DATABASE_URL2, // Replica 1 (read)
  DATABASE_URL3: process.env.DATABASE_URL3, // Replica 2 (read)
  
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  // Security
  SECRET: process.env.SECRET || "my-secret",
};
