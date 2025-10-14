import pkg from "pg";
const { Pool } = pkg;
import config from "./config.js";

const pool = new Pool({
  user: config.DB_USER || "postgres",
  host: config.DB_HOST || "localhost",
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("----------Connected to PostgreSQL database-------\n");
});

pool.on("error", (err) => {
  console.error("-------PostgreSQL connection error:", err);
});

export default pool;
