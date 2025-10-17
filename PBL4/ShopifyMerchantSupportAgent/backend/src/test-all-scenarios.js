import "dotenv/config";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

async function testAllScenarios() {
  console.log("🧪 Testing All Clarification Scenarios\n");

  const sessionId = `test-all-${Date.now()}`;

  try {
    // Test 1: Product creation (should NOT need clarification)
    console.log("Test 1: Product Creation");
    console.log("─".repeat(40));

    const response1 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "How do I create products using the Shopify API?",
      sessionId: sessionId,
    });

    console.log("Question: How do I create products using the Shopify API?");
    console.log("Needs clarification:", response1.data.needsClarification);
    console.log("Answer:", response1.data.answer.substring(0, 100) + "...");

    if (response1.data.needsClarification) {
      console.log("❌ FAIL: Should not need clarification");
    } else {
      console.log("✅ PASS: No clarification needed");
    }

    // Test 2: API comparison (should need clarification)
    console.log("\nTest 2: API Comparison");
    console.log("─".repeat(40));

    const response2 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "Which API should I use?",
      sessionId: sessionId,
    });

    console.log("Question: Which API should I use?");
    console.log("Needs clarification:", response2.data.needsClarification);
    console.log("Answer:", response2.data.answer);

    if (response2.data.needsClarification) {
      console.log("✅ PASS: Clarification needed");

      // Test 3: Process clarification
      console.log("\nTest 3: Process Clarification");
      console.log("─".repeat(40));

      const response3 = await axios.post(`${API_BASE_URL}/clarify`, {
        clarificationResponse: "REST Admin API",
        originalQuestion: "Which API should I use?",
        sessionId: sessionId,
      });

      console.log("Clarification: REST Admin API");
      console.log("Answer:", response3.data.answer.substring(0, 150) + "...");
      console.log(
        "Clarification processed:",
        response3.data.multiTurnContext?.clarificationProcessed
      );

      if (
        response3.data.multiTurnContext?.clarificationProcessed &&
        !response3.data.answer.includes("Are you asking about")
      ) {
        console.log("✅ PASS: Clarification processed correctly");
      } else {
        console.log("❌ FAIL: Clarification not processed properly");
      }
    } else {
      console.log("❌ FAIL: Should need clarification");
    }

    // Test 4: Payment integration (should need clarification)
    console.log("\nTest 4: Payment Integration");
    console.log("─".repeat(40));

    const response4 = await axios.post(`${API_BASE_URL}/chat`, {
      message: "How do I integrate payment system?",
      sessionId: sessionId,
    });

    console.log("Question: How do I integrate payment system?");
    console.log("Needs clarification:", response4.data.needsClarification);
    console.log("Answer:", response4.data.answer);

    if (response4.data.needsClarification) {
      console.log("✅ PASS: Clarification needed");

      // Test 5: Process payment clarification
      console.log("\nTest 5: Process Payment Clarification");
      console.log("─".repeat(40));

      const response5 = await axios.post(`${API_BASE_URL}/clarify`, {
        clarificationResponse: "recurring payments",
        originalQuestion: "How do I integrate payment system?",
        sessionId: sessionId,
      });

      console.log("Clarification: recurring payments");
      console.log("Answer:", response5.data.answer.substring(0, 150) + "...");

      if (
        response5.data.multiTurnContext?.clarificationProcessed &&
        response5.data.answer.includes("recurring payments") &&
        !response5.data.answer.includes("Are you asking about")
      ) {
        console.log("✅ PASS: Payment clarification processed correctly");
      } else {
        console.log("❌ FAIL: Payment clarification not processed properly");
      }
    } else {
      console.log("❌ FAIL: Should need clarification");
    }

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the tests
testAllScenarios();
