import pool from "../../config/postgresconfig.js";

class ConversationMemoryService {
  constructor(bufferSize = 8) {
    this.pool = pool;
    this.bufferSize = bufferSize;
  }

  async createSession(userId = "anonymous") {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO conversation_sessions (user_id) VALUES ($1) RETURNING id`,
        [userId]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async createSessionWithId(sessionId, userId = "anonymous") {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO conversation_sessions (id, user_id) VALUES ($1, $2)`,
        [sessionId, userId]
      );
      return sessionId;
    } finally {
      client.release();
    }
  }

  async addMessage(sessionId, role, content, metadata = null) {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO conversation_messages (session_id, role, content, metadata)
         VALUES ($1, $2, $3, $4)`,
        [sessionId, role, content, metadata ? JSON.stringify(metadata) : null]
      );
      // Touch session updated_at
      await client.query(
        `UPDATE conversation_sessions SET updated_at = NOW() WHERE id = $1`,
        [sessionId]
      );
    } finally {
      client.release();
    }
  }

  async getLatestSessionId(userId = "anonymous") {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id FROM conversation_sessions
         WHERE user_id = $1
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId]
      );
      return result.rows[0]?.id || null;
    } finally {
      client.release();
    }
  }

  async getRecentMessages(sessionId, limit = this.bufferSize) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT role, content, created_at
         FROM conversation_messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [sessionId, limit]
      );
      // Return chronological order (oldest first)
      return result.rows.reverse();
    } finally {
      client.release();
    }
  }

  async recallRelevant(sessionId, query, topK = 5) {
    const client = await this.pool.connect();
    try {
      // BM25-like recall using PostgreSQL full-text search
      const result = await client.query(
        `SELECT id, role, content, created_at,
                ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) AS score
         FROM conversation_messages
         WHERE session_id = $1
           AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
         ORDER BY score DESC, created_at DESC
         LIMIT $3`,
        [sessionId, query, topK]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async sessionExists(sessionId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT EXISTS(SELECT 1 FROM conversation_sessions WHERE id = $1) AS exists`,
        [sessionId]
      );
      return result.rows[0].exists;
    } finally {
      client.release();
    }
  }

  async getSessionStats(sessionId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*)::int AS messages
         FROM conversation_messages
         WHERE session_id = $1`,
        [sessionId]
      );
      return { messages: result.rows[0].messages };
    } finally {
      client.release();
    }
  }
}

export default ConversationMemoryService;
