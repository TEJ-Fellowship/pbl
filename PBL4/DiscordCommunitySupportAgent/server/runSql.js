import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load env
dotenv.config({ override: true });

function getPool() {
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT) || 5432;
  const database = process.env.POSTGRES_DB || 'discord_analytics';
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'password';
  const enableSSL = (
    (process.env.POSTGRES_SSL || '').toString().toLowerCase() === 'true' ||
    /\.neon\.tech$/i.test(host)
  );

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: enableSSL ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    keepAlive: true
  });
}

async function main() {
  const sql = process.argv.slice(2).join(' ').trim();
  if (!sql) {
    console.error('Usage: node runSql.js "<SQL query>"');
    console.error('Example: node runSql.js "SELECT NOW();"');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    const res = await client.query(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('SQL error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
