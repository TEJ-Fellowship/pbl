import pkg from "pg";
const { Pool } = pkg;
import config from "./config.js";

// Determine if we're in production (Render sets NODE_ENV or provides DATABASE_URL)
const isProduction =
  process.env.NODE_ENV === "production" || !!process.env.DATABASE_URL;

// Create pool configuration
let poolConfig;

if (config.DATABASE_URL) {
  // Use DATABASE_URL (Render/production) - preferred method
  poolConfig = {
    connectionString: config.DATABASE_URL,
    // SSL is required for Render PostgreSQL
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log("📦 Using DATABASE_URL connection string");
} else {
  // Use individual variables (local development) - fallback method
  poolConfig = {
    user: config.DB_USER || "postgres",
    host: config.DB_HOST || "localhost",
    database: config.DB_NAME || "stripe_support_db",
    password: config.DB_PASSWORD,
    port: config.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // No SSL for local development
    ssl: false,
  };
  console.log(
    `📦 Using individual DB config: ${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`
  );
}

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
  if (!isProduction) {
    process.exit(-1);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, closing database pool...");
  await pool.end();
  console.log("✅ Database pool closed");
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, closing database pool...");
  await pool.end();
  console.log("✅ Database pool closed");
  process.exit(0);
});

export default pool;
