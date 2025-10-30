import pkg from "pg";
const { Pool } = pkg;
import config from "./config.js";

const pool = new Pool({
  user: config.DB_USER || "postgres",
  host: config.DB_HOST || "localhost",
  database: config.DB_NAME || "twilio_support_db",
  password: config.DB_PASSWORD,
  port: config.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

export default pool;