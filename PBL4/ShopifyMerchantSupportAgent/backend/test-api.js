#!/usr/bin/env node

/**
 * API Test Script for Shopify Merchant Support Agent
 * Tests all backend endpoints to ensure they're working correctly
 */

import axios from "axios";
import { performance } from "perf_hooks";

const API_BASE_URL = "http://localhost:3000/api";
const TEST_SESSION_ID = `test_session_${Date.now()}`;

// Test configuration
const tests = [
  {
    name: "Health Check",
    method: "GET",
    url: "http://localhost:3000/health",
    expectedStatus: 200,
    description: "Test server health endpoint",
  },
  {
    name: "API Root",
    method: "GET",
    url: `${API_BASE_URL}/`,
    expectedStatus: 200,
    description: "Test API root endpoint",
  },
  {
    name: "Chat Endpoint",
    method: "POST",
    url: `${API_BASE_URL}/chat`,
    data: {
      message: "How do I create a product in Shopify?",
      sessionId: TEST_SESSION_ID,
    },
    expectedStatus: 200,
    description:
      "Test chat endpoint with MCP tools and multi-turn conversation",
  },
  {
    name: "Conversation History",
    method: "GET",
    url: `${API_BASE_URL}/history/${TEST_SESSION_ID}`,
    expectedStatus: 200,
    description: "Test conversation history retrieval",
  },
  {
    name: "Chat History List",
    method: "GET",
    url: `${API_BASE_URL}/history`,
    expectedStatus: 200,
    description: "Test chat history list endpoint",
  },
  {
    name: "Conversation Stats",
    method: "GET",
    url: `${API_BASE_URL}/stats/${TEST_SESSION_ID}`,
    expectedStatus: 200,
    description: "Test conversation statistics endpoint",
  },
];

// Test clarification endpoint
const clarificationTest = {
  name: "Clarification Endpoint",
  method: "POST",
  url: `${API_BASE_URL}/clarify`,
  data: {
    clarificationResponse: "I want to use the REST API",
    originalQuestion: "How do I create a product?",
    sessionId: TEST_SESSION_ID,
  },
  expectedStatus: 200,
  description: "Test clarification response processing",
};

// Test cleanup endpoint
const cleanupTest = {
  name: "Cleanup Endpoint",
  method: "DELETE",
  url: `${API_BASE_URL}/cleanup/${TEST_SESSION_ID}`,
  expectedStatus: 200,
  description: "Test conversation cleanup endpoint",
};

async function runTest(test) {
  const startTime = performance.now();

  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    console.log(`🔗 URL: ${test.url}`);

    let response;

    if (test.method === "GET") {
      response = await axios.get(test.url);
    } else if (test.method === "POST") {
      response = await axios.post(test.url, test.data);
    } else if (test.method === "DELETE") {
      response = await axios.delete(test.url);
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (response.status === test.expectedStatus) {
      console.log(`✅ PASS - Status: ${response.status} (${duration}ms)`);

      // Log response details for chat endpoint
      if (test.name === "Chat Endpoint" && response.data) {
        console.log(`📊 Response Details:`);
        console.log(
          `   - Answer length: ${response.data.answer?.length || 0} characters`
        );
        console.log(
          `   - Confidence: ${response.data.confidence?.level || "N/A"} (${
            response.data.confidence?.score || 0
          }%)`
        );
        console.log(
          `   - Sources found: ${response.data.sources?.length || 0}`
        );
        console.log(
          `   - MCP Tools used: ${
            response.data.mcpTools?.toolsUsed?.length || 0
          }`
        );
        console.log(
          `   - Multi-turn context: ${
            response.data.multiTurnContext ? "Yes" : "No"
          }`
        );

        if (response.data.mcpTools?.toolsUsed?.length > 0) {
          console.log(
            `   - Tools: ${response.data.mcpTools.toolsUsed.join(", ")}`
          );
        }
      }

      return { success: true, duration, response: response.data };
    } else {
      console.log(
        `❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status} (${duration}ms)`
      );
      return { success: false, duration, error: `Status mismatch` };
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    console.log(`❌ ERROR - ${error.message} (${duration}ms)`);

    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    return { success: false, duration, error: error.message };
  }
}

async function runAllTests() {
  console.log("🚀 Starting API Tests for Shopify Merchant Support Agent");
  console.log("=".repeat(60));

  const results = [];

  // Run basic tests first
  for (const test of tests) {
    const result = await runTest(test);
    results.push({ ...test, result });

    // Wait a bit between tests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Run clarification test if chat was successful
  const chatTest = results.find((r) => r.name === "Chat Endpoint");
  if (chatTest?.result?.success) {
    console.log("\n🔄 Running clarification test...");
    const clarificationResult = await runTest(clarificationTest);
    results.push({ ...clarificationTest, result: clarificationResult });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Run cleanup test
  console.log("\n🧹 Running cleanup test...");
  const cleanupResult = await runTest(cleanupTest);
  results.push({ ...cleanupTest, result: cleanupResult });

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.result?.success).length;
  const failed = results.length - passed;
  const totalDuration = results.reduce(
    (sum, r) => sum + (r.result?.duration || 0),
    0
  );

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`
  );

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.result?.success)
      .forEach((test) => {
        console.log(
          `   - ${test.name}: ${test.result?.error || "Unknown error"}`
        );
      });
  }

  console.log("\n🎯 Next Steps:");
  if (passed === results.length) {
    console.log("   ✅ All tests passed! Your API is working correctly.");
    console.log(
      "   🚀 You can now start the frontend and test the full workflow."
    );
  } else {
    console.log("   🔧 Fix the failing tests before proceeding.");
    console.log("   📝 Check your .env file configuration.");
    console.log("   🗄️  Ensure MongoDB is running and accessible.");
  }

  return results;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, runTest };
