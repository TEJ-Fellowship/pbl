import "dotenv/config";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

async function testMultiTurnMemory() {
  console.log("🧠 Testing Multi-Turn Conversation Memory\n");

  const sessionId = `test-memory-${Date.now()}`;

  try {
    // Test 1: Initial question about products
    console.log("Test 1: Initial Question");
    console.log("─".repeat(50));

    const response1 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "How do I create products using the Shopify API?",
      sessionId: sessionId,
    });

    console.log("Question: How do I create products using the Shopify API?");
    console.log("Answer:", response1.data.answer.substring(0, 150) + "...");
    console.log("Multi-turn context:", response1.data.multiTurnContext);
    console.log("✅ Initial question processed\n");

    // Test 2: Follow-up question about payments
    console.log("Test 2: Follow-up Question");
    console.log("─".repeat(50));

    const response2 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "What about recurring payments?",
      sessionId: sessionId,
    });

    console.log("Question: What about recurring payments?");
    console.log("Answer:", response2.data.answer.substring(0, 200) + "...");
    console.log("Is Follow-up:", response2.data.multiTurnContext?.isFollowUp);
    console.log(
      "Follow-up Confidence:",
      response2.data.multiTurnContext?.followUpConfidence
    );
    console.log("Turn Count:", response2.data.multiTurnContext?.turnCount);
    console.log("✅ Follow-up question processed\n");

    // Test 3: Another follow-up about inventory
    console.log("Test 3: Another Follow-up");
    console.log("─".repeat(50));

    const response3 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "How do I manage inventory for these products?",
      sessionId: sessionId,
    });

    console.log("Question: How do I manage inventory for these products?");
    console.log("Answer:", response3.data.answer.substring(0, 200) + "...");
    console.log("Is Follow-up:", response3.data.multiTurnContext?.isFollowUp);
    console.log("Turn Count:", response3.data.multiTurnContext?.turnCount);
    console.log(
      "User Preferences:",
      response3.data.multiTurnContext?.userPreferences
    );
    console.log("✅ Inventory follow-up processed\n");

    // Test 4: Check conversation statistics
    console.log("Test 4: Conversation Statistics");
    console.log("─".repeat(50));

    const statsResponse = await axios.get(`${API_BASE_URL}/stats/${sessionId}`);
    console.log(
      "Conversation Stats:",
      JSON.stringify(statsResponse.data, null, 2)
    );
    console.log("✅ Statistics retrieved\n");

    // Test 5: Test context compression (simulate many turns)
    console.log("Test 5: Testing Context Compression");
    console.log("─".repeat(50));

    // Add several more messages to trigger compression
    for (let i = 4; i <= 12; i++) {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: `This is test message ${i} about Shopify features`,
        sessionId: sessionId,
      });
      console.log(
        `Message ${i} - Turn Count: ${response.data.multiTurnContext?.turnCount}`
      );
    }

    // Check if compression happened
    const finalStats = await axios.get(`${API_BASE_URL}/stats/${sessionId}`);
    console.log("Final Stats:", JSON.stringify(finalStats.data, null, 2));
    console.log("✅ Context compression test completed\n");

    console.log("🎉 Multi-turn memory test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testMultiTurnMemory();
