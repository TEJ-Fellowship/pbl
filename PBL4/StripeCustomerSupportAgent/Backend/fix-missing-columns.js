import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

class DatabaseFixer {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "stripe_support",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
    });
  }

  async connect() {
    try {
      console.log("🔌 Attempting to connect to database...");
      console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
      console.log(`   Port: ${process.env.DB_PORT || 5432}`);
      console.log(`   Database: ${process.env.DB_NAME || "stripe_support_db"}`);
      console.log(`   User: ${process.env.DB_USER || "postgres"}`);

      const client = await this.pool.connect();
      console.log("✅ Connected to PostgreSQL database");
      return client;
    } catch (error) {
      console.error("❌ Failed to connect to database:", error.message);
      console.error("Full error:", error);
      throw error;
    }
  }

  async checkTableStructure() {
    const client = await this.connect();
    try {
      console.log("🔍 Checking conversation_sessions table structure...");

      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'conversation_sessions' 
        ORDER BY ordinal_position;
      `);

      console.log("📊 Current table structure:");
      result.rows.forEach((row) => {
        console.log(
          `   • ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
        );
      });

      return result.rows;
    } finally {
      client.release();
    }
  }

  async addMissingColumns() {
    const client = await this.connect();
    try {
      console.log(
        "🔧 Adding missing columns to conversation_sessions table..."
      );

      // Check if total_tokens column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversation_sessions' AND column_name = 'total_tokens';
      `);

      if (checkResult.rows.length === 0) {
        console.log("   ➕ Adding total_tokens column...");
        await client.query(`
          ALTER TABLE conversation_sessions 
          ADD COLUMN total_tokens INTEGER DEFAULT 0;
        `);
        console.log("   ✅ total_tokens column added");
      } else {
        console.log("   ✅ total_tokens column already exists");
      }

      // Check if max_tokens column exists
      const checkMaxTokens = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversation_sessions' AND column_name = 'max_tokens';
      `);

      if (checkMaxTokens.rows.length === 0) {
        console.log("   ➕ Adding max_tokens column...");
        await client.query(`
          ALTER TABLE conversation_sessions 
          ADD COLUMN max_tokens INTEGER DEFAULT 4000;
        `);
        console.log("   ✅ max_tokens column added");
      } else {
        console.log("   ✅ max_tokens column already exists");
      }

      // Check if token_usage_percentage column exists
      const checkPercentage = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversation_sessions' AND column_name = 'token_usage_percentage';
      `);

      if (checkPercentage.rows.length === 0) {
        console.log("   ➕ Adding token_usage_percentage column...");
        await client.query(`
          ALTER TABLE conversation_sessions 
          ADD COLUMN token_usage_percentage DECIMAL(5,2) DEFAULT 0.00;
        `);
        console.log("   ✅ token_usage_percentage column added");
      } else {
        console.log("   ✅ token_usage_percentage column already exists");
      }

      // Check if token_count column exists in conversation_messages
      const checkTokenCount = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'conversation_messages' AND column_name = 'token_count';
      `);

      if (checkTokenCount.rows.length === 0) {
        console.log(
          "   ➕ Adding token_count column to conversation_messages..."
        );
        await client.query(`
          ALTER TABLE conversation_messages 
          ADD COLUMN token_count INTEGER DEFAULT 0;
        `);
        console.log("   ✅ token_count column added to conversation_messages");
      } else {
        console.log(
          "   ✅ token_count column already exists in conversation_messages"
        );
      }
    } finally {
      client.release();
    }
  }

  async createMissingFunctions() {
    const client = await this.connect();
    try {
      console.log("🔧 Creating missing database functions...");

      // Function to estimate token count for text
      console.log("   ➕ Creating estimate_token_count function...");
      await client.query(`
        CREATE OR REPLACE FUNCTION estimate_token_count(text_content TEXT)
        RETURNS INTEGER AS $$
        BEGIN
            -- Rough estimation: 1 token ≈ 4 characters for English text
            RETURN GREATEST(1, CEIL(LENGTH(text_content) / 4.0));
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log("   ✅ estimate_token_count function created");

      // Function to update session token usage
      console.log("   ➕ Creating update_session_token_usage function...");
      await client.query(`
        CREATE OR REPLACE FUNCTION update_session_token_usage(p_session_id VARCHAR(255))
        RETURNS VOID AS $$
        DECLARE
            session_total_tokens INTEGER;
            session_max_tokens INTEGER;
            usage_percentage DECIMAL(5,2);
        BEGIN
            -- Get total tokens for the session
            SELECT COALESCE(SUM(token_count), 0) INTO session_total_tokens
            FROM conversation_messages 
            WHERE session_id = p_session_id;
            
            -- Get max tokens for the session
            SELECT COALESCE(cs.max_tokens, 4000) INTO session_max_tokens
            FROM conversation_sessions cs
            WHERE cs.session_id = p_session_id;
            
            -- Calculate usage percentage
            usage_percentage := (session_total_tokens::DECIMAL / session_max_tokens::DECIMAL) * 100;
            
            -- Update session with new token counts
            UPDATE conversation_sessions 
            SET 
                total_tokens = session_total_tokens,
                token_usage_percentage = usage_percentage,
                updated_at = NOW()
            WHERE session_id = p_session_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log("   ✅ update_session_token_usage function created");
    } finally {
      client.release();
    }
  }

  async testFunctions() {
    const client = await this.connect();
    try {
      console.log("🧪 Testing database functions...");

      // Test estimate_token_count function
      const testResult = await client.query(`
        SELECT estimate_token_count('This is a test message with some content.');
      `);
      console.log(
        `   ✅ estimate_token_count test: ${testResult.rows[0].estimate_token_count} tokens`
      );

      // Test update_session_token_usage function (if we have a session)
      const sessionResult = await client.query(`
        SELECT session_id FROM conversation_sessions LIMIT 1;
      `);

      if (sessionResult.rows.length > 0) {
        const sessionId = sessionResult.rows[0].session_id;
        await client.query(`SELECT update_session_token_usage($1)`, [
          sessionId,
        ]);
        console.log(
          `   ✅ update_session_token_usage test: Function executed successfully`
        );
      } else {
        console.log(
          "   ℹ️ No sessions found to test update_session_token_usage function"
        );
      }
    } finally {
      client.release();
    }
  }

  async runFix() {
    console.log("🚀 Starting Database Fix");
    console.log("=".repeat(60));
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    try {
      // Step 1: Check current table structure
      await this.checkTableStructure();

      // Step 2: Add missing columns
      await this.addMissingColumns();

      // Step 3: Create missing functions
      await this.createMissingFunctions();

      // Step 4: Test functions
      await this.testFunctions();

      console.log("=".repeat(60));
      console.log("🎉 Database fix completed successfully!");
      console.log("✅ All missing columns added");
      console.log("✅ All missing functions created");
      console.log("✅ Database ready for token usage tracking");
      console.log("🚀 You can now restart your application!");
      console.log("=".repeat(60));

      return true;
    } catch (error) {
      console.error("❌ Database fix failed:", error.message);
      console.error("Full error:", error);
      return false;
    } finally {
      await this.pool.end();
    }
  }
}

// Run fix if script is executed directly
console.log("🚀 Script started");

// Check if this script is being run directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith("fix-missing-columns.js");

if (isMainModule) {
  console.log("✅ Script execution condition met");
  const fixer = new DatabaseFixer();
  fixer
    .runFix()
    .then((success) => {
      console.log("🏁 Script completed with success:", success);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
} else {
  console.log("❌ Script execution condition not met");
  console.log("   import.meta.url:", import.meta.url);
  console.log("   process.argv[1]:", process.argv[1]);
}

export default DatabaseFixer;
