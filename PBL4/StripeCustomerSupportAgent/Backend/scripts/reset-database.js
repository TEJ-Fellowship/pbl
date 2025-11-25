import pool from "../config/database.js";

/**
 * Reset Database Script
 * Clears all conversation data from the database
 */
async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log("🗑️ Resetting all conversation data...");
    console.log("=".repeat(50));

    // Delete all data from conversation tables (in correct order due to foreign keys)
    console.log("1. Clearing memory_retrieval_cache...");
    await client.query("DELETE FROM memory_retrieval_cache");
    console.log("   ✅ Cleared memory_retrieval_cache");

    console.log("2. Clearing conversation_summaries...");
    await client.query("DELETE FROM conversation_summaries");
    console.log("   ✅ Cleared conversation_summaries");

    console.log("3. Clearing conversation_qa_pairs...");
    await client.query("DELETE FROM conversation_qa_pairs");
    console.log("   ✅ Cleared conversation_qa_pairs");

    console.log("4. Clearing conversation_messages...");
    await client.query("DELETE FROM conversation_messages");
    console.log("   ✅ Cleared conversation_messages");

    console.log("5. Clearing conversation_sessions...");
    await client.query("DELETE FROM conversation_sessions");
    console.log("   ✅ Cleared conversation_sessions");

    // Get counts to verify
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM conversation_sessions) as sessions,
        (SELECT COUNT(*) FROM conversation_messages) as messages,
        (SELECT COUNT(*) FROM conversation_qa_pairs) as qa_pairs,
        (SELECT COUNT(*) FROM conversation_summaries) as summaries,
        (SELECT COUNT(*) FROM memory_retrieval_cache) as cache
    `);

    console.log("\n📊 Final counts:");
    console.table(counts.rows[0]);

    console.log("\n🎉 Database reset complete!");
    console.log("All conversation data has been cleared.");
  } catch (error) {
    console.error("❌ Error resetting database:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("reset-database.js")) {
  resetDatabase().catch(console.error);
}

export default resetDatabase;
