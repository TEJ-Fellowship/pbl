import HybridCache from "../services/hybridCache.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "../config/config.js";

// Initialize embeddings for semantic matching
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: config.GEMINI_API_KEY,
  modelName: "text-embedding-004",
});

// Initialize response cache
const responseCache = new HybridCache({
  cacheTTL: 5 * 60 * 1000, // 5 minutes for testing
  fuzzyThreshold: 0.85, // 85% for responses
  semanticThreshold: 0.8, // 80% for responses
  embeddings: embeddings,
  cleanupThreshold: 50,
});

// Test data
const testQueries = [
  {
    query: "What is Stripe's fee for $1000?",
    context: "approach:MCP_TOOLS_ONLY|tools:stripe_calculator",
    response: {
      answer:
        "Stripe charges 2.9% + $0.30 per transaction. For $1000, that would be $29.30.",
      sources: [],
      confidence: 0.95,
      sessionId: "test_session_1",
      searchQuery: "What is Stripe's fee for $1000?",
      timestamp: new Date().toISOString(),
    },
    metadata: { latency: 2000 },
  },
  {
    query: "How do I integrate Stripe payments?",
    context: "approach:HYBRID_SEARCH|tools:all",
    response: {
      answer:
        "To integrate Stripe payments, you need to install the Stripe SDK, create an API key, and implement the payment flow.",
      sources: [
        { title: "Stripe Integration Guide", url: "https://stripe.com/docs" },
      ],
      confidence: 0.88,
      sessionId: "test_session_2",
      searchQuery: "How do I integrate Stripe payments?",
      timestamp: new Date().toISOString(),
    },
    metadata: { latency: 3500 },
  },
];

async function testExactCacheHit() {
  console.log("\n🧪 Test 1: Exact Cache Hit");
  console.log("=".repeat(60));

  const test = testQueries[0];

  // Set cache
  responseCache.set(test.query, test.response, test.context, test.metadata);
  console.log(`✅ Cached: "${test.query}"`);

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get from cache
  const cached = await responseCache.get(test.query, test.context);

  if (cached && cached.matchType === "exact") {
    console.log(`✅ Exact cache hit found!`);
    console.log(`   Match Type: ${cached.matchType}`);
    console.log(`   Saved Latency: ~${cached.metadata?.latency || 0}ms`);
    console.log(`   Answer: ${cached.value.answer.substring(0, 50)}...`);
    return true;
  } else {
    console.log(`❌ Exact cache hit failed!`);
    return false;
  }
}

async function testFuzzyCacheHit() {
  console.log("\n🧪 Test 2: Fuzzy Cache Hit");
  console.log("=".repeat(60));

  const test = testQueries[0];
  const fuzzyQuery = "What is Stripe fee for $1000?"; // Missing apostrophe and 's'

  // Set cache with original query
  responseCache.set(test.query, test.response, test.context, test.metadata);
  console.log(`✅ Cached: "${test.query}"`);

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Try to get with fuzzy query
  const cached = await responseCache.get(fuzzyQuery, test.context);

  if (cached && cached.matchType === "fuzzy") {
    console.log(`✅ Fuzzy cache hit found!`);
    console.log(`   Original Query: "${test.query}"`);
    console.log(`   Fuzzy Query: "${fuzzyQuery}"`);
    console.log(`   Similarity: ${(cached.similarity * 100).toFixed(1)}%`);
    console.log(`   Match Type: ${cached.matchType}`);
    console.log(`   Saved Latency: ~${cached.metadata?.latency || 0}ms`);
    return true;
  } else {
    console.log(`❌ Fuzzy cache hit failed!`);
    console.log(`   Cached: ${cached ? cached.matchType : "null"}`);
    return false;
  }
}

async function testSemanticCacheHit() {
  console.log("\n🧪 Test 3: Semantic Cache Hit");
  console.log("=".repeat(60));

  const test = testQueries[0];
  const semanticQuery = "What are Stripe's pricing charges for $1000?"; // Different wording, same meaning

  // Set cache with original query
  responseCache.set(test.query, test.response, test.context, test.metadata);
  console.log(`✅ Cached: "${test.query}"`);

  // Wait for embedding generation
  console.log(`   Generating embeddings for semantic match...`);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Try to get with semantic query
  const cached = await responseCache.get(semanticQuery, test.context);

  if (cached && cached.matchType === "semantic") {
    console.log(`✅ Semantic cache hit found!`);
    console.log(`   Original Query: "${test.query}"`);
    console.log(`   Semantic Query: "${semanticQuery}"`);
    console.log(`   Similarity: ${(cached.similarity * 100).toFixed(1)}%`);
    console.log(`   Match Type: ${cached.matchType}`);
    console.log(`   Saved Latency: ~${cached.metadata?.latency || 0}ms`);
    return true;
  } else {
    console.log(`❌ Semantic cache hit failed!`);
    console.log(`   Cached: ${cached ? cached.matchType : "null"}`);
    if (cached) {
      console.log(`   Similarity: ${(cached.similarity * 100).toFixed(1)}%`);
    }
    return false;
  }
}

