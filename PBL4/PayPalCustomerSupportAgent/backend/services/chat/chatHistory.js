const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "paypalAgent",
  password: process.env.POSTGRES_PASSWORD || "your_password_here",
  port: 5433,
});

/**
 * Save chat message to database
 */
async function saveChatMessage(sessionId, role, content, metadata = {}) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO chat_history (session_id, role, content, metadata, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, role, content, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error("Error saving chat message:", error);
  } finally {
    client.release();
  }
}

/**
 * Get chat history for a session
 */
async function getChatHistory(sessionId, limit = 10) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT role, content, metadata, created_at 
       FROM chat_history 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [sessionId, limit]
    );
    return result.rows.reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error("Error getting chat history:", error);
    return [];
  } finally {
    client.release();
  }
}

module.exports = { saveChatMessage, getChatHistory, pool };
