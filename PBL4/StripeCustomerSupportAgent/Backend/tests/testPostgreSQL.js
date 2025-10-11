import PostgreSQLBM25Service from "../services/postgresBM25Service.js";

async function testPostgreSQL() {
  console.log("🧪 Testing PostgreSQL BM25 Service...");

  const postgresService = new PostgreSQLBM25Service();

  try {
    // Test connection and get stats
    console.log("📊 Testing database connection...");
    const stats = await postgresService.getStats();
    console.log("✅ PostgreSQL connection successful");
    console.log("📊 Database stats:", stats);

    // Test BM25 search
    console.log("\n🔍 Testing BM25 search...");
    const results = await postgresService.searchBM25("card declined", 5);
    console.log("✅ BM25 search test successful");
    console.log(`📊 Search results: ${results.length} found`);

    if (results.length > 0) {
      console.log("📋 Sample result:");
      console.log(`  - ID: ${results[0].id}`);
      console.log(`  - Score: ${results[0].bm25Score.toFixed(3)}`);
      console.log(
        `  - Content preview: ${results[0].content.substring(0, 100)}...`
      );
    }
  } catch (error) {
    console.error("❌ PostgreSQL test failed:", error.message);
    console.error(
      "💡 Make sure PostgreSQL is running and the database is set up correctly"
    );
  } finally {
    await postgresService.close();
  }
}

// Run the test
testPostgreSQL().catch(console.error);
