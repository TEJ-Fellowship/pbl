import { Sequelize } from "sequelize";
import cassandra from "cassandra-driver";
import { createClient } from "redis";
import dotenv from "dotenv";
import { DB_CONFIG } from "./constants.js";

dotenv.config({ quiet: true });

const sequelize = new Sequelize(
  process.env.DB_NAME || "demo",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "0987",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: DB_CONFIG.POSTGRES.POOL_MAX,
      min: DB_CONFIG.POSTGRES.POOL_MIN,
      acquire: DB_CONFIG.POSTGRES.POOL_ACQUIRE,
      idle: DB_CONFIG.POSTGRES.POOL_IDLE,
    },
  }
);

const { Client } = cassandra;

const username = process.env.ASTRA_DB_USERNAME;
const password = process.env.ASTRA_CLIENT_SECRET;
const secureConnectBundle = process.env.ASTRA_SECURE_CONNECT_BUNDLE;

// Only create Cassandra client if all required environment variables are present and valid
let cassandraClient = null;

if (
  username &&
  password &&
  secureConnectBundle &&
  typeof secureConnectBundle === "string"
) {
  try {
    cassandraClient = new Client({
      cloud: {
        secureConnectBundle: secureConnectBundle,
      },
      credentials: {
        username: username,
        password: password,
      },
      // Connection pooling configuration
      pooling: {
        coreConnectionsPerHost: {
          [cassandra.types.distance.local]: DB_CONFIG.CASSANDRA.POOL_SIZE,
          [cassandra.types.distance.remote]: 1,
        },
        maxRequestsPerConnection:
          DB_CONFIG.CASSANDRA.MAX_REQUESTS_PER_CONNECTION,
      },
    });
  } catch (error) {
    console.warn("⚠️ Could not initialize Cassandra client:", error.message);
    cassandraClient = null;
  }
}

const initializeCassandra = async () => {
  try {
    if (!cassandraClient) {
      throw new Error(
        "Cassandra client is not initialized. Please check your ASTRA_DB_USERNAME, ASTRA_CLIENT_SECRET, and ASTRA_SECURE_CONNECT_BUNDLE environment variables."
      );
    }

    if (!username || typeof username !== "string") {
      throw new Error(
        "ASTRA_DB_USERNAME environment variable is not set or is not a string. Please check your .env file."
      );
    }

    if (!password || typeof password !== "string") {
      throw new Error(
        "ASTRA_CLIENT_SECRET environment variable is not set or is not a string. Please check your .env file."
      );
    }

    if (!secureConnectBundle) {
      throw new Error(
        "ASTRA_SECURE_CONNECT_BUNDLE environment variable is not set. Please check your .env file."
      );
    }

    await cassandraClient.connect();
    console.log("✅ Connected to Cassandra/AstraDB");

    return cassandraClient;
  } catch (error) {
    console.error("❌ Unable to connect to Cassandra:", error);
    throw error;
  }
};

const closeCassandra = async () => {
  try {
    if (cassandraClient) {
      await cassandraClient.shutdown();
    }
  } catch (error) {
    console.error("Error closing Cassandra:", error);
  }
};

// Redis Client Setup
const redisClient = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > DB_CONFIG.REDIS.MAX_RETRIES) {
        return new Error("Max Redis reconnection retries exceeded");
      }
      return DB_CONFIG.REDIS.RETRY_DELAY * retries;
    },
  },
});

// Redis connection event handlers
redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

// Redis event handlers - silent for cleaner logs
redisClient.on("reconnecting", () => {
  // Silent reconnection
});

const initializeRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
    return redisClient;
  } catch (error) {
    console.error("❌ Unable to connect to Redis:", error);
    throw error;
  }
};

const closeRedis = async () => {
  try {
    await redisClient.quit();
  } catch (error) {
    console.error("Error closing Redis:", error);
  }
};

export {
  sequelize,
  cassandraClient,
  initializeCassandra,
  closeCassandra,
  redisClient,
  initializeRedis,
  closeRedis,
};
