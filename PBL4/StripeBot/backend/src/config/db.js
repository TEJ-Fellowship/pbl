import pg from "pg";
import pgvector from "pgvector/pg";
import "dotenv/config";

const { Pool } = pg;

const ssl = { rejectUnauthorized: false };

const pool = process.env.DATABASE_URL
  ? new Pool({
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
