import cassandra from "cassandra-driver";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the parent directory (backend/)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { Client } = cassandra;

async function run() {
  // Validate environment variables
  const username = process.env.ASTRA_DB_USERNAME;
  const password = process.env.ASTRA_CLIENT_SECRET;
  const secureConnectBundle = process.env.ASTRA_SECURE_CONNECT_BUNDLE;

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

  const client = new Client({
    cloud: {
      secureConnectBundle: secureConnectBundle,
      // your path here
    },
    credentials: {
      username: username,
      password: password,
    },
  });

  try {
    await client.connect();
    console.log("Connected to Astra DB successfully!");

    // Example query: check cluster
    const rs = await client.execute("SELECT release_version FROM system.local");
    console.log("Cassandra release version:", rs.rows[0].release_version);

    // Query your posts table
    const posts = await client.execute(
      "SELECT * FROM instagram.posts LIMIT 10"
    );
    console.log("Posts:", posts.rows);
  } catch (err) {
    console.error("Error connecting/querying:", err);
  } finally {
    await client.shutdown();
  }
}

run();
