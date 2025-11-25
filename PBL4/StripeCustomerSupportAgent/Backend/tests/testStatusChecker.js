import StatusCheckerTool from "../services/mcp-tools/statusCheckerTool.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Status Checker Tool Test Suite
 * Tests the Stripe API status checker with sandbox account
 */
class StatusCheckerTest {
  constructor() {
    this.statusChecker = new StatusCheckerTool();
    this.testResults = [];
  }

  /**
   * Run all status checker tests
   */
  async runAllTests() {
    console.log("🔧 Testing Stripe Status Checker Tool");
    console.log("=".repeat(50));

    try {
      // Test 1: Configuration Check
      await this.testConfiguration();

      // Test 2: API Key Validation
      await this.testApiKeyValidation();

      // Test 3: Basic Status Check
      await this.testBasicStatusCheck();

      // Test 4: Detailed API Endpoint Testing
      await this.testDetailedApiEndpoints();

      // Test 5: Error Handling
      await this.testErrorHandling();

      // Test 6: Caching
      await this.testCaching();

      // Test 7: Performance
      await this.testPerformance();

      // Print results
      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error.message);
    }
  }

  /**
   * Test 1: Configuration Check
   */
  async testConfiguration() {
    console.log("\n1️⃣ Testing Configuration...");

    try {
      const hasApiKey = !!process.env.STRIPE_SECRET_KEY;
      const hasPublishableKey = !!process.env.STRIPE_PUBLISHABLE_KEY;

      console.log(`   API Key: ${hasApiKey ? "✅ SET" : "❌ NOT SET"}`);
      console.log(
        `   Publishable Key: ${hasPublishableKey ? "✅ SET" : "❌ NOT SET"}`
      );

      if (hasApiKey) {
        const keyType = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
          ? "Test"
          : "Live";
        console.log(`   Key Type: ${keyType} Key`);
      }

      this.addTestResult(
        "Configuration",
        hasApiKey && hasPublishableKey ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ Configuration test failed:", error.message);
      this.addTestResult("Configuration", "❌ FAILED");
    }
  }

  /**
   * Test 2: API Key Validation
   */
  async testApiKeyValidation() {
    console.log("\n2️⃣ Testing API Key Validation...");

    try {
      const apiKey = process.env.STRIPE_SECRET_KEY;

      if (!apiKey) {
        console.log("   ⚠️ No API key found in environment");
        this.addTestResult("API Key Validation", "⚠️ SKIPPED");
        return;
      }

      // Test if API key format is correct
      const isValidFormat =
        apiKey.startsWith("sk_test_") || apiKey.startsWith("sk_live_");
      console.log(
        `   Key Format: ${isValidFormat ? "✅ VALID" : "❌ INVALID"}`
      );

      // Test if it's a test key (safer for testing)
      const isTestKey = apiKey.startsWith("sk_test_");
      console.log(`   Key Type: ${isTestKey ? "✅ TEST KEY" : "⚠️ LIVE KEY"}`);

      this.addTestResult(
        "API Key Validation",
        isValidFormat ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ API key validation failed:", error.message);
      this.addTestResult("API Key Validation", "❌ FAILED");
    }
  }

  /**
   * Test 3: Basic Status Check
   */
  async testBasicStatusCheck() {
    console.log("\n3️⃣ Testing Basic Status Check...");

    try {
      const result = await this.statusChecker.execute("Is Stripe working?");

      console.log(`   Success: ${result.success ? "✅ YES" : "❌ NO"}`);
      console.log(`   Confidence: ${result.confidence}`);

      if (result.result) {
        console.log(
          `   Status: ${result.result.status?.indicator || "unknown"}`
        );
        console.log(
          `   Description: ${result.result.status?.description || "unknown"}`
        );
      }

      this.addTestResult(
        "Basic Status Check",
        result.success ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ Basic status check failed:", error.message);
      this.addTestResult("Basic Status Check", "❌ FAILED");
    }
  }

  /**
   * Test 4: Detailed API Endpoint Testing
   */
  async testDetailedApiEndpoints() {
    console.log("\n4️⃣ Testing Detailed API Endpoints...");

    try {
      const result = await this.statusChecker.execute(
        "Check all Stripe services"
      );

      if (result.success && result.result) {
        const components = result.result.components || [];
        const apiTests = result.result.api_tests || {};

        console.log(`   Total Endpoints Tested: ${apiTests.total || 0}`);
        console.log(`   Operational: ${apiTests.operational || 0}`);
        console.log(`   Degraded: ${apiTests.degraded || 0}`);

        console.log("\n   📊 Service Status:");
        components.forEach((component) => {
          const status = component.status === "operational" ? "✅" : "⚠️";
          console.log(`     ${status} ${component.name}: ${component.status}`);
        });
      }

      this.addTestResult(
        "Detailed API Endpoints",
        result.success ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ Detailed API endpoint test failed:", error.message);
      this.addTestResult("Detailed API Endpoints", "❌ FAILED");
    }
  }

  /**
   * Test 5: Error Handling
   */
  async testErrorHandling() {
    console.log("\n5️⃣ Testing Error Handling...");

    try {
      // Test with empty query
      const emptyResult = await this.statusChecker.execute("");
      console.log(
        `   Empty Query: ${emptyResult.success ? "✅ HANDLED" : "❌ FAILED"}`
      );

      // Test with invalid query
      const invalidResult = await this.statusChecker.execute(
        "invalid query 12345"
      );
      console.log(
        `   Invalid Query: ${
          invalidResult.success ? "✅ HANDLED" : "❌ FAILED"
        }`
      );

      const allHandled = emptyResult.success && invalidResult.success;
      this.addTestResult(
        "Error Handling",
        allHandled ? "✅ PASSED" : "❌ FAILED"
      );
    } catch (error) {
      console.error("   ❌ Error handling test failed:", error.message);
      this.addTestResult("Error Handling", "❌ FAILED");
    }
  }

  /**
   * Test 6: Caching
   */
  async testCaching() {
    console.log("\n6️⃣ Testing Caching...");

    try {
      const startTime1 = Date.now();
      const result1 = await this.statusChecker.execute("Test caching");
      const time1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      const result2 = await this.statusChecker.execute("Test caching again");
      const time2 = Date.now() - startTime2;

      console.log(`   First Request: ${time1}ms`);
      console.log(`   Second Request: ${time2}ms`);
      console.log(`   Cache Working: ${time2 < time1 ? "✅ YES" : "❌ NO"}`);

      this.addTestResult("Caching", time2 < time1 ? "✅ PASSED" : "❌ FAILED");
    } catch (error) {
      console.error("   ❌ Caching test failed:", error.message);
      this.addTestResult("Caching", "❌ FAILED");
    }
  }

  /**
   * Test 7: Performance
   */
  async testPerformance() {
    console.log("\n7️⃣ Testing Performance...");

    try {
      const startTime = Date.now();
      const result = await this.statusChecker.execute("Performance test");
      const duration = Date.now() - startTime;

      console.log(`   Response Time: ${duration}ms`);
      console.log(`   Performance: ${duration < 5000 ? "✅ GOOD" : "⚠️ SLOW"}`);

      this.addTestResult(
        "Performance",
        duration < 10000 ? "✅ PASSED" : "❌ FAILED"
      );
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
    console.log("\n📊 Status Checker Test Results:");
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
      console.log("🎉 All tests passed! Status checker is working perfectly.");
    } else {
      console.log("⚠️ Some tests failed. Check the configuration and API key.");
    }
  }
}

// Run tests if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("testStatusChecker.js")
) {
  const test = new StatusCheckerTest();
  test.runAllTests().catch(console.error);
}

export default StatusCheckerTest;
