const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3001,
  // Redis configuration
  REDIS_USERNAME: process.env.REDIS_USERNAME || "default",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6380, // Default to 6380 (Docker port)
  // Kafka configuration
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "movie-booking-service",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "booking-processor-group",
  // Kafka Topics
  KAFKA_TOPIC_BOOKINGS: process.env.KAFKA_TOPIC_BOOKINGS || "booking-requests",
  KAFKA_TOPIC_PAYMENT_INTENTS:
    process.env.KAFKA_TOPIC_PAYMENT_INTENTS || "payment-intent-requests",
  // Kafka Mode: 'direct' (process immediately) or 'kafka' (queue via Kafka)
  KAFKA_MODE: process.env.KAFKA_MODE || "direct",
  // Kafka scaling configuration
  KAFKA_PARTITIONS: process.env.KAFKA_PARTITIONS
    ? parseInt(process.env.KAFKA_PARTITIONS)
    : 30, // Increased from 20 to test partition scaling
  // Consumer instances per process
  // Single process setup: 16 consumers (practical limit for single Node.js process)
  // With 30 partitions: 16 consumers can process up to 16 partitions simultaneously
  // Can be increased via KAFKA_CONSUMER_INSTANCES env var if needed
  KAFKA_CONSUMER_INSTANCES: process.env.KAFKA_CONSUMER_INSTANCES
    ? parseInt(process.env.KAFKA_CONSUMER_INSTANCES)
    : 16, // Practical limit for single process (can handle ~16 partitions in parallel)
  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_API_VERSION: process.env.STRIPE_API_VERSION || "2024-11-20.acacia",
};
