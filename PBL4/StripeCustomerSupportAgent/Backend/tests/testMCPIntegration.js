import MCPIntegrationService from "../services/mcpIntegrationService.js";

import config from "../config/config.js";

/**
 * Test MCP Integration
 * Comprehensive test suite for MCP tool integration
 */
class MCPIntegrationTest {
  constructor() {
    this.mcpService = new MCPIntegrationService();
    this.testResults = [];
  }

  /**
   * Run all MCP integration tests
   */
  async runAllTests() {
    console.log("🧪 Starting MCP Integration Tests...\n");

    try {
      // Test 1: Integration Status
      await this.testIntegrationStatus();

      // Test 2: Tool Availability
      await this.testToolAvailability();

      // Test 3: Calculator Tool
      await this.testCalculatorTool();

      // Test 4: Status Checker Tool
      await this.testStatusCheckerTool();

      // Test 5: Web Search Tool
      await this.testWebSearchTool();

      // Test 6: Code Validator Tool
      await this.testCodeValidatorTool();

      // Test 7: DateTime Tool
      await this.testDateTimeTool();

      // Test 8: End-to-End Integration
      await this.testEndToEndIntegration();

      // Test 9: Error Handling
      await this.testErrorHandling();

      // Test 10: Performance
      await this.testPerformance();

      this.printTestResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error.message);
    }
  }

  /**
   * Test integration status
   */
  async testIntegrationStatus() {
    console.log("🔍 Testing Integration Status...");

    try {
      const status = this.mcpService.getIntegrationStatus();

      this.addTestResult("Integration Status", {
        success: status.enabled,
        message: status.enabled
          ? "MCP integration is enabled"
          : "MCP integration is disabled",
        details: status,
      });
    } catch (error) {
      this.addTestResult("Integration Status", {
        success: false,
        message: `Integration status test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test tool availability
   */
  async testToolAvailability() {
    console.log("🔍 Testing Tool Availability...");

    try {
      const tools = this.mcpService.getAvailableTools();
      const expectedTools = [
        "calculator",
        "status_checker",
        "web_search",
        "code_validator",
        "datetime",
      ];

      const availableTools = Object.keys(tools);
      const missingTools = expectedTools.filter(
        (tool) => !availableTools.includes(tool)
      );

      this.addTestResult("Tool Availability", {
        success: missingTools.length === 0,
        message:
          missingTools.length === 0
            ? "All tools available"
            : `Missing tools: ${missingTools.join(", ")}`,
        details: { available: availableTools, missing: missingTools },
      });
    } catch (error) {
      this.addTestResult("Tool Availability", {
        success: false,
        message: `Tool availability test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test calculator tool
   */
  async testCalculatorTool() {
    console.log("🧮 Testing Calculator Tool...");

    try {
      const testQueries = [
        "What's Stripe's fee for $100?",
        "If I charge 3.2% + $0.30 per transaction, what's the fee on $1,247.50?",
        "Calculate 2.9% of $500",
      ];

      const results = [];
      for (const query of testQueries) {
        const result = await this.mcpService.processQueryWithMCP(query, 0.5);
        results.push({ query, success: result.success });
      }

      const successCount = results.filter((r) => r.success).length;

      this.addTestResult("Calculator Tool", {
        success: successCount === testQueries.length,
        message: `${successCount}/${testQueries.length} calculator tests passed`,
        details: results,
      });
    } catch (error) {
      this.addTestResult("Calculator Tool", {
        success: false,
        message: `Calculator tool test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test status checker tool
   */
  async testStatusCheckerTool() {
    console.log("⚠️ Testing Status Checker Tool...");

    try {
      const testQueries = [
        "Is Stripe down?",
        "Are there any current issues with Stripe?",
        "What's the status of Stripe webhooks?",
      ];

      const results = [];
      for (const query of testQueries) {
        const result = await this.mcpService.processQueryWithMCP(query, 0.5);
        results.push({ query, success: result.success });
      }

      const successCount = results.filter((r) => r.success).length;

      this.addTestResult("Status Checker Tool", {
        success: successCount === testQueries.length,
        message: `${successCount}/${testQueries.length} status checker tests passed`,
        details: results,
      });
    } catch (error) {
      this.addTestResult("Status Checker Tool", {
        success: false,
        message: `Status checker tool test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test web search tool
   */
  async testWebSearchTool() {
    console.log("🔍 Testing Web Search Tool...");

    try {
      const testQueries = [
        "Latest Stripe API updates",
        "Recent Stripe webhook changes",
        "New Stripe features 2024",
      ];

      const results = [];
      for (const query of testQueries) {
        const result = await this.mcpService.processQueryWithMCP(query, 0.3); // Low confidence to trigger web search
        results.push({ query, success: result.success });
      }

      const successCount = results.filter((r) => r.success).length;

      this.addTestResult("Web Search Tool", {
        success: successCount === testQueries.length,
        message: `${successCount}/${testQueries.length} web search tests passed`,
        details: results,
      });
    } catch (error) {
      this.addTestResult("Web Search Tool", {
        success: false,
        message: `Web search tool test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test code validator tool
   */
  async testCodeValidatorTool() {
    console.log("🔍 Testing Code Validator Tool...");

    try {
      const testQueries = [
        "How do I validate this endpoint: /v1/charges",
        "Is this API key valid: sk_test_1234567890",
        "Check this code: fetch('https://api.stripe.com/v1/charges')",
      ];

      const results = [];
      for (const query of testQueries) {
        const result = await this.mcpService.processQueryWithMCP(query, 0.5);
        results.push({ query, success: result.success });
      }

      const successCount = results.filter((r) => r.success).length;

      this.addTestResult("Code Validator Tool", {
        success: successCount === testQueries.length,
        message: `${successCount}/${testQueries.length} code validator tests passed`,
        details: results,
      });
    } catch (error) {
      this.addTestResult("Code Validator Tool", {
        success: false,
        message: `Code validator tool test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test datetime tool
   */
  async testDateTimeTool() {
    console.log("⏰ Testing DateTime Tool...");

    try {
      const testQueries = [
        "What time is it now?",
        "Is it business hours?",
        "When is the next business day?",
      ];

      const results = [];
      for (const query of testQueries) {
        const result = await this.mcpService.processQueryWithMCP(query, 0.5);
        results.push({ query, success: result.success });
      }

      const successCount = results.filter((r) => r.success).length;

      this.addTestResult("DateTime Tool", {
        success: successCount === testQueries.length,
        message: `${successCount}/${testQueries.length} datetime tests passed`,
        details: results,
      });
    } catch (error) {
      this.addTestResult("DateTime Tool", {
        success: false,
        message: `DateTime tool test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test end-to-end integration
   */
  async testEndToEndIntegration() {
    console.log("🔄 Testing End-to-End Integration...");

    try {
      const testQuery =
        "What's Stripe's fee for $1000 and is there any current downtime?";
      const result = await this.mcpService.processQueryWithMCP(testQuery, 0.5);

      this.addTestResult("End-to-End Integration", {
        success: result.success,
        message: result.success
          ? "End-to-end integration successful"
          : "End-to-end integration failed",
        details: {
          toolsUsed: result.toolsUsed,
          confidence: result.confidence,
          hasEnhancedResponse: !!result.enhancedResponse,
        },
      });
    } catch (error) {
      this.addTestResult("End-to-End Integration", {
        success: false,
        message: `End-to-end integration test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log("❌ Testing Error Handling...");

    try {
      // Test with invalid query
      const result = await this.mcpService.processQueryWithMCP("", 0.5);

      this.addTestResult("Error Handling", {
        success: true, // Should handle gracefully
        message: "Error handling test completed",
        details: { result },
      });
    } catch (error) {
      this.addTestResult("Error Handling", {
        success: false,
        message: `Error handling test failed: ${error.message}`,
      });
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log("⚡ Testing Performance...");

    try {
      const startTime = Date.now();
      const testQuery = "What's Stripe's fee for $100?";

      await this.mcpService.processQueryWithMCP(testQuery, 0.5);

      const endTime = Date.now();
      const duration = endTime - startTime;

      this.addTestResult("Performance", {
        success: duration < 10000, // Should complete within 10 seconds
        message: `Performance test completed in ${duration}ms`,
        details: { duration, threshold: 10000 },
      });
    } catch (error) {
      this.addTestResult("Performance", {
        success: false,
        message: `Performance test failed: ${error.message}`,
      });
    }
  }

  /**
   * Add test result
   * @param {string} testName - Test name
   * @param {Object} result - Test result
   */
  addTestResult(testName, result) {
    this.testResults.push({
      testName,
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log("\n📊 MCP Integration Test Results:");
    console.log("=".repeat(50));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );
    console.log("\nDetailed Results:");

    this.testResults.forEach((result) => {
      const status = result.success ? "✅" : "❌";
      console.log(`${status} ${result.testName}: ${result.message}`);

      if (result.details && typeof result.details === "object") {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    });

    console.log("\n" + "=".repeat(50));

    if (failedTests > 0) {
      console.log("⚠️ Some tests failed. Check the details above.");
    } else {
      console.log("🎉 All tests passed! MCP integration is working correctly.");
    }
  }
}

// Run tests if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("testMCPIntegration.js")
) {
  const test = new MCPIntegrationTest();
  test.runAllTests().catch(console.error);
}

export default MCPIntegrationTest;
