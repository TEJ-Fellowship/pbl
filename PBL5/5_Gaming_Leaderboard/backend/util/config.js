require("dotenv").config();

module.exports = {
  // Use localhost when running from host machine, kafka:9092 when inside Docker
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || "localhost:9092",
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "gaming-leaderboard-backend",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  PORT: parseInt(process.env.PORT || "3001"),
  // CDN Configuration
  CDN_CACHE_TTL: parseInt(process.env.CDN_CACHE_TTL || "5"), // Cache TTL in seconds
  CDN_INVALIDATION_URL: process.env.CDN_INVALIDATION_URL || "", // CDN purge API URL
  CDN_API_KEY: process.env.CDN_API_KEY || "", // CDN API key for invalidation
  CDN_PROVIDER: process.env.CDN_PROVIDER || "cloudflare", // cloudflare, cloudfront, fastly, etc.
};
