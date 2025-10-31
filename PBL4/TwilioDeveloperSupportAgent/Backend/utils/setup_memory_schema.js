import fs from "fs/promises";
import path from "path";
import pool from "../config/database.js";

/**
 * Setup Memory Schema Script
 * Creates the conversation memory tables and functions
 */
async function setupMemorySchema() {
  console.log("🧠 Setting up conversation memory schema...");

  try {
    // Check if tables already exist
    try {
      const checkTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('conversation_sessions', 'conversation_messages', 'conversation_qa_pairs', 'conversation_summaries', 'memory_retrieval_cache')
      `);

      if (checkTables.rows.length >= 5) {
        console.log("✅ Memory schema tables already exist!");

        // Test the setup
        const testResult = await pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM conversation_sessions) as sessions,
            (SELECT COUNT(*) FROM conversation_messages) as messages,
            (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs,
            (SELECT COUNT(*) FROM conversation_summaries) as summaries
        `);

        console.log("📊 Schema test results:");
        console.table(testResult.rows[0]);
        return;
      }
    } catch (error) {
      console.log("📝 Tables don't exist yet, proceeding with creation...");
    }

    // Read the SQL schema file
    const schemaPath = path.join(
      process.cwd(),
      "scripts",
      "setup_conversation_memory.sql"
    );
    const schemaSQL = await fs.readFile(schemaPath, "utf8");

    // Execute the entire SQL schema as one transaction
    console.log("📝 Executing memory schema SQL...");

    try {
      await pool.query(schemaSQL);
      console.log("✅ Memory schema SQL executed successfully!");
    } catch (error) {
      if (error.code === "42P07") {
        // Table already exists
        console.log("⚠️  Some tables already exist, continuing...");
      } else {
        console.error("❌ Failed to execute memory schema:", error.message);
        throw error;
      }
    }

    console.log("✅ Conversation memory schema created successfully!");

    // Test the setup
    const testResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM conversation_sessions) as sessions,
        (SELECT COUNT(*) FROM conversation_messages) as messages,
        (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs,
        (SELECT COUNT(*) FROM conversation_summaries) as summaries
    `);

    console.log("📊 Schema test results:");
    console.table(testResult.rows[0]);
  } catch (error) {
    console.error("❌ Failed to setup memory schema:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("setup_memory_schema.js")) {
  setupMemorySchema().catch(console.error);
}

export default setupMemorySchema;