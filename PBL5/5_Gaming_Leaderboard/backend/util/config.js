require("dotenv").config();

module.exports = {
  // Use localhost when running from host machine, kafka:9092 when inside Docker
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "gaming-leaderboard-backend",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  PORT: parseInt(process.env.PORT || "3001")
};