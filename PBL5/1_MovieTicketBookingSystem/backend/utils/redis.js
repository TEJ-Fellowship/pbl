const { createClient } = require("redis");
const {
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = require("./config");

// Create Redis client with connection pooling and performance tuning
// Only use authentication if password is provided (for cloud Redis)
// For local Redis (Docker), no auth is needed
const clientConfig = {
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    // Connection pool settings
    keepAlive: 30000, // Keep connection alive for 30 seconds (reuse connections)
    reconnectStrategy: (retries) => {
      // Reconnection strategy: exponential backoff
      // Retry up to 10 times with increasing delays
      if (retries > 10) {
        console.error("❌ Redis: Max reconnection attempts reached");
        return new Error("Max reconnection attempts reached");
      }
      // Wait: 50ms, 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms, etc.
      const delay = Math.min(50 * Math.pow(2, retries), 3000);
      console.log(
        `🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries + 1})`
      );
      return delay;
    },
    connectTimeout: 10000, // 10 seconds timeout for initial connection
  },
  // Performance tuning
  pingInterval: 30000, // Ping Redis every 30 seconds to keep connection alive
};

// Only add authentication if password is provided (cloud Redis)
if (REDIS_PASSWORD) {
  clientConfig.username = REDIS_USERNAME || "default";
  clientConfig.password = REDIS_PASSWORD;
}

const client = createClient(clientConfig);

// Handle connection events with better monitoring
client.on("connect", () => {
  console.log("✅ Redis connecting...");
});

client.on("ready", () => {
  console.log("✅ Redis ready (connection pool active)");
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message);
});

client.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

client.on("end", () => {
  console.log("⚠️  Redis connection ended");
});

// Connect to Redis (async, but we export client immediately)
// Connection will happen when client is first used
client.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err.message);
});

module.exports = client;
