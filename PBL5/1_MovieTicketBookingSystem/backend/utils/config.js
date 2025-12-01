require("dotenv").config();

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3001,
  // Redis configuration
  REDIS_USERNAME: process.env.REDIS_USERNAME || "default",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  // Kafka configuration
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "movie-booking-service",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "booking-processor-group",
  // Kafka Topics
  KAFKA_TOPIC_BOOKINGS: process.env.KAFKA_TOPIC_BOOKINGS || "booking-requests",
  // Kafka Mode: 'direct' (process immediately) or 'kafka' (queue via Kafka)
  KAFKA_MODE: process.env.KAFKA_MODE || "direct",
  // Kafka scaling configuration
  KAFKA_PARTITIONS: process.env.KAFKA_PARTITIONS
    ? parseInt(process.env.KAFKA_PARTITIONS)
    : 20,
  // Consumer instances per PM2 worker (not total)
  // With 4 PM2 workers and 20 partitions: 5 consumers per worker = 20 total consumers
  KAFKA_CONSUMER_INSTANCES: process.env.KAFKA_CONSUMER_INSTANCES
    ? parseInt(process.env.KAFKA_CONSUMER_INSTANCES)
    : 5, // 5 per worker × 4 workers = 20 total (matches 20 partitions)
};
