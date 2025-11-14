import HybridSearch from "../hybridSearch.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";

/**
 * Test script for hybrid search system
 * Demonstrates proper BM25 + semantic fusion
 */
async function testHybridSearch() {
  console.log("🧪 Testing Hybrid Search System");
  console.log("=".repeat(60));

  try {
    // Initialize components
    console.log("🔧 Initializing components...");

    // Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      apiKey: config.GEMINI_API_KEY,
    });

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: config.PINECONE_API_KEY,
    });
    const vectorStore = {
      type: "pinecone",
      index: pinecone.index(config.PINECONE_INDEX_NAME),
    };

    console.log("✅ Components initialized");

    // Initialize hybrid search
    const hybridSearch = new HybridSearch(vectorStore, embeddings);
    await hybridSearch.initialize();

    console.log("\n🔍 Running test queries...\n");

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

    for (const testCase of testQueries) {
      console.log(`\n📝 Query: "${testCase.query}"`);
      console.log(`📋 Description: ${testCase.description}`);
      console.log(`🎯 Expected Type: ${testCase.expectedType}`);
      console.log("-".repeat(40));

      try {
        const results = await hybridSearch.hybridSearch(testCase.query, 5);

        console.log(`\n📊 Results (${results.length} found):`);
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

        // Show top 3 results with details
        console.log(`\n📋 Top 3 results:`);
        results.slice(0, 3).forEach((result, index) => {
          console.log(
            `   ${index + 1}. Score: ${result.finalScore.toFixed(3)}`
          );
          console.log(
            `      Source: ${
              result.source || result.metadata?.source || "Unknown"
            }`
          );
          console.log(`      Type: ${result.searchType || "fused"}`);
          console.log(`      Content: ${result.content.substring(0, 100)}...`);
          console.log("");
        });
      } catch (error) {
        console.error(
          `❌ Error testing query "${testCase.query}":`,
          error.message
        );
      }

      console.log("=".repeat(60));
    }

    console.log("\n✅ Hybrid search testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testHybridSearch();
