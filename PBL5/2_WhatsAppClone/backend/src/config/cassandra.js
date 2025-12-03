// Cassandra database configuration for DataStax Astra DB

import cassandra from "cassandra-driver";
import dotenv from "dotenv";
import { join } from "path";

dotenv.config();

// Astra DB Configuration
const ASTRA_CLIENT_ID = process.env.ASTRA_CLIENT_ID;
const ASTRA_SECRET = process.env.ASTRA_SECRET;
const ASTRA_TOKEN = process.env.ASTRA_TOKEN;
const ASTRA_KEYSPACE = process.env.ASTRA_KEYSPACE || "chatapp";
const ASTRA_SECURE_CONNECT_BUNDLE = process.env.ASTRA_SECURE_CONNECT_BUNDLE;

// Check if using Astra DB or local Cassandra
const useAstraDB = ASTRA_CLIENT_ID && ASTRA_SECRET;

let client;

if (useAstraDB) {
  // DataStax Astra DB Cloud Configuration
  if (!ASTRA_SECURE_CONNECT_BUNDLE) {
    throw new Error(
      "ASTRA_SECURE_CONNECT_BUNDLE environment variable is required for Astra DB connection. " +
      "Please download the secure connect bundle from your Astra DB dashboard and set the path."
    );
  }

  // Resolve bundle path (can be absolute or relative to project root)
  const bundlePath = ASTRA_SECURE_CONNECT_BUNDLE.startsWith("/")
    ? ASTRA_SECURE_CONNECT_BUNDLE
    : join(process.cwd(), ASTRA_SECURE_CONNECT_BUNDLE);

  console.log("Connecting to DataStax Astra DB...");
  console.log(`Using secure connect bundle: ${bundlePath}`);
  console.log(`Keyspace: ${ASTRA_KEYSPACE}`);

  client = new cassandra.Client({
    cloud: {
      secureConnectBundle: bundlePath,
    },
    credentials: {
      username: ASTRA_CLIENT_ID,
      password: ASTRA_SECRET,
    },
    keyspace: ASTRA_KEYSPACE,
  });
} else {
  // Fallback to local Cassandra (for development)
  console.log("Connecting to local Cassandra...");
  client = new cassandra.Client({
    contactPoints: ["127.0.0.1"],
    localDataCenter: "datacenter1",
    keyspace: ASTRA_KEYSPACE || "chatapp",
  });
}

// Handle connection events
client.on("log", (level, loggerName, message, furtherInfo) => {
  if (level === "error") {
    console.error(`Cassandra [${loggerName}]:`, message, furtherInfo);
  }
});

// Test connection
client
  .connect()
  .then(() => {
    console.log("✅ Successfully connected to Cassandra/Astra DB");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to Cassandra/Astra DB:", err.message);
    if (useAstraDB) {
      console.error(
        "\nTroubleshooting tips:",
        "\n1. Ensure ASTRA_SECURE_CONNECT_BUNDLE path is correct",
        "\n2. Verify ASTRA_CLIENT_ID and ASTRA_SECRET are correct",
        "\n3. Check that the secure connect bundle file exists",
        "\n4. Verify your Astra DB database is running and accessible"
      );
    }
  });

export default client;
