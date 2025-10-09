import HybridSearch from "../hybridSearch.js";
import { loadVectorStore, initGeminiEmbeddings } from "../chat.js";

/**
 * Demonstration script for hybrid search functionality
 * Shows the difference between BM25, semantic, and hybrid search
 */
async function demonstrateHybridSearch() {
  console.log("🎯 Hybrid Search Demonstration");
  console.log("=".repeat(60));
  console.log("This demo shows how hybrid search combines BM25 keyword search");
  console.log(
    "with semantic search for better results, especially for error codes."
  );
  console.log("=".repeat(60));

  try {
    // Initialize components
    console.log("\n🔧 Initializing components...");
    const vectorStore = await loadVectorStore();
    const embeddings = initGeminiEmbeddings();

    // Initialize hybrid search
    const hybridSearch = new HybridSearch(vectorStore, embeddings);
    await hybridSearch.initialize();

    // Demo queries that showcase different search behaviors
    const demoQueries = [
      {
        query: "card_declined",
        description: "Error code query - should boost BM25 weight",
        expectedBehavior:
          "BM25 will find exact matches, semantic will find related concepts",
      },
      {
        query: "How do I create a payment intent?",
        description: "General API question - should use semantic weight",
        expectedBehavior:
          "Semantic search will find conceptual matches, BM25 will find keyword matches",
      },
      {
        query: "webhook signature verification",
        description: "Technical concept - balanced search",
        expectedBehavior: "Both searches should contribute equally",
      },
    ];

    for (const demo of demoQueries) {
      console.log(`\n🔍 Demo Query: "${demo.query}"`);
      console.log(`📝 Description: ${demo.description}`);
      console.log(`🎯 Expected: ${demo.expectedBehavior}`);
      console.log("-".repeat(50));

      try {
        // Show individual search results
        console.log("\n1️⃣ BM25 Search Results:");
        const bm25Results = await hybridSearch.searchBM25(demo.query, 3);
        if (bm25Results.length > 0) {
          bm25Results.forEach((result, index) => {
            console.log(
              `   ${index + 1}. Score: ${result.score.toFixed(3)} - ${
                result.source || "Unknown source"
              }`
            );
          });
        } else {
          console.log("   No BM25 results found");
        }

        console.log("\n2️⃣ Semantic Search Results:");
        const semanticResults = await hybridSearch.searchSemantic(
          demo.query,
          3
        );
        if (semanticResults.length > 0) {
          semanticResults.forEach((result, index) => {
            console.log(
              `   ${index + 1}. Score: ${result.score.toFixed(3)} - ${
                result.source || "Unknown source"
              }`
            );
          });
        } else {
          console.log("   No semantic results found");
        }

        console.log("\n3️⃣ Hybrid Search Results (Fused):");
        const hybridResults = await hybridSearch.hybridSearch(demo.query, 3);
        if (hybridResults.length > 0) {
          console.table(
            hybridResults.map((result, index) => ({
              Rank: index + 1,
              Source: result.source || result.metadata?.source || "Unknown",
              "Final Score": result.finalScore.toFixed(3),
              "BM25 Score": result.bm25Score.toFixed(3),
              "Semantic Score": result.semanticScore.toFixed(3),
              "Search Type": result.searchType || "fused",
            }))
          );
        } else {
          console.log("   No hybrid results found");
        }
      } catch (error) {
        console.error(`❌ Error in demo for "${demo.query}":`, error.message);
      }

      console.log("\n" + "=".repeat(60));
    }

    console.log("\n✅ Hybrid search demonstration completed!");
    console.log("\n💡 Key Takeaways:");
    console.log("   • Error codes benefit from BM25 keyword matching");
    console.log("   • Conceptual queries benefit from semantic understanding");
    console.log("   • Hybrid search combines both approaches intelligently");
    console.log("   • Dynamic weight adjustment optimizes for query type");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log(
      "   1. Ensure environment variables are set (GEMINI_API_KEY, PINECONE_API_KEY)"
    );
    console.log("   2. Check that vector store is properly initialized");
    console.log("   3. Verify documents are indexed in the vector store");
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith("demoHybridSearch.js")) {
  demonstrateHybridSearch().catch(console.error);
}

export { demonstrateHybridSearch };
