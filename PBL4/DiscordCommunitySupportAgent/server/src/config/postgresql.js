import pkg from 'pg';
const { Pool } = pkg;

/**
 * PostgreSQL Database Configuration
 * Handles analytics data storage for Discord Community Support Agent
 */
class PostgreSQLConfig {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  async initialize() {
    try {
      console.log("🐘 Initializing PostgreSQL connection...");

      const host = process.env.POSTGRES_HOST || 'localhost';
      const port = parseInt(process.env.POSTGRES_PORT) || 5432;
      const database = process.env.POSTGRES_DB || 'discord_analytics';
      const user = process.env.POSTGRES_USER || 'postgres';
      const password = process.env.POSTGRES_PASSWORD || 'password';

      // Enable SSL for managed providers like Neon/Supabase or when POSTGRES_SSL=true
      const enableSSL = (
        (process.env.POSTGRES_SSL || '').toString().toLowerCase() === 'true' ||
        /\.neon\.tech$/i.test(host)
      );

      this.pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Give remote providers (Neon/Supabase) more time
        keepAlive: true,
        ssl: enableSSL ? { rejectUnauthorized: false } : undefined
      });

      // Test the connection
      const client = await this.pool.connect();
      console.log("✅ PostgreSQL connection established");
      
      // Initialize database schema
      await this.initializeSchema(client);
      
      client.release();
      this.isInitialized = true;
      
      console.log("✅ PostgreSQL database initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize PostgreSQL:", error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Initialize database schema
   * @param {Object} client - PostgreSQL client
   */
  async initializeSchema(client) {
    try {
      console.log("📋 Creating PostgreSQL schema...");

      // Create analytics tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          query TEXT NOT NULL,
          category VARCHAR(50),
          confidence_score DECIMAL(3,2),
          search_method VARCHAR(20),
          session_id VARCHAR(100),
          server_context JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS question_patterns (
          id SERIAL PRIMARY KEY,
          pattern_type VARCHAR(50) NOT NULL,
          pattern_data JSONB NOT NULL,
          frequency INTEGER DEFAULT 1,
          first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS escalation_events (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(100),
          query TEXT NOT NULL,
          confidence_score DECIMAL(3,2),
          escalation_reason TEXT,
          escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP,
          resolution_notes TEXT
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(100),
          query TEXT NOT NULL,
          response_id VARCHAR(100),
          feedback_type VARCHAR(10) CHECK (feedback_type IN ('positive', 'negative')),
          feedback_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS analytics_summary (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          total_questions INTEGER DEFAULT 0,
          avg_confidence DECIMAL(3,2),
          escalation_rate DECIMAL(3,2),
          positive_feedback_rate DECIMAL(3,2),
          top_categories JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(date)
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_escalation_events_session_id ON escalation_events(session_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date);
      `);

      console.log("✅ PostgreSQL schema created successfully");
    } catch (error) {
      console.error("❌ Failed to create PostgreSQL schema:", error.message);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   * @returns {Object} PostgreSQL client
   */
  async getClient() {
    if (!this.isInitialized) {
      throw new Error("PostgreSQL not initialized");
    }
    return await this.pool.connect();
  }

  /**
   * Execute a query
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  async query(text, params) {
    if (!this.isInitialized) {
      throw new Error("PostgreSQL not initialized");
    }
    return await this.pool.query(text, params);
  }

  /**
   * Close the connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log("✅ PostgreSQL connection pool closed");
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      totalCount: this.pool ? this.pool.totalCount : 0,
      idleCount: this.pool ? this.pool.idleCount : 0,
      waitingCount: this.pool ? this.pool.waitingCount : 0
    };
  }
}

// Export singleton instance
export default new PostgreSQLConfig();
