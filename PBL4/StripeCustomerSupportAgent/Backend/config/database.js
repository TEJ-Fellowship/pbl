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
  // Render PostgreSQL always requires SSL
  const requiresSSL =
    config.DATABASE_URL.includes("onrender.com") ||
    config.DATABASE_URL.includes("render.com") ||
    isProduction;

  poolConfig = {
    connectionString: config.DATABASE_URL,
    // SSL is required for Render PostgreSQL and production environments
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log(
    `📦 Using DATABASE_URL connection string${
      requiresSSL ? " (SSL enabled)" : ""
    }`
  );
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

// Create the pool
const pool = new Pool(poolConfig);

// Test connection event handlers
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
  // Don't exit in production, let the app handle retries
  if (!isProduction) {
    console.error("⚠️ Exiting due to database connection error in development");
    process.exit(-1);
  }
});

// Graceful shutdown handlers
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("🛑 Closing database pool...");
  try {
    await pool.end();
    console.log("✅ Database pool closed gracefully");
  } catch (error) {
    console.error("❌ Error closing database pool:", error.message);
  }
}

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received");
  await gracefulShutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received");
  await gracefulShutdown();
  process.exit(0);
});

export default pool;
