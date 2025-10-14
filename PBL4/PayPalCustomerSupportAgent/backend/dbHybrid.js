const { Pool } = require("pg");
require("dotenv").config();

let pool;

async function getPool() {
  if (pool) return pool;

  try {
    pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'paypalAgent',
      password: process.env.POSTGRES_PASSWORD || 'your_password_here',
      port: 5432,
    });
    console.log("PostgreSQL connected");
    return pool;
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
    return null;
  }
}

async function logConversation(entry) {
  try {
    const client = await getPool();
    if (!client) return;

    await client.query(
      `INSERT INTO conversations (session_id, query, issue_type, sentiment, top_citations, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        entry.sessionId,
        entry.query,
        entry.issueType,
        JSON.stringify(entry.sentiment),
        JSON.stringify(entry.topCitations)
      ]
    );

    console.log("Conversation logged to PostgreSQL");
  } catch (err) {
    console.error("Failed to log conversation:", err.message);
  }
}

module.exports = { getPool, logConversation };