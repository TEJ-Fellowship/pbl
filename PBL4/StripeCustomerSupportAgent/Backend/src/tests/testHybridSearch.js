import HybridSearch from "../hybridSearch.js";
import { loadVectorStore, initGeminiEmbeddings } from "../chat.js";

/**
 * Test script for hybrid search functionality
 * Demonstrates BM25 + Semantic fusion with error code detection
 */
async function testHybridSearch() {
  console.log("🧪 Testing Hybrid Search System");
  console.log("=".repeat(50));

  try {
    // Initialize components
    const vectorStore = await loadVectorStore();
    const embeddings = initGeminiEmbeddings();

    // Initialize hybrid search
    const hybridSearch = new HybridSearch(vectorStore, embeddings);
    await hybridSearch.initialize();

    // Test queries with different characteristics
    const testQueries = [
      {
        query: "card_declined",
        description: "Error code query (should boost BM25 weight)",
        expectedType: "Error Code",
      },
      {
        query: "How do I create a payment intent?",
        description: "General API question (should use semantic weight)",
        expectedType: "General",
      },
      {
        query: "webhook signature verification",
        description: "Technical concept (balanced search)",
        expectedType: "Technical",
      },
      {
        query: "sk_live_1234567890",
        description: "API key pattern (should boost BM25 weight)",
        expectedType: "API Key",
      },
      {
        query: "subscription billing setup",
        description: "Feature question (semantic search)",
        expectedType: "Feature",
      },
    ];

    console.log("\n🔍 Running test queries...\n");

    for (const test of testQueries) {
      console.log(`\n📝 Query: "${test.query}"`);
      console.log(`📋 Description: ${test.description}`);
      console.log(`🎯 Expected Type: ${test.expectedType}`);
      console.log("-".repeat(40));

      try {
        const results = await hybridSearch.hybridSearch(test.query, 5);

        console.log(`\n📊 Results (${results.length} found):`);
        if (results.length > 0) {
          console.table(
            results.map((result, index) => ({
              Rank: index + 1,
              Source: result.source || result.metadata?.source || "Unknown",
              "Final Score": result.finalScore.toFixed(3),
              "BM25 Score": result.bm25Score.toFixed(3),
              "Semantic Score": result.semanticScore.toFixed(3),
              "Search Type": result.searchType || "fused",
            }))
          );
        } else {
          console.log("❌ No results found");
        }
      } catch (error) {
        console.error(`❌ Error testing query "${test.query}":`, error.message);
      }

      console.log("\n" + "=".repeat(50));
    }

    console.log("\n✅ Hybrid search testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith("testHybridSearch.js")) {
  testHybridSearch().catch(console.error);
}

export { testHybridSearch };
