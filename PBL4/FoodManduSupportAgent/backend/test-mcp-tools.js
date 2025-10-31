/**
 * Test Script for MCP Tools
 * Run with: node test-mcp-tools.js
 */

import {
  getOrderStatus,
  getLocationTracking,
  calculateETA,
  getOrderDetails,
  getDriverInfo,
  getProgressTracking,
  getRouteInfo,
} from "./src/mcp/tools/index.js";

const testOrderId = "FM100001"; // Change to a valid order ID from your orders.json

console.log("🧪 Testing MCP Tools...\n");

async function testTool(toolName, tool, args = {}) {
  try {
    console.log(`\n📋 Testing ${toolName}...`);
    console.log(`   Input:`, args);
    const result = await tool.handler(args);
    if (result.success) {
      console.log(`   ✅ Success!`);
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`   ❌ Failed:`, result.error);
    }
    return result.success;
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log(`Using test order ID: ${testOrderId}\n`);
  console.log("=".repeat(60));

  const results = {
    getOrderStatus: await testTool("get_order_status", getOrderStatus, {
      orderId: testOrderId,
    }),
    getLocationTracking: await testTool(
      "get_location_tracking",
      getLocationTracking,
      {
        orderId: testOrderId,
        userLat: 27.71,
        userLng: 85.33,
      }
    ),
    calculateETA: await testTool("calculate_eta", calculateETA, {
      orderId: testOrderId,
    }),
    getOrderDetails: await testTool("get_order_details", getOrderDetails, {
      orderId: testOrderId,
    }),
    getDriverInfo: await testTool("get_driver_info", getDriverInfo, {
      orderId: testOrderId,
    }),
    getProgressTracking: await testTool(
      "get_progress_tracking",
      getProgressTracking,
      {
        orderId: testOrderId,
      }
    ),
    getRouteInfo: await testTool("get_route_info", getRouteInfo, {
      orderId: testOrderId,
      userLat: 27.71,
      userLng: 85.33,
    }),
  };

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results Summary:");
  console.log("=".repeat(60));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([tool, success]) => {
    console.log(`   ${success ? "✅" : "❌"} ${tool}`);
  });

  console.log("=".repeat(60));
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.");
  }
}

runTests().catch(console.error);
