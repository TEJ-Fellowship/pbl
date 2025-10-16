import pool from "./config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log("🚀 Setting up PostgreSQL database for Stripe Support Agent...");
  console.log("=".repeat(60));

  try {
    // Test connection
    console.log("🔍 Testing database connection...");
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL successfully");

    // Read and execute the schema
    console.log("📋 Reading database schema...");
    const schemaPath = path.resolve(
      __dirname,
      "utils/setup_conversation_memory.sql"
    );
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("🔧 Creating tables and functions...");
    await client.query(schema);
    console.log("✅ Database schema created successfully");

    // Test token functions
    console.log("🧪 Testing token counting functions...");
    const tokenTest = await client.query(
      "SELECT estimate_token_count('Hello world, this is a test message') as tokens"
    );
    console.log(
      `📊 Token count test: "${tokenTest.rows[0].tokens}" tokens for test message`
    );

    // Test session token update function
    console.log("🧪 Testing session token update function...");
    const sessionTest = await client.query(`
      INSERT INTO conversation_sessions (session_id, user_id) 
      VALUES ('test_session_123', 'test_user') 
      ON CONFLICT (session_id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO conversation_messages (message_id, session_id, role, content, token_count)
      VALUES ('test_msg_1', 'test_session_123', 'user', 'Hello', 1),
             ('test_msg_2', 'test_session_123', 'assistant', 'Hi there!', 2)
    `);

    await client.query("SELECT update_session_token_usage('test_session_123')");

    const sessionResult = await client.query(`
      SELECT total_tokens, token_usage_percentage 
      FROM conversation_sessions 
      WHERE session_id = 'test_session_123'
    `);

    console.log(
      `📊 Session token test: ${sessionResult.rows[0].total_tokens} tokens, ${sessionResult.rows[0].token_usage_percentage}% usage`
    );

    // Clean up test data
    await client.query(
      "DELETE FROM conversation_sessions WHERE session_id = 'test_session_123'"
    );

    client.release();
    await pool.end();

    console.log("=".repeat(60));
    console.log("🎉 Database setup completed successfully!");
    console.log("✅ All tables created");
    console.log("✅ Token counting functions working");
    console.log("✅ Session management ready");
    console.log("🚀 You can now start the application!");

    return true;
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.error("Full error:", error);
    console.log("\n💡 Make sure:");
    console.log("   • PostgreSQL is running");
    console.log("   • Database 'stripe_support_db' exists");
    console.log("   • Environment variables are set correctly");
    console.log("   • User has proper permissions");
    return false;
  }
}

setupDatabase();
