import "dotenv/config";
import { multiTurnManager } from "./multi-turn-conversation.js";

async function testFollowUpDetection() {
  console.log("🔍 Testing Follow-up Detection\n");

  // Test conversation history
  const conversationHistory = [
    {
      role: "user",
      content: "How do I create products using the Shopify API?",
    },
    {
      role: "assistant",
      content:
        "To create products using the Shopify API, you can use the REST Admin API or GraphQL Admin API. Here's how to create a product...",
    },
    { role: "user", content: "What about recurring payments?" },
    {
      role: "assistant",
      content:
        "For recurring payments, you can use Shopify's subscription apps or integrate with third-party services like ReCharge...",
    },
  ];

  // Test various follow-up patterns
  const testCases = [
    {
      message: "What about recurring payments?",
      expected: true,
      description: "Direct follow-up with 'what about'",
    },
    {
      message: "How do I manage inventory for these products?",
      expected: true,
      description: "Follow-up with pronoun reference 'these products'",
    },
    {
      message: "Also, how do I handle shipping?",
      expected: true,
      description: "Follow-up with 'also'",
    },
    {
      message: "But what if I want to customize the checkout?",
      expected: true,
      description: "Follow-up with 'but'",
    },
    {
      message: "How do I create a new store?",
      expected: false,
      description: "New topic (not a follow-up)",
    },
    {
      message: "What is Shopify?",
      expected: false,
      description: "General question (not a follow-up)",
    },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.message}"`);
    console.log(
      `Expected: ${testCase.expected ? "Follow-up" : "Not follow-up"}`
    );

    const result = await multiTurnManager.detectFollowUp(
      testCase.message,
      conversationHistory
    );

    console.log(`Result: ${result.isFollowUp ? "Follow-up" : "Not follow-up"}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Indicators:`, result.indicators);
    console.log(
      `✅ ${result.isFollowUp === testCase.expected ? "PASS" : "FAIL"}`
    );
    console.log("─".repeat(40));
  }

  console.log("🎉 Follow-up detection test completed!");
}

// Run the test
testFollowUpDetection();
