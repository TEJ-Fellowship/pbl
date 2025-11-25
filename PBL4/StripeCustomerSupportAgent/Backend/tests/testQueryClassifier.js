import QueryClassifier from "../services/queryClassifier.js";
import MCPIntegrationService from "../services/mcpIntegrationService.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "../config/config.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Query Classifier Test Suite
 * Tests the query classifier with hybrid caching (exact, fuzzy, semantic)
 */
class QueryClassifierTest {
  constructor() {
    this.testResults = [];
    this.mcpService = null;
    this.queryClassifier = null;
    this.embeddings = null;
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log("🔧 Initializing test environment...");

    try {
      // Initialize MCP service
      this.mcpService = new MCPIntegrationService();
      await this.mcpService.ensureInitialized();

      // Initialize embeddings for semantic matching
      if (config.GEMINI_API_KEY) {
        this.embeddings = new GoogleGenerativeAIEmbeddings({
          modelName: "text-embedding-004",
          apiKey: config.GEMINI_API_KEY,
        });
        console.log("✅ Embeddings initialized");
      } else {
        console.warn("⚠️ GEMINI_API_KEY not found - semantic matching will be disabled");
      }

      // Initialize query classifier
      this.queryClassifier = new QueryClassifier(
        this.mcpService.orchestrator,
        this.embeddings
      );

      console.log("✅ Test environment initialized\n");
    } catch (error) {
      console.error("❌ Failed to initialize test environment:", error.message);
      throw error;
    }
  }

  /**
   * Run a single test
   */
  async runTest(testName, testFn) {
    console.log(`\n🧪 Test: ${testName}`);
    console.log("-".repeat(60));
    try {
      const result = await testFn();
      this.testResults.push({ name: testName, status: "✅ PASS", result });
      console.log(`✅ PASS: ${testName}`);
      return result;
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: "❌ FAIL",
        error: error.message,
      });
      console.error(`❌ FAIL: ${testName} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Test 1: Exact Match Caching
   */
  async testExactMatch() {
    const query = "What's Stripe's fee for $1000 transaction?";
    const enabledTools = ["calculator", "web_search"];

    // First call - should be cache miss
    console.log("📝 First call (cache miss expected)...");
    const start1 = Date.now();
    const result1 = await this.queryClassifier.classifyQuery(
      query,
      0.5,
      enabledTools
    );
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms`);
    console.log(`   Approach: ${result1.approach}`);