async function testContextAwareCaching() {
  console.log("\n🧪 Test 4: Context-Aware Caching");
  console.log("=".repeat(60));

  const query = "What is Stripe's fee?";
  const context1 = "approach:MCP_TOOLS_ONLY|tools:stripe_calculator";
  const context2 = "approach:HYBRID_SEARCH|tools:all";

  const response1 = {
    answer: "MCP response: Stripe charges 2.9% + $0.30",
    sources: [],
    confidence: 0.95,
    sessionId: "test_session_1",
    searchQuery: query,
    timestamp: new Date().toISOString(),
  };

  const response2 = {
    answer: "Hybrid search response: Stripe's pricing structure...",
    sources: [{ title: "Stripe Docs", url: "https://stripe.com/docs" }],
    confidence: 0.88,
    sessionId: "test_session_2",
    searchQuery: query,
    timestamp: new Date().toISOString(),
  };

  // Cache with context1
  responseCache.set(query, response1, context1, { latency: 2000 });
  console.log(`✅ Cached with context1: "${context1}"`);

  // Cache with context2
  responseCache.set(query, response2, context2, { latency: 3500 });
  console.log(`✅ Cached with context2: "${context2}"`);

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get with context1
  const cached1 = await responseCache.get(query, context1);
  console.log(`\n   Retrieving with context1...`);
  if (cached1 && cached1.value.answer.includes("MCP response")) {
    console.log(`   ✅ Correct response for context1`);
  } else {
    console.log(`   ❌ Wrong response for context1`);
    return false;
  }

  // Get with context2
  const cached2 = await responseCache.get(query, context2);
  console.log(`\n   Retrieving with context2...`);
  if (cached2 && cached2.value.answer.includes("Hybrid search")) {
    console.log(`   ✅ Correct response for context2`);
  } else {
    console.log(`   ❌ Wrong response for context2`);
    return false;
  }

  return true;
}

async function testCacheMiss() {
  console.log("\n🧪 Test 5: Cache Miss");
  console.log("=".repeat(60));

  const test = testQueries[0];
  const differentQuery = "What is the weather today?";

  // Set cache
  responseCache.set(test.query, test.response, test.context, test.metadata);
  console.log(`✅ Cached: "${test.query}"`);

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Try to get with completely different query
  const cached = await responseCache.get(differentQuery, test.context);

  if (!cached) {
    console.log(`✅ Cache miss correctly returned null`);
    console.log(`   Query: "${differentQuery}"`);
    console.log(`   (No similar cached query found)`);
    return true;
  } else {
    console.log(`❌ Cache miss failed - found unexpected match!`);
    console.log(`   Match Type: ${cached.matchType}`);
    return false;
  }
}

async function testCacheStats() {
  console.log("\n🧪 Test 6: Cache Statistics");
  console.log("=".repeat(60));

  const cacheStats = responseCache.getStats();
  const stats = cacheStats.stats;

  console.log(`📊 Cache Statistics:`);
  console.log(`   Cache Size: ${cacheStats.size} entries`);
  console.log(`   TTL: ${cacheStats.ttlMinutes} minutes`);
  console.log(
    `   Fuzzy Threshold: ${(cacheStats.fuzzyThreshold * 100).toFixed(0)}%`
  );
  console.log(
    `   Semantic Threshold: ${(cacheStats.semanticThreshold * 100).toFixed(0)}%`
  );
  console.log(
    `   Semantic Enabled: ${cacheStats.semanticEnabled ? "Yes" : "No"}`
  );
  console.log(`\n   Performance Stats:`);
  console.log(`   Exact Hits: ${stats.exactHits}`);
  console.log(`   Fuzzy Hits: ${stats.fuzzyHits}`);
  console.log(`   Semantic Hits: ${stats.semanticHits}`);
  console.log(`   Misses: ${stats.misses}`);
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Hit Rate: ${stats.hitRate}`);

  if (stats.totalRequests > 0) {
    console.log(`✅ Statistics are being tracked correctly`);
    return true;
  } else {
    console.log(`❌ No statistics tracked`);
    return false;
  }
}

async function runAllTests() {
  console.log("\n🚀 Starting Response Cache Tests");
  console.log("=".repeat(60));

  const results = {
    exact: false,
    fuzzy: false,
    semantic: false,
    context: false,
    miss: false,
    stats: false,
  };

  try {
    results.exact = await testExactCacheHit();
    results.fuzzy = await testFuzzyCacheHit();
    results.semantic = await testSemanticCacheHit();
    results.context = await testContextAwareCaching();
    results.miss = await testCacheMiss();
    results.stats = await testCacheStats();

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Summary");
    console.log("=".repeat(60));
    console.log(
      `   Exact Cache Hit:     ${results.exact ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `   Fuzzy Cache Hit:     ${results.fuzzy ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `   Semantic Cache Hit:  ${results.semantic ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `   Context-Aware:       ${results.context ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `   Cache Miss:          ${results.miss ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(
      `   Cache Statistics:    ${results.stats ? "✅ PASS" : "❌ FAIL"}`
    );

    const passed = Object.values(results).filter((r) => r).length;
    const total = Object.keys(results).length;
    console.log(`\n   Total: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log("\n🎉 All tests passed!");
      process.exit(0);
    } else {
      console.log("\n⚠️ Some tests failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Test Error:", error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
