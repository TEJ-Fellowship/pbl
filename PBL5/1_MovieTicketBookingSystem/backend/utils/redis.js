const { createClient } = require("redis");
const {
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = require("./config");

// Create Redis client with credentials from .env
const client = createClient({
  username: REDIS_USERNAME || "default",
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

// Handle connection events
client.on("connect", () => {
  console.log("✅ Redis connecting...");
});

client.on("ready", () => {
  console.log("✅ Redis ready");
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err.message);
});

// Connect to Redis (async, but we export client immediately)
// Connection will happen when client is first used
client.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err.message);
});

module.exports = client;
