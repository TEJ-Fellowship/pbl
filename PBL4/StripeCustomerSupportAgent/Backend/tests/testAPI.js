import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

/**
 * Test API endpoints
 */
async function testAPI() {
  console.log("🧪 Testing Stripe Support API...");
  console.log("=".repeat(50));

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
    console.log("✅ Health check:", healthResponse.data.status);

    // Test status endpoint
    console.log("\n2. Testing status endpoint...");
    const statusResponse = await axios.get(`${API_BASE_URL}/api/health/status`);
    console.log("✅ System status:", statusResponse.data.status);

    // Test chat endpoint
    console.log("\n3. Testing chat endpoint...");
    const chatResponse = await axios.post(`${API_BASE_URL}/api/chat`, {
      message: "How do I create a payment intent with Stripe?",
      userId: "test_user",
    });
    console.log("✅ Chat response received");
    console.log("   Message length:", chatResponse.data.data.message.length);
    console.log(
      "   Sources count:",
      chatResponse.data.data.sources?.length || 0
    );
    console.log("   Confidence:", chatResponse.data.data.confidence);

    // Test session creation
    console.log("\n4. Testing session creation...");
    const sessionResponse = await axios.post(
      `${API_BASE_URL}/api/chat/session`,
      {
        userId: "test_user",
        context: { test: true },
      }
    );
    console.log("✅ Session created:", sessionResponse.data.data.sessionId);

    // Test history endpoint
    console.log("\n5. Testing history endpoint...");
    const historyResponse = await axios.get(
      `${API_BASE_URL}/api/chat/history/${sessionResponse.data.data.sessionId}`
    );
    console.log(
      "✅ History retrieved:",
      historyResponse.data.data.messages.length,
      "messages"
    );

    console.log("\n🎉 All API tests passed!");
  } catch (error) {
    console.error("❌ API test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith("testAPI.js")) {
  testAPI().catch(console.error);
}

export { testAPI };
