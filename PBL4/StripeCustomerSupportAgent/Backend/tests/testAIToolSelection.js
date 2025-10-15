import AIToolSelectionService from "../services/mcp-server/aiToolSelectionService.js";
import AgentOrchestrator from "../services/mcp-server/agentOrchestrator.js";
import MCPIntegrationService from "../services/mcpIntegrationService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * AI Tool Selection Test Suite
 * Tests the AI-powered tool selection system
 */
class AIToolSelectionTest {
  constructor() {
    this.aiToolSelection = new AIToolSelectionService();
    this.orchestrator = new AgentOrchestrator();
    this.mcpService = new MCPIntegrationService();
    this.testResults = [];
  }

  /**
   * Run all AI tool selection tests
   */
  async runAllTests() {
    console.log("🤖 Testing AI-Powered Tool Selection");
    console.log("=".repeat(50));

    try {
      // Test 1: AI Service Configuration
      await this.testAIServiceConfiguration();

      // Test 2: Basic AI Tool Selection
      await this.testBasicAIToolSelection();

      // Test 3: Complex Query Analysis
      await this.testComplexQueryAnalysis();

      // Test 4: Fallback Mechanism
      await this.testFallbackMechanism();

      // Test 5: Integration with MCP Service
      await this.testMCPIntegration();

      // Test 6: Performance Testing
      await this.testPerformance();

      // Print results
      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error.message);
    }
  }

  /**
   * Test 1: AI Service Configuration
   */
  async testAIServiceConfiguration() {
    console.log("\n1️⃣ Testing AI Service Configuration...");

    try {
      const stats = this.aiToolSelection.getStats();
      console.log(
        `   Gemini Available: ${stats.geminiAvailable ? "✅ YES" : "❌ NO"}`
      );
      console.log(`   Model: ${stats.model}`);

      const hasApiKey = !!process.env.GEMINI_API_KEY;
      console.log(`   API Key: ${hasApiKey ? "✅ SET" : "❌ NOT SET"}`);

      this.addTestResult(
        "AI Service Configuration",
        stats.geminiAvailable ? "✅ PASSED" : "⚠️ FALLBACK MODE"
      );
    } catch (error) {
      console.error(
        "   ❌ AI service configuration test failed:",
        error.message
      );
      this.addTestResult("AI Service Configuration", "❌ FAILED");
    }
  }

  /**
   * Test 2: Basic AI Tool Selection
   */
  async testBasicAIToolSelection() {
    console.log("\n2️⃣ Testing Basic AI Tool Selection...");

    const testCases = [
      {
        query: "What's Stripe's fee for $1000?",
        expectedTools: ["calculator"],
        description: "Fee calculation query",
      },
      {
        query: "Is Stripe down right now?",
        expectedTools: ["status_checker"],
        description: "Status check query",
      },
      {
        query: "What are the latest Stripe API updates?",
        expectedTools: ["web_search"],
        description: "Recent updates query",
      },
      {
        query: "Validate this API endpoint: /v1/charges",
        expectedTools: ["code_validator"],
        description: "Code validation query",
      },
      {
        query: "What time is it now?",
        expectedTools: ["datetime"],
        description: "Time query",
      },
    ];

    for (const testCase of testCases) {
      try {
        console.log(`\n   Testing: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);

        const availableTools = this.orchestrator.getAvailableToolsConfig();
        const decision = await this.aiToolSelection.makeToolDecision(
          testCase.query,
          availableTools,
          0.5
        );

        console.log(
          `   AI Decision: ${decision.useTool ? "Use tools" : "No tools"}`
        );
        if (decision.useTool) {
          console.log(
            `   Selected Tools: ${decision.tools?.join(", ") || "None"}`
          );
          console.log(`   Reasoning: ${decision.reasoning}`);
        }

        const hasExpectedTools = testCase.expectedTools.every((tool) =>
          decision.tools?.includes(tool)
        );

        this.addTestResult(
          `Basic AI Selection - ${testCase.description}`,
          hasExpectedTools ? "✅ PASSED" : "⚠️ PARTIAL"
        );
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
        this.addTestResult(
          `Basic AI Selection - ${testCase.description}`,
          "❌ FAILED"
        );
      }
    }
  }

  /**
   * Test 3: Complex Query Analysis
   */
  async testComplexQueryAnalysis() {
    console.log("\n3️⃣ Testing Complex Query Analysis...");

    const complexQueries = [
      {
        query:
          "I need to calculate Stripe fees for $50,000 and check if the system is working properly",
        expectedTools: ["calculator", "status_checker"],
        description: "Multi-tool query",
      },
      {
        query:
          "What's the latest on Stripe webhooks and how do I validate my code?",
        expectedTools: ["web_search", "code_validator"],
        description: "Web search + validation query",
      },
      {
        query:
          "Calculate fees for $1000, check status, and tell me the current time",
        expectedTools: ["calculator", "status_checker", "datetime"],
        description: "Three-tool query",
      },
    ];

    for (const testCase of complexQueries) {
      try {
        console.log(`\n   Testing: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);

        const availableTools = this.orchestrator.getAvailableToolsConfig();
        const decision = await this.aiToolSelection.makeToolDecision(
          testCase.query,
          availableTools,
          0.5
        );

        console.log(
          `   AI Decision: ${decision.useTool ? "Use tools" : "No tools"}`
        );
        if (decision.useTool) {
          console.log(
            `   Selected Tools: ${decision.tools?.join(", ") || "None"}`
          );
          console.log(`   Tool Count: ${decision.tools?.length || 0}`);
          console.log(`   Reasoning: ${decision.reasoning}`);
        }

        const hasExpectedTools = testCase.expectedTools.every((tool) =>
          decision.tools?.includes(tool)
        );

        this.addTestResult(
          `Complex Analysis - ${testCase.description}`,
          hasExpectedTools ? "✅ PASSED" : "⚠️ PARTIAL"
        );
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
        this.addTestResult(
          `Complex Analysis - ${testCase.description}`,
          "❌ FAILED"
        );
      }
    }
  }

  /**
   * Test 4: Fallback Mechanism
   */
  async testFallbackMechanism() {
    console.log("\n4️⃣ Testing Fallback Mechanism...");

    try {
      // Test with invalid query to trigger fallback
      const invalidQuery = "Invalid query 12345";

      console.log(`   Testing fallback with: "${invalidQuery}"`);

      const availableTools = this.orchestrator.getAvailableToolsConfig();
      const decision = await this.aiToolSelection.makeToolDecision(
        invalidQuery,
        availableTools,
        0.5
      );

      console.log(
        `   Fallback Decision: ${decision.useTool ? "Use tools" : "No tools"}`
      );
      if (decision.useTool) {
        console.log(
          `   Selected Tools: ${decision.tools?.join(", ") || "None"}`
        );
      }

      this.addTestResult(
        "Fallback Mechanism",
        decision ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ Fallback mechanism test failed:", error.message);
      this.addTestResult("Fallback Mechanism", "❌ FAILED");
    }
  }

  /**
   * Test 5: Integration with MCP Service
   */
  async testMCPIntegration() {
    console.log("\n5️⃣ Testing MCP Integration...");

    try {
      const testQuery =
        "What's Stripe's fee for $500 and is the system working?";
      console.log(`   Testing MCP integration with: "${testQuery}"`);

      const result = await this.mcpService.processQueryWithMCP(testQuery, 0.5);

      console.log(`   MCP Success: ${result.success ? "✅ YES" : "❌ NO"}`);
      console.log(`   Tools Used: ${result.toolsUsed?.join(", ") || "None"}`);
      console.log(
        `   Enhanced Response: ${
          result.enhancedResponse ? "Generated" : "None"
        }`
      );

      this.addTestResult(
        "MCP Integration",
        result.success ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ MCP integration test failed:", error.message);
      this.addTestResult("MCP Integration", "❌ FAILED");
    }
  }

  /**
   * Test 6: Performance Testing
   */
  async testPerformance() {
    console.log("\n6️⃣ Testing Performance...");

    try {
      const testQuery = "Calculate Stripe fees for $1000";
      const iterations = 3;
      const times = [];

      console.log(`   Running ${iterations} iterations...`);

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const availableTools = this.orchestrator.getAvailableToolsConfig();
        await this.aiToolSelection.makeToolDecision(
          testQuery,
          availableTools,
          0.5
        );

        const duration = Date.now() - startTime;
        times.push(duration);
        console.log(`   Iteration ${i + 1}: ${duration}ms`);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`   Average Time: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min Time: ${minTime}ms`);
      console.log(`   Max Time: ${maxTime}ms`);

      const isPerformant = avgTime < 5000; // Less than 5 seconds
      this.addTestResult("Performance", isPerformant ? "✅ PASSED" : "⚠️ SLOW");
    } catch (error) {
      console.error("   ❌ Performance test failed:", error.message);
      this.addTestResult("Performance", "❌ FAILED");
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, result) {
    this.testResults.push({ testName, result });
  }

  /**
   * Print test results
   */
  printResults() {
    console.log("\n📊 AI Tool Selection Test Results:");
    console.log("=".repeat(50));

    this.testResults.forEach(({ testName, result }) => {
      console.log(`${testName}: ${result}`);
    });

    const successCount = this.testResults.filter((r) =>
      r.result.includes("✅")
    ).length;
    const totalCount = this.testResults.length;

    console.log("\n" + "=".repeat(50));
    console.log(`Overall: ${successCount}/${totalCount} tests passed`);

    if (successCount === totalCount) {
      console.log(
        "🎉 All tests passed! AI tool selection is working perfectly."
      );
    } else {
      console.log(
        "⚠️ Some tests failed. Check the configuration and API keys."
      );
    }
  }
}

// Run tests if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("testAIToolSelection.js")
) {
  const test = new AIToolSelectionTest();
  test.runAllTests().catch(console.error);
}

export default AIToolSelectionTest;
