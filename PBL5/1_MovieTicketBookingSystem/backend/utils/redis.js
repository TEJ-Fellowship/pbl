const { createClient } = require("redis");
const {
  REDIS_USERNAME,
  REDIS_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
} = require("./config");

// Create Redis client
// Only use authentication if password is provided (for cloud Redis)
// For local Redis (Docker), no auth is needed
const clientConfig = {
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
};

// Only add authentication if password is provided (cloud Redis)
if (REDIS_PASSWORD) {
  clientConfig.username = REDIS_USERNAME || "default";
  clientConfig.password = REDIS_PASSWORD;
}

const client = createClient(clientConfig);

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
