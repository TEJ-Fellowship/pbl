/**
 * Database configuration
 * pg: PostgreSQL client library
 * pgvector: PostgreSQL vector extension library
 */
import pg from "pg";
import pgvector from "pgvector/pg";
import "dotenv/config";

/** Pool: PostgreSQL connection pool
 * open connections to the database
 */
const { Pool } = pg;

/** ssl: SSL configuration tells the Postgres client to use TLS-encrypted connections to connect to the database
 * rejectUnauthorized: false to allow self-signed certificates
 */
const ssl = { rejectUnauthorized: false };

const pool = process.env.DATABASE_URL
  ? /** if DATABASE_URL is set, use it to connect to the database */
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl,
    });

// Register vector type so pg knows how to read/write vector columns
pool.on("connect", async (client) => {
  await pgvector.registerType(client);
});

export default pool;
