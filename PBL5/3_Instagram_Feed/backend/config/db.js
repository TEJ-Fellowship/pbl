import { Sequelize } from "sequelize";
import cassandra from "cassandra-driver";
import dotenv from "dotenv";

dotenv.config();

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
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const { Client } = cassandra;

const username = process.env.ASTRA_DB_USERNAME;
const password = process.env.ASTRA_CLIENT_SECRET;
const secureConnectBundle = process.env.ASTRA_SECURE_CONNECT_BUNDLE;

const cassandraClient = new Client({
  cloud: {
    secureConnectBundle: secureConnectBundle,
  },
  credentials: {
    username: username,
    password: password,
  },
});

const initializeCassandra = async () => {
  try {
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
    console.log("✅ Connected to Cassandra/AstraDB successfully.");

    try {
      const rs = await cassandraClient.execute(
        "SELECT release_version FROM system.local"
      );
      console.log("📊 Cassandra release version:", rs.rows[0].release_version);
    } catch (queryError) {
      console.warn(
        "⚠️ Could not query system.local (this is usually fine):",
        queryError.message
      );
    }

    return cassandraClient;
  } catch (error) {
    console.error("❌ Unable to connect to Cassandra:", error);
    throw error;
  }
};

const closeCassandra = async () => {
  try {
    await cassandraClient.shutdown();
    console.log("✓ Cassandra connection closed");
  } catch (error) {
    console.error("Error closing Cassandra:", error);
  }
};

export { sequelize, cassandraClient, initializeCassandra, closeCassandra };