    // Second call - should be exact cache hit
    console.log("\n📝 Second call (exact cache hit expected)...");
    const start2 = Date.now();
    const result2 = await this.queryClassifier.classifyQuery(
      query,
      0.5,
      enabledTools
    );
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms`);
    console.log(`   Approach: ${result2.approach}`);

    // Verify results match
    if (result1.approach !== result2.approach) {
      throw new Error("Results don't match!");
    }

    // Verify cache hit was faster
    if (time2 >= time1) {
      console.warn("⚠️ Cache hit was not faster (might be due to network timing)");
    }

    return {
      firstCall: { time: time1, approach: result1.approach },
      secondCall: { time: time2, approach: result2.approach },
      speedup: time1 - time2,
    };
  }

  /**
   * Test 2: Fuzzy Match Caching
   */
  async testFuzzyMatch() {
    const query1 = "What's Stripe's fee for $1000?";
    const query2 = "What is Stripe fee for $1000?"; // Similar but different (missing 's')
    const enabledTools = ["calculator"];

    // First call
    console.log(`📝 First query: "${query1}"`);
    const start1 = Date.now();
    const result1 = await this.queryClassifier.classifyQuery(
      query1,
      0.5,
      enabledTools
    );
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms, Approach: ${result1.approach}`);

    // Second call with similar query
    console.log(`\n📝 Second query (fuzzy match expected): "${query2}"`);
    const start2 = Date.now();
    const result2 = await this.queryClassifier.classifyQuery(
      query2,
      0.5,
      enabledTools
    );
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms, Approach: ${result2.approach}`);

    return {
      firstQuery: { query: query1, time: time1, approach: result1.approach },
      secondQuery: {
        query: query2,
        time: time2,
        approach: result2.approach,
      },
      speedup: time1 - time2,
    };
  }

  /**
   * Test 3: Semantic Match Caching (if embeddings available)
   */
  async testSemanticMatch() {
    if (!this.embeddings) {
      console.log("⏭️ Skipping semantic match test (embeddings not available)");
      return { skipped: true };
    }

    const query1 = "What's Stripe's fee for $1000?";
    const query2 = "What is Stripe pricing for $1000?"; // Synonym: fee → pricing
    const enabledTools = ["calculator"];

    // First call
    console.log(`📝 First query: "${query1}"`);
    const start1 = Date.now();
    const result1 = await this.queryClassifier.classifyQuery(
      query1,
      0.5,
      enabledTools
    );
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms, Approach: ${result1.approach}`);

    // Second call with semantically similar query
    console.log(`\n📝 Second query (semantic match expected): "${query2}"`);
    const start2 = Date.now();
    const result2 = await this.queryClassifier.classifyQuery(
      query2,
      0.5,
      enabledTools
    );
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms, Approach: ${result2.approach}`);

    return {
      firstQuery: { query: query1, time: time1, approach: result1.approach },
      secondQuery: {
        query: query2,
        time: time2,
        approach: result2.approach,
      },
      speedup: time1 - time2,
    };
  }

  /**
   * Test 4: Different Query Types
   */
  async testDifferentQueryTypes() {
    const testQueries = [
      {
        query: "What's Stripe's fee for $1000?",
        description: "Fee calculation query",
        expectedApproach: "MCP_TOOLS_ONLY",
      },
      {
        query: "How do I create a payment intent?",
        description: "API documentation query",
        expectedApproach: "HYBRID_SEARCH",
      },
      {
        query: "What is my name?",
        description: "Conversational query",
        expectedApproach: "CONVERSATIONAL",
      },
      {
        query: "Calculate fee and show me the API docs",
        description: "Combined query",
        expectedApproach: "COMBINED",
      },
    ];

    const results = [];

    for (const testCase of testQueries) {
      console.log(`\n📝 Testing: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      const start = Date.now();
      const result = await this.queryClassifier.classifyQuery(
        testCase.query,
        0.5,
        null
      );
      const time = Date.now() - start;
      console.log(
        `   Result: ${result.approach} (${time}ms) - Expected: ${testCase.expectedApproach}`
      );

      results.push({
        query: testCase.query,
        description: testCase.description,
        approach: result.approach,
        expected: testCase.expectedApproach,
        time: time,
        match: result.approach === testCase.expectedApproach,
      });
    }

    return results;
  }

  /**
   * Test 5: Cache Statistics
   */
  async testCacheStatistics() {
    console.log("📊 Checking cache statistics...");

    // Make a few queries to populate cache
    const queries = [
      "What's Stripe's fee?",
      "How to create payment?",
      "What is my name?",
    ];

    for (const query of queries) {
      await this.queryClassifier.classifyQuery(query, 0.5, null);
    }

    // Get statistics
    const stats = this.queryClassifier.getStats();
    console.log("\n📈 Cache Statistics:");
    console.log(JSON.stringify(stats.cache, null, 2));

    return stats;
  }

  /**
   * Test 6: Context-Aware Caching (Different Tools)
   */
  async testContextAwareCaching() {
    const query = "Calculate fee";
    const tools1 = ["calculator"];
    const tools2 = ["calculator", "web_search"];

    console.log(`📝 Query: "${query}"`);
    console.log(`   First call with tools: ${tools1.join(", ")}`);
    const start1 = Date.now();
    const result1 = await this.queryClassifier.classifyQuery(
      query,
      0.5,
      tools1
    );
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms, Approach: ${result1.approach}`);

    console.log(`\n   Second call with tools: ${tools2.join(", ")}`);
    const start2 = Date.now();
    const result2 = await this.queryClassifier.classifyQuery(
      query,
      0.5,
      tools2
    );
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms, Approach: ${result2.approach}`);

    // Third call - should hit cache for tools1
    console.log(`\n   Third call (cache hit for tools1): ${tools1.join(", ")}`);
    const start3 = Date.now();
    const result3 = await this.queryClassifier.classifyQuery(
      query,
      0.5,
      tools1
    );
    const time3 = Date.now() - start3;
    console.log(`   Time: ${time3}ms, Approach: ${result3.approach}`);

    return {
      tools1: { time: time1, approach: result1.approach },
      tools2: { time: time2, approach: result2.approach },
      tools1Cached: { time: time3, approach: result3.approach },
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log("🧪 Query Classifier Test Suite");
    console.log("=".repeat(60));
    console.log("Testing hybrid caching: exact → fuzzy → semantic\n");

    try {
      await this.initialize();

      // Run tests
      await this.runTest("Exact Match Caching", () => this.testExactMatch());
      await this.runTest("Fuzzy Match Caching", () => this.testFuzzyMatch());
      await this.runTest("Semantic Match Caching", () =>
        this.testSemanticMatch()
      );
      await this.runTest("Different Query Types", () =>
        this.testDifferentQueryTypes()
      );
      await this.runTest("Cache Statistics", () => this.testCacheStatistics());
      await this.runTest("Context-Aware Caching", () =>
        this.testContextAwareCaching()
      );

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error("\n❌ Test suite failed:", error);
      process.exit(1);
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Summary");
    console.log("=".repeat(60));

    const passed = this.testResults.filter((r) => r.status === "✅ PASS").length;
    const failed = this.testResults.filter((r) => r.status === "❌ FAIL").length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${this.testResults.length}`);

    console.log("\n📋 Test Results:");
    this.testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.status} - ${result.name}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    // Print final cache stats
    console.log("\n📊 Final Cache Statistics:");
    const finalStats = this.queryClassifier.getStats();
    console.log(JSON.stringify(finalStats.cache, null, 2));

    console.log("\n" + "=".repeat(60));
  }
}

// Run tests if executed directly
const test = new QueryClassifierTest();
test.runAllTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});

export default QueryClassifierTest;

