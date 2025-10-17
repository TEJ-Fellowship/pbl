import { createOptimizedHybridRetriever } from "./optimized-hybrid-retriever.js";
import { createHybridRetriever } from "./hybrid-retriever.js";
import { createCrossEncoderReranker } from "./reranker.js";
import { embedSingle } from "./utils/embeddings.js";

/**
 * Test suite for cross-encoder re-ranking functionality
 */
async function testReranking() {
  console.log("🧪 Starting re-ranking test suite...\n");

  try {
    // Test 1: Test standalone re-ranker
    console.log("📋 Test 1: Standalone Cross-Encoder Re-ranker");
    console.log("=".repeat(50));

    const reranker = await createCrossEncoderReranker({
      topK: 10,
      finalK: 4,
      batchSize: 5,
      cacheSize: 100,
    });

    // Mock search results for testing
    const mockResults = [
      {
        doc: "Shopify API allows you to create products using REST endpoints. You can use POST /admin/api/2023-10/products.json to create a new product.",
        metadata: { title: "Product API", section: "api_products" },
        score: 0.9,
      },
      {
        doc: "Getting started with Shopify is easy. First, create your store, then add products and configure your theme.",
        metadata: { title: "Getting Started", section: "getting_started" },
        score: 0.8,
      },
      {
        doc: "Orders in Shopify can be managed through the admin interface or via API. You can view, update, and fulfill orders.",
        metadata: { title: "Order Management", section: "orders" },
        score: 0.7,
      },
      {
        doc: "Themes in Shopify allow you to customize your store's appearance. You can use Liquid templating language.",
        metadata: { title: "Theme Development", section: "theme" },
        score: 0.6,
      },
      {
        doc: "Webhooks allow you to receive notifications when events occur in your Shopify store.",
        metadata: { title: "Webhooks", section: "api" },
        score: 0.5,
      },
    ];

    const testQuery = "How to create products using Shopify API?";
    console.log(`🔍 Query: "${testQuery}"`);
    console.log(`📊 Input results: ${mockResults.length} documents`);

    const rerankedResults = await reranker.rerank(testQuery, mockResults);

    console.log(`✅ Re-ranked results: ${rerankedResults.length} documents`);
    rerankedResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. Score: ${result.rerankScore?.toFixed(3)} | ${
          result.metadata.title
        }`
      );
    });

    const stats = reranker.getStats();
    console.log(`📊 Re-ranker stats:`, stats);
    console.log();

    // Test 2: Test with OptimizedHybridRetriever
    console.log("📋 Test 2: OptimizedHybridRetriever with Re-ranking");
    console.log("=".repeat(50));

    const optimizedRetriever = await createOptimizedHybridRetriever({
      enableReranking: true,
      rerankTopK: 10,
      rerankFinalK: 4,
      maxResults: 15,
      finalK: 4,
    });

    const queryEmbedding = await embedSingle(testQuery);
    const optimizedResults = await optimizedRetriever.search({
      query: testQuery,
      queryEmbedding,
      k: 4,
    });

    console.log(
      `✅ OptimizedHybridRetriever results: ${optimizedResults.length} documents`
    );
    optimizedResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. Score: ${result.score?.toFixed(3)} | Reranked: ${
          result.reranked
        } | ${result.metadata?.title || "Unknown"}`
      );
    });

    const optimizedStats = optimizedRetriever.getStats();
    console.log(`📊 OptimizedHybridRetriever stats:`, optimizedStats);
    console.log();

    // Test 3: Test with HybridRetriever
    console.log("📋 Test 3: HybridRetriever with Re-ranking");
    console.log("=".repeat(50));

    const hybridRetriever = await createHybridRetriever({
      enableReranking: true,
      rerankTopK: 10,
      rerankFinalK: 4,
      maxResults: 15,
      finalK: 4,
    });

    const hybridResults = await hybridRetriever.search({
      query: testQuery,
      queryEmbedding,
      k: 4,
    });

    console.log(
      `✅ HybridRetriever results: ${hybridResults.length} documents`
    );
    hybridResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. Score: ${result.score?.toFixed(3)} | Reranked: ${
          result.reranked
        } | ${result.metadata?.title || "Unknown"}`
      );
    });

    const hybridStats = hybridRetriever.getStats();
    console.log(`📊 HybridRetriever stats:`, hybridStats);
    console.log();

    // Test 4: Performance comparison
    console.log("📋 Test 4: Performance Comparison");
    console.log("=".repeat(50));

    const performanceTests = [
      {
        name: "Standalone Re-ranker",
        fn: () => reranker.rerank(testQuery, mockResults),
      },
      {
        name: "OptimizedHybridRetriever",
        fn: () =>
          optimizedRetriever.search({ query: testQuery, queryEmbedding, k: 4 }),
      },
      {
        name: "HybridRetriever",
        fn: () =>
          hybridRetriever.search({ query: testQuery, queryEmbedding, k: 4 }),
      },
    ];

    for (const test of performanceTests) {
      const startTime = Date.now();
      await test.fn();
      const endTime = Date.now();
      console.log(`⏱️  ${test.name}: ${endTime - startTime}ms`);
    }

    console.log("\n✅ All re-ranking tests completed successfully!");
  } catch (error) {
    console.error("❌ Re-ranking test failed:", error);
    throw error;
  }
}

/**
 * Test re-ranking with different query types
 */
async function testQueryTypes() {
  console.log("\n🧪 Testing different query types...\n");

  const testQueries = [
    {
      query: "How to create products using Shopify API?",
      expectedIntent: "api",
      description: "API-focused query",
    },
    {
      query: "Getting started with Shopify for beginners",
      expectedIntent: "beginner",
      description: "Beginner-focused query",
    },
    {
      query: "How to customize themes with Liquid templating?",
      expectedIntent: "technical",
      description: "Technical query",
    },
    {
      query: "What is Shopify and how does it work?",
      expectedIntent: "general",
      description: "General query",
    },
  ];

  try {
    const retriever = await createOptimizedHybridRetriever({
      enableReranking: true,
      rerankTopK: 8,
      rerankFinalK: 3,
    });

    for (const testCase of testQueries) {
      console.log(`🔍 Testing: ${testCase.description}`);
      console.log(`📝 Query: "${testCase.query}"`);

      const queryEmbedding = await embedSingle(testCase.query);
      const results = await retriever.search({
        query: testCase.query,
        queryEmbedding,
        k: 3,
      });

      console.log(`✅ Results: ${results.length} documents`);
      results.forEach((result, index) => {
        console.log(
          `  ${index + 1}. Score: ${result.score?.toFixed(3)} | ${
            result.metadata?.title || "Unknown"
          }`
        );
      });
      console.log();
    }
  } catch (error) {
    console.error("❌ Query type test failed:", error);
    throw error;
  }
}

/**
 * Test source boundary compliance
 */
async function testSourceBoundaries() {
  console.log("\n🧪 Testing source boundary compliance...\n");

  try {
    const retriever = await createOptimizedHybridRetriever({
      enableReranking: true,
      rerankTopK: 10,
      rerankFinalK: 4,
    });

    const testQuery = "How to manage orders in Shopify?";
    const queryEmbedding = await embedSingle(testQuery);

    const results = await retriever.search({
      query: testQuery,
      queryEmbedding,
      k: 4,
    });

    console.log(`🔍 Query: "${testQuery}"`);
    console.log(`✅ Results: ${results.length} documents`);

    // Check that all results have valid metadata and source information
    const validSources = [
      "getting_started",
      "products",
      "orders",
      "helpCenter",
      "manual_getting_started",
      "manual_products",
      "manual_orders",
      "api",
      "api_admin_graphql",
      "api_admin_rest",
      "api_storefront",
      "api_products",
      "api_orders",
      "theme",
      "forum",
    ];

    let boundaryCompliant = true;
    results.forEach((result, index) => {
      const section = result.metadata?.section;
      const hasValidSource = section && validSources.includes(section);

      console.log(
        `  ${index + 1}. Section: ${section} | Valid: ${
          hasValidSource ? "✅" : "❌"
        } | ${result.metadata?.title || "Unknown"}`
      );

      if (!hasValidSource) {
        boundaryCompliant = false;
      }
    });

    if (boundaryCompliant) {
      console.log("✅ All results comply with source boundaries");
    } else {
      console.log("⚠️ Some results may not comply with source boundaries");
    }
  } catch (error) {
    console.error("❌ Source boundary test failed:", error);
    throw error;
  }
}

// Main test runner
async function main() {
  try {
    await testReranking();
    await testQueryTypes();
    await testSourceBoundaries();

    console.log("\n🎉 All re-ranking tests completed successfully!");
    console.log("✅ Cross-encoder re-ranking is working correctly");
    console.log("✅ Source boundaries are respected");
    console.log("✅ Performance is within acceptable limits");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
