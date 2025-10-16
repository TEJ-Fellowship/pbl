import pool from "./config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseMigrator {
  constructor() {
    this.client = null;
    this.migrationVersion = "1.0.0";
  }

  async connect() {
    try {
      this.client = await pool.connect();
      console.log("✅ Connected to PostgreSQL database");
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to database:", error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      this.client.release();
    }
    await pool.end();
  }

  async checkDatabaseExists() {
    try {
      const result = await this.client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1"
      );
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  async dropExistingTables() {
    console.log("🗑️  Dropping existing tables if they exist...");

    const tables = [
      "memory_retrieval_cache",
      "conversation_summaries",
      "conversation_qa_pairs",
      "conversation_messages",
      "conversation_sessions",
      "document_chunks", // Add document_chunks table
    ];

    for (const table of tables) {
      try {
        await this.client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Table ${table} may not exist: ${error.message}`);
      }
    }
  }

  async createTables() {
    console.log("🔧 Creating database tables and functions...");

    // First, create the document_chunks table
    console.log("   📄 Creating document_chunks table...");
    const documentChunksSchema = `
      -- Create document chunks table for BM25 search
      CREATE TABLE document_chunks (
          id SERIAL PRIMARY KEY,
          chunk_id VARCHAR(255) UNIQUE NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          title VARCHAR(500),
          category VARCHAR(100),
          source VARCHAR(500),
          word_count INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for efficient BM25 search
      CREATE INDEX idx_document_chunks_content_gin ON document_chunks USING gin(to_tsvector('english', content));
      CREATE INDEX idx_document_chunks_metadata_gin ON document_chunks USING gin(metadata);
      CREATE INDEX idx_document_chunks_category ON document_chunks (category);
      CREATE INDEX idx_document_chunks_source ON document_chunks (source);
      CREATE INDEX idx_document_chunks_word_count ON document_chunks (word_count);
      CREATE INDEX idx_document_chunks_category_word_count ON document_chunks (category, word_count);
      CREATE INDEX idx_document_chunks_chunk_id ON document_chunks (chunk_id);
    `;

    try {
      await this.client.query(documentChunksSchema);
      console.log("   ✅ Document chunks table created successfully");
    } catch (error) {
      console.log(`   ⚠️  Document chunks table warning: ${error.message}`);
    }

    // Then create the conversation memory schema
    console.log("   💬 Creating conversation memory tables...");
    const schemaPath = path.resolve(
      __dirname,
      "utils/setup_conversation_memory.sql"
    );
    const schema = fs.readFileSync(schemaPath, "utf8");

    try {
      await this.client.query(schema);
      console.log("   ✅ Conversation memory schema created successfully");
    } catch (error) {
      console.log(
        `   ⚠️  Conversation memory schema warning: ${error.message}`
      );
    }
  }

  async verifySchema() {
    console.log("🔍 Verifying database schema...");

    const requiredTables = [
      "conversation_sessions",
      "conversation_messages",
      "conversation_qa_pairs",
      "conversation_summaries",
      "memory_retrieval_cache",
      "document_chunks", // Add document_chunks table
    ];

    for (const table of requiredTables) {
      const result = await this.client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);

      if (result.rows[0].exists) {
        console.log(`   ✅ Table ${table} exists`);
      } else {
        throw new Error(`❌ Table ${table} is missing`);
      }
    }

    // Check required columns in conversation_sessions
    const sessionColumns = await this.client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_sessions' 
      AND table_schema = 'public';
    `);

    const requiredSessionColumns = [
      "session_id",
      "user_id",
      "total_tokens",
      "max_tokens",
      "token_usage_percentage",
    ];
    const existingColumns = sessionColumns.rows.map((row) => row.column_name);

    for (const column of requiredSessionColumns) {
      if (existingColumns.includes(column)) {
        console.log(`   ✅ Column conversation_sessions.${column} exists`);
      } else {
        throw new Error(`❌ Column conversation_sessions.${column} is missing`);
      }
    }

    // Check required columns in conversation_messages
    const messageColumns = await this.client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_messages' 
      AND table_schema = 'public';
    `);

    const requiredMessageColumns = [
      "message_id",
      "session_id",
      "role",
      "content",
      "token_count",
    ];
    const existingMessageColumns = messageColumns.rows.map(
      (row) => row.column_name
    );

    for (const column of requiredMessageColumns) {
      if (existingMessageColumns.includes(column)) {
        console.log(`   ✅ Column conversation_messages.${column} exists`);
      } else {
        throw new Error(`❌ Column conversation_messages.${column} is missing`);
      }
    }
  }

  async testFunctions() {
    console.log("🧪 Testing database functions...");

    // Test token counting function
    try {
      const tokenTest = await this.client.query(
        "SELECT estimate_token_count('Hello world, this is a test message') as tokens"
      );
      console.log(
        `   ✅ Token counting function works: ${tokenTest.rows[0].tokens} tokens`
      );
    } catch (error) {
      throw new Error(`❌ Token counting function failed: ${error.message}`);
    }

    // Test session token update function
    try {
      // Create test session
      await this.client.query(`
        INSERT INTO conversation_sessions (session_id, user_id) 
        VALUES ('migration_test_session', 'migration_user') 
        ON CONFLICT (session_id) DO NOTHING
      `);

      // Insert test messages
      await this.client.query(`
        INSERT INTO conversation_messages (message_id, session_id, role, content, token_count)
        VALUES ('migration_test_msg_1', 'migration_test_session', 'user', 'Test message', 2),
               ('migration_test_msg_2', 'migration_test_session', 'assistant', 'Test response', 3)
        ON CONFLICT (message_id) DO NOTHING
      `);

      // Test token update function
      await this.client.query(
        "SELECT update_session_token_usage('migration_test_session')"
      );

      // Verify results
      const sessionResult = await this.client.query(`
        SELECT total_tokens, token_usage_percentage 
        FROM conversation_sessions 
        WHERE session_id = 'migration_test_session'
      `);

      console.log(
        `   ✅ Session token update works: ${sessionResult.rows[0].total_tokens} tokens, ${sessionResult.rows[0].token_usage_percentage}% usage`
      );

      // Clean up test data
      await this.client.query(
        "DELETE FROM conversation_sessions WHERE session_id = 'migration_test_session'"
      );
    } catch (error) {
      throw new Error(
        `❌ Session token update function failed: ${error.message}`
      );
    }
  }

  async runMigration() {
    console.log("🚀 Starting Database Migration");
    console.log("=".repeat(60));
    console.log(`📋 Migration Version: ${this.migrationVersion}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    try {
      // Step 1: Connect to database
      if (!(await this.connect())) {
        throw new Error("Failed to connect to database");
      }

      // Step 2: Check if database exists
      const dbExists = await this.checkDatabaseExists();
      console.log(
        `📊 Database status: ${
          dbExists ? "Has existing data" : "Empty database"
        }`
      );

      // Step 3: Drop existing tables (clean slate)
      await this.dropExistingTables();

      // Step 4: Create tables and functions
      await this.createTables();

      // Step 5: Verify schema
      await this.verifySchema();

      // Step 6: Test functions
      await this.testFunctions();

      console.log("=".repeat(60));
      console.log("🎉 Database migration completed successfully!");
      console.log("✅ All tables created with correct schema");
      console.log("✅ All functions working properly");
      console.log("✅ Database ready for application use");
      console.log("🚀 You can now start your application!");
      console.log("=".repeat(60));

      return true;
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      console.error("Full error:", error);
      console.log("\n💡 Troubleshooting tips:");
      console.log("   • Ensure PostgreSQL is running");
      console.log("   • Check database connection settings");
      console.log("   • Verify user has proper permissions");
      console.log("   • Make sure database exists");
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Run migration if script is executed directly
if (process.argv[1] && process.argv[1].endsWith("migrate-database.js")) {
  const migrator = new DatabaseMigrator();
  migrator.runMigration().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export default DatabaseMigrator;
