require("dotenv").config();

module.exports = {
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "kafka-1:9092,kafka-2:9092,kafka-3:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "gaming-leaderboard-backend",
  REDIS_HOST: process.env.REDIS_HOST || "redis",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  PORT: parseInt(process.env.PORT || "3001")
};