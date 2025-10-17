import "dotenv/config";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

async function testClarificationFlow() {
  console.log("🧪 Testing Clarification Flow\n");

  const sessionId = `test-clarification-${Date.now()}`;

  try {
    // Test 1: Normal question (should work fine)
    console.log("Test 1: Normal question");
    console.log("─".repeat(40));

    const response1 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "what is shopify",
      sessionId: sessionId,
    });

    console.log("Response:", response1.data.answer.substring(0, 100) + "...");
    console.log("Needs clarification:", response1.data.needsClarification);
    console.log("✅ Normal question works fine\n");

    // Test 2: Ambiguous question (should ask for clarification)
    console.log("Test 2: Ambiguous question");
    console.log("─".repeat(40));

    const response2 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "how to integrate payment system",
      sessionId: sessionId,
    });

    console.log("Response:", response2.data.answer);
    console.log("Needs clarification:", response2.data.needsClarification);

    if (response2.data.needsClarification) {
      console.log("✅ Clarification request detected\n");

      // Test 3: Clarification response
      console.log("Test 3: Clarification response");
      console.log("─".repeat(40));

      const response3 = await axios.post(`${API_BASE_URL}/clarify`, {
        clarificationResponse: "recurring payments",
        originalQuestion: "how to integrate payment system",
        sessionId: sessionId,
      });

      console.log("Response:", response3.data.answer.substring(0, 100) + "...");
      console.log(
        "Clarification processed:",
        response3.data.multiTurnContext?.clarificationProcessed
      );
      console.log("✅ Clarification response processed\n");
    } else {
      console.log("❌ Expected clarification but didn't get it\n");
    }

    console.log("🎉 Clarification flow test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testClarificationFlow();
