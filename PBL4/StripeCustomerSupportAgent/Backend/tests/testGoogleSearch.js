#!/usr/bin/env node

/**
 * Test script for Google Custom Search API integration
 * Verifies that the web search tool works with Google Custom Search
 */

import WebSearchTool from "../services/mcp-tools/webSearchTool.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class GoogleSearchTest {
  constructor() {
    this.webSearchTool = new WebSearchTool();
    this.testResults = [];
  }

  async runAllTests() {
    console.log("🔍 Testing Google Custom Search Integration\n");

    // Test 1: Check configuration
    await this.testConfiguration();

    // Test 2: Test API connectivity
    await this.testAPIConnectivity();

    // Test 3: Test search functionality
    await this.testSearchFunctionality();

    // Test 4: Test caching
    await this.testCaching();

    // Test 5: Test error handling
    await this.testErrorHandling();

    // Print results
    this.printResults();
  }

  async testConfiguration() {
    console.log("1️⃣ Testing Configuration...");

    const hasApiKey = !!process.env.GOOGLE_SEARCH_API_KEY;
    const hasSearchEngineId = !!process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (hasApiKey && hasSearchEngineId) {
      this.addTestResult(
        "Configuration",
        "✅ Both API key and Search Engine ID are set"
      );
    } else {
      this.addTestResult(
        "Configuration",
        `❌ Missing: API Key: ${hasApiKey}, Search Engine ID: ${hasSearchEngineId}`
      );
    }
  }

  async testAPIConnectivity() {
    console.log("2️⃣ Testing API Connectivity...");

    try {
      const result = await this.webSearchTool.execute("stripe api");

      if (result.success) {
        this.addTestResult("API Connectivity", "✅ API connection successful");
      } else {
        this.addTestResult(
          "API Connectivity",
          `❌ API call failed: ${result.message}`
        );
      }
    } catch (error) {
      this.addTestResult("API Connectivity", `❌ API error: ${error.message}`);
    }
  }

  async testSearchFunctionality() {
    console.log("3️⃣ Testing Search Functionality...");

    const testQueries = [
      "stripe webhooks",
      "stripe payment methods",
      "stripe api documentation",
    ];

    let successCount = 0;

    for (const query of testQueries) {
      try {
        const result = await this.webSearchTool.execute(query);

        if (result.success && result.results && result.results.length > 0) {
          successCount++;
          console.log(
            `   ✅ "${query}" - Found ${result.results.length} results`
          );
        } else {
          console.log(`   ❌ "${query}" - No results found`);
        }
      } catch (error) {
        console.log(`   ❌ "${query}" - Error: ${error.message}`);
      }
    }

    if (successCount === testQueries.length) {
      this.addTestResult(
        "Search Functionality",
        "✅ All test queries returned results"
      );
    } else {
      this.addTestResult(
        "Search Functionality",
        `⚠️ Only ${successCount}/${testQueries.length} queries successful`
      );
    }
  }

  async testCaching() {
    console.log("4️⃣ Testing Caching...");

    const query = "stripe webhooks";

    try {
      // First search (should hit API)
      const start1 = Date.now();
      const result1 = await this.webSearchTool.execute(query);
      const time1 = Date.now() - start1;

      // Second search (should hit cache)
      const start2 = Date.now();
      const result2 = await this.webSearchTool.execute(query);
      const time2 = Date.now() - start2;

      if (time2 < time1 && result1.success && result2.success) {
        this.addTestResult(
          "Caching",
          "✅ Caching is working (second request was faster)"
        );
      } else {
        this.addTestResult("Caching", "⚠️ Caching may not be working properly");
      }
    } catch (error) {
      this.addTestResult("Caching", `❌ Caching test failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log("5️⃣ Testing Error Handling...");

    // Test with invalid query
    try {
      const result = await this.webSearchTool.execute("");

      if (!result.success) {
        this.addTestResult(
          "Error Handling",
          "✅ Handles empty queries gracefully"
        );
      } else {
        this.addTestResult(
          "Error Handling",
          "⚠️ Should handle empty queries better"
        );
      }
    } catch (error) {
      this.addTestResult(
        "Error Handling",
        `❌ Error handling failed: ${error.message}`
      );
    }
  }

  addTestResult(testName, result) {
    this.testResults.push({ testName, result });
  }

  printResults() {
    console.log("\n📊 Test Results Summary:");
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
      console.log("🎉 All tests passed! Google Custom Search is ready to use.");
    } else {
      console.log(
        "⚠️ Some tests failed. Check the setup guide for troubleshooting."
      );
    }
  }
}

// Run tests if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("testGoogleSearch.js")
) {
  const test = new GoogleSearchTest();
  test.runAllTests().catch(console.error);
}

export default GoogleSearchTest;
