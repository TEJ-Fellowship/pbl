import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addTokenTracking() {
  console.log("🔢 Adding token tracking to database...");
  console.log("=".repeat(50));

  const client = await pool.connect();
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, "../utils/add_token_tracking.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Execute the migration
    await client.query(sqlContent);

    console.log("✅ Token tracking migration completed successfully!");
    console.log("📊 Added columns:");
    console.log("   • conversation_sessions.total_tokens");
    console.log("   • conversation_sessions.max_tokens");
    console.log("   • conversation_sessions.token_usage_percentage");
    console.log("   • conversation_messages.token_count");
    console.log("");
    console.log("🔧 Added functions:");
    console.log("   • estimate_token_count()");
    console.log("   • update_session_token_usage()");
    console.log("   • get_sessions_near_token_limit()");
    console.log("");
    console.log("⚡ Added triggers:");
    console.log("   • Automatic token counting on message insert");
    console.log("   • Automatic session token usage updates");

    // Verify the migration
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_sessions' 
      AND column_name LIKE '%token%'
      ORDER BY column_name;
    `);

    console.log("\n📋 Token tracking columns verified:");
    console.table(result.rows);
  } catch (error) {
    console.error("❌ Token tracking migration failed:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTokenTracking().catch(console.error);
