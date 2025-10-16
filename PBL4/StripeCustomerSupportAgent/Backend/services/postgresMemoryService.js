import pool from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * PostgreSQL Memory Service
 * Handles long-term conversation memory persistence and retrieval
 * Implements conversation history, Q&A pairs, and semantic search
 */
class PostgreSQLMemoryService {
  constructor() {
    this.pool = pool;
  }

  /**
   * Create or get existing conversation session
   */
  async createOrGetSession(sessionId, userId = null, metadata = {}) {
    const client = await this.pool.connect();

    try {
      // Check if session exists
      const existingSession = await client.query(
        "SELECT * FROM conversation_sessions WHERE session_id = $1",
        [sessionId]
      );

      if (existingSession.rows.length > 0) {
        // Update last activity
        await client.query(
          "UPDATE conversation_sessions SET updated_at = NOW() WHERE session_id = $1",
          [sessionId]
        );
        return existingSession.rows[0];
      }

      // Create new session
      const newSession = await client.query(
        `INSERT INTO conversation_sessions (session_id, user_id, metadata) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [sessionId, userId, JSON.stringify(metadata)]
      );

      console.log(`🆕 Created new conversation session: ${sessionId}`);
      return newSession.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Store a conversation message
   */
  async storeMessage(sessionId, role, content, metadata = {}) {
    const client = await this.pool.connect();

    try {
      const messageId = uuidv4();

      // Calculate token count for the message
      let tokenCount;
      try {
        // Try to use the database function first
        const tokenResult = await client.query(
          `SELECT estimate_token_count($1) as token_count`,
          [content]
        );
        tokenCount = tokenResult.rows[0].token_count;
      } catch (error) {
        // Fallback to JavaScript-based token estimation if database function doesn't exist
        console.log(
          "⚠️ Database function estimate_token_count not found, using fallback method"
        );
        tokenCount = this.estimateTokenCount(content);
      }

      // Try to insert with token_count, fallback to without it if column doesn't exist
      let result;
      try {
        result = await client.query(
          `INSERT INTO conversation_messages (message_id, session_id, role, content, metadata, token_count)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            messageId,
            sessionId,
            role,
            content,
            JSON.stringify(metadata),
            tokenCount,
          ]
        );
      } catch (error) {
        if (error.message.includes("token_count")) {
          console.log(
            "⚠️ token_count column doesn't exist, inserting without it"
          );
          result = await client.query(
            `INSERT INTO conversation_messages (message_id, session_id, role, content, metadata)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [messageId, sessionId, role, content, JSON.stringify(metadata)]
          );
        } else {
          throw error;
        }
      }

      // Update session token usage
      try {
        await client.query(`SELECT update_session_token_usage($1)`, [
          sessionId,
        ]);
      } catch (error) {
        console.log(
          "⚠️ Database function update_session_token_usage not found, skipping token usage update"
        );
      }

      console.log(
        `💾 Stored ${role} message for session: ${sessionId} (${tokenCount} tokens)`
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Fallback token counting method
   * Rough estimation: 1 token ≈ 4 characters for English text
   */
  estimateTokenCount(text) {
    if (!text || typeof text !== "string") {
      return 1;
    }
    return Math.max(1, Math.ceil(text.length / 4.0));
  }

  /**
   * Get recent messages for a session (BufferWindowMemory simulation)
   */
  async getRecentMessages(sessionId, limit = 8) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT message_id, role, content, created_at, metadata
         FROM conversation_messages 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows.reverse(); // Return in chronological order
    } finally {
      client.release();
    }
  }

  /**
   * Store Q&A pair for long-term memory
   */
  async storeQAPair(
    sessionId,
    question,
    answer,
    context = "",
    relevanceScore = 0.5,
    isImportant = false,
    tags = []
  ) {
    const client = await this.pool.connect();

    try {
      const qaId = uuidv4();
      const result = await client.query(
        `INSERT INTO conversation_qa_pairs 
         (qa_id, session_id, question, answer, context, relevance_score, is_important, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          qaId,
          sessionId,
          question,
          answer,
          context,
          relevanceScore,
          isImportant,
          tags,
        ]
      );

      console.log(`🧠 Stored Q&A pair for long-term memory: ${qaId}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve relevant Q&A pairs for a query
   */
  async getRelevantQAPairs(query, sessionId = null, limit = 5) {
    const client = await this.pool.connect();

    try {
      let whereClause = `(
        to_tsvector('english', question) @@ plainto_tsquery('english', $1)
        OR to_tsvector('english', answer) @@ plainto_tsquery('english', $1)
        OR to_tsvector('english', context) @@ plainto_tsquery('english', $1)
      )`;

      let queryParams = [query];
      let paramIndex = 2;

      if (sessionId) {
        whereClause += ` AND session_id = $${paramIndex}`;
        queryParams.push(sessionId);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT qa_id, question, answer, context, relevance_score, session_id, created_at
         FROM conversation_qa_pairs 
         WHERE ${whereClause}
         ORDER BY 
           relevance_score DESC,
           ts_rank(to_tsvector('english', question), plainto_tsquery('english', $1)) DESC
         LIMIT $${paramIndex}`,
        [...queryParams, limit]
      );

      console.log(
        `🔍 Found ${result.rows.length} relevant Q&A pairs for query`
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Store conversation summary
   */
  async storeConversationSummary(sessionId, summaryText, keyTopics = []) {
    const client = await this.pool.connect();

    try {
      const summaryId = uuidv4();
      const result = await client.query(
        `INSERT INTO conversation_summaries (summary_id, session_id, summary_text, key_topics)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [summaryId, sessionId, summaryText, keyTopics]
      );

      console.log(`📝 Stored conversation summary for session: ${sessionId}`);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get conversation summary for a session
   */
  async getConversationSummary(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT summary_text, key_topics, created_at
         FROM conversation_summaries 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [sessionId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 50) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT message_id, role, content, created_at, metadata
         FROM conversation_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(query, userId = null, limit = 20) {
    const client = await this.pool.connect();

    try {
      let whereClause = `(
        to_tsvector('english', cm.content) @@ plainto_tsquery('english', $1)
      )`;

      let queryParams = [query];
      let paramIndex = 2;

      if (userId) {
        whereClause += ` AND cs.user_id = $${paramIndex}`;
        queryParams.push(userId);
        paramIndex++;
      }

      const result = await client.query(
        `SELECT DISTINCT 
           cs.session_id, 
           cs.user_id, 
           cs.created_at,
           cs.metadata,
           COUNT(cm.message_id) as message_count
         FROM conversation_sessions cs
         JOIN conversation_messages cm ON cs.session_id = cm.session_id
         WHERE ${whereClause}
         GROUP BY cs.session_id, cs.user_id, cs.created_at, cs.metadata
         ORDER BY cs.created_at DESC
         LIMIT $${paramIndex}`,
        [...queryParams, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a session and all its associated data
   */
  async deleteSession(sessionId) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN"); // Start transaction

      console.log(`🗑️ Deleting session: ${sessionId}`);

      // Delete in order to respect foreign key constraints
      const deleteOrder = [
        "memory_retrieval_cache",
        "conversation_summaries",
        "conversation_qa_pairs",
        "conversation_messages",
        "conversation_sessions",
      ];

      for (const table of deleteOrder) {
        const result = await client.query(
          `DELETE FROM ${table} WHERE session_id = $1`,
          [sessionId]
        );
        console.log(`   ✅ Deleted ${result.rowCount} rows from ${table}`);
      }

      await client.query("COMMIT"); // Commit transaction
      console.log(`✅ Session ${sessionId} deleted successfully`);

      return {
        sessionId,
        deleted: true,
        message: "Session and all associated data deleted successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback on error
      console.error("❌ Failed to delete session:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get session token usage information
   */
  async getSessionTokenUsage(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           session_id,
           total_tokens,
           max_tokens,
           token_usage_percentage,
           created_at,
           updated_at
         FROM conversation_sessions 
         WHERE session_id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Update session token limit
   */
  async updateSessionTokenLimit(sessionId, maxTokens) {
    const client = await this.pool.connect();

    try {
      await client.query(
        `UPDATE conversation_sessions 
         SET max_tokens = $2, updated_at = NOW()
         WHERE session_id = $1`,
        [sessionId, maxTokens]
      );

      // Recalculate token usage with new limit
      try {
        await client.query(`SELECT update_session_token_usage($1)`, [
          sessionId,
        ]);
      } catch (error) {
        console.log(
          "⚠️ Database function update_session_token_usage not found, skipping token usage update"
        );
      }

      console.log(
        `📊 Updated token limit for session ${sessionId}: ${maxTokens}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get sessions approaching token limit
   */
  async getSessionsNearTokenLimit(threshold = 80) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM get_sessions_near_token_limit($1)`,
        [threshold]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           COUNT(cm.message_id) as total_messages,
           COUNT(CASE WHEN cm.role = 'user' THEN 1 END) as user_messages,
           COUNT(CASE WHEN cm.role = 'assistant' THEN 1 END) as assistant_messages,
           COUNT(qa.qa_id) as qa_pairs,
           COUNT(s.summary_id) as summaries
         FROM conversation_sessions cs
         LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
         LEFT JOIN conversation_qa_pairs qa ON cs.session_id = qa.session_id
         LEFT JOIN conversation_summaries s ON cs.session_id = s.session_id
         WHERE cs.session_id = $1`,
        [sessionId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old conversations (optional maintenance)
   */
  async cleanupOldConversations(daysOld = 30) {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `DELETE FROM conversation_sessions 
         WHERE updated_at < NOW() - INTERVAL '${daysOld} days' 
         AND is_active = false`
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old conversations`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `SELECT 
           (SELECT COUNT(*) FROM conversation_sessions) as total_sessions,
           (SELECT COUNT(*) FROM conversation_messages) as total_messages,
           (SELECT COUNT(*) FROM conversation_qa_pairs) as total_qa_pairs,
           (SELECT COUNT(*) FROM conversation_summaries) as total_summaries,
           (SELECT COUNT(*) FROM conversation_sessions WHERE is_active = true) as active_sessions`
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics for debugging
   */
  async getDatabaseStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM conversation_sessions) as sessions,
          (SELECT COUNT(*) FROM conversation_messages) as messages,
          (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs,
          (SELECT COUNT(*) FROM conversation_summaries) as summaries,
          (SELECT COUNT(*) FROM memory_retrieval_cache) as cache_entries
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default PostgreSQLMemoryService;
