import {
  retrieveChunksWithHybridSearch,
  loadVectorStore,
  initGeminiEmbeddings,
} from "../chat.js";

/**
 * Test script to verify chat integration with hybrid search
 */
async function testChatIntegration() {
  console.log("🧪 Testing Chat Integration with Hybrid Search");
  console.log("=".repeat(60));

  try {
    // Initialize components
    console.log("🔧 Initializing components...");
    const vectorStore = await loadVectorStore();
    const embeddings = initGeminiEmbeddings();

    // Test queries
    const testQueries = [
      "card_declined",
      "How do I create a payment intent?",
      "webhook signature verification",
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      console.log("-".repeat(40));

      try {
        const chunks = await retrieveChunksWithHybridSearch(
          query,
          vectorStore,
          embeddings
        );

        console.log(`📊 Found ${chunks.length} chunks`);
        if (chunks.length > 0) {
          console.log("📋 Top 3 results:");
          chunks.slice(0, 3).forEach((chunk, index) => {
            console.log(
              `   ${index + 1}. Score: ${
                chunk.similarity?.toFixed(3) || chunk.score?.toFixed(3) || "N/A"
              }`
            );
            console.log(`      Source: ${chunk.metadata?.source || "Unknown"}`);
            console.log(`      Type: ${chunk.searchType || "hybrid"}`);
          });
        } else {
          console.log("❌ No results found");
        }
      } catch (error) {
        console.error(`❌ Error testing query "${query}":`, error.message);
      }

      console.log("\n" + "=".repeat(60));
    }

    console.log("\n✅ Chat integration testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith("testChatIntegration.js")) {
  testChatIntegration().catch(console.error);
}

export { testChatIntegration };
