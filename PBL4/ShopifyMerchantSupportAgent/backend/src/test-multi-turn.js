import "dotenv/config";
import { multiTurnManager } from "./multi-turn-conversation.js";
import { connectDB } from "../config/db.js";

/**
 * Test script for Multi-Turn Conversation Features
 * Demonstrates follow-up handling, clarification, and context compression
 */

async function testMultiTurnConversations() {
  console.log("🧪 Testing Multi-Turn Conversation Features\n");

  try {
    await connectDB();
    console.log("✅ Database connected\n");

    const sessionId = `test-session-${Date.now()}`;
    console.log(`📝 Test Session ID: ${sessionId}\n`);

    // Test 1: Basic conversation with follow-up detection
    console.log("🔍 Test 1: Follow-up Question Detection");
    console.log("─".repeat(50));

    const initialQuestion = "How do I create products using the Shopify API?";
    const followUpQuestion = "What about recurring payments?";

    console.log(`Initial Question: "${initialQuestion}"`);
    console.log(`Follow-up Question: "${followUpQuestion}"\n`);

    // Simulate conversation history
    const conversationHistory = [
      { role: "user", content: initialQuestion },
      {
        role: "assistant",
        content:
          "To create products using the Shopify API, you can use the REST Admin API or GraphQL Admin API...",
      },
    ];

    // Test follow-up detection
    const followUpDetection = await multiTurnManager.detectFollowUp(
      followUpQuestion,
      conversationHistory
    );
    console.log("Follow-up Detection Results:");
    console.log(`  Is Follow-up: ${followUpDetection.isFollowUp}`);
    console.log(`  Confidence: ${followUpDetection.confidence}`);
    console.log(
      `  Indicators: ${JSON.stringify(followUpDetection.indicators, null, 2)}\n`
    );

    // Test 2: Ambiguity detection and clarification
    console.log("🔍 Test 2: Ambiguity Detection and Clarification");
    console.log("─".repeat(50));

    const ambiguousQuestion = "How do I integrate payments?";
    console.log(`Ambiguous Question: "${ambiguousQuestion}"\n`);

    const ambiguityDetection = await multiTurnManager.detectAmbiguity(
      ambiguousQuestion,
      []
    );
    console.log("Ambiguity Detection Results:");
    console.log(
      `  Needs Clarification: ${ambiguityDetection.needsClarification}`
    );
    console.log(
      `  Clarification Question: ${ambiguityDetection.clarificationQuestion}`
    );
    console.log(
      `  Detected Ambiguities: ${JSON.stringify(
        ambiguityDetection.ambiguities,
        null,
        2
      )}\n`
    );

    // Test 3: User preference extraction
    console.log("🔍 Test 3: User Preference Extraction");
    console.log("─".repeat(50));

    const preferenceQuestion =
      "I'm using the GraphQL Admin API for advanced integrations";
    console.log(`Preference Question: "${preferenceQuestion}"\n`);

    const userPreferences = await multiTurnManager.extractUserPreferences(
      preferenceQuestion,
      []
    );
    console.log("User Preferences Extracted:");
    console.log(`  Preferred API: ${userPreferences.preferredAPI}`);
    console.log(`  Technical Level: ${userPreferences.technicalLevel}`);
    console.log(`  Topics: ${Array.from(userPreferences.topics).join(", ")}\n`);

    // Test 4: Context compression
    console.log("🔍 Test 4: Context Compression");
    console.log("─".repeat(50));

    const longConversationHistory = [
      { role: "user", content: "What is Shopify?" },
      {
        role: "assistant",
        content: "Shopify is a comprehensive e-commerce platform...",
      },
      { role: "user", content: "How do I create products?" },
      {
        role: "assistant",
        content: "You can create products through the admin panel or API...",
      },
      { role: "user", content: "What about inventory management?" },
      {
        role: "assistant",
        content:
          "Inventory management in Shopify includes tracking stock levels...",
      },
      { role: "user", content: "How do I handle orders?" },
      {
        role: "assistant",
        content:
          "Order management involves processing, fulfillment, and shipping...",
      },
      { role: "user", content: "What about customer management?" },
      {
        role: "assistant",
        content:
          "Customer management includes profiles, segmentation, and communication...",
      },
      { role: "user", content: "How do I customize themes?" },
      {
        role: "assistant",
        content:
          "Theme customization involves editing Liquid templates and CSS...",
      },
      { role: "user", content: "What about app development?" },
      {
        role: "assistant",
        content:
          "App development involves creating Shopify apps using various APIs...",
      },
      { role: "user", content: "How do I integrate with external services?" },
      {
        role: "assistant",
        content:
          "External integrations can be done through webhooks, APIs, and apps...",
      },
      { role: "user", content: "What about analytics and reporting?" },
      {
        role: "assistant",
        content:
          "Analytics and reporting provide insights into store performance...",
      },
      { role: "user", content: "How do I optimize my store?" },
      {
        role: "assistant",
        content:
          "Store optimization involves SEO, performance, and conversion optimization...",
      },
    ];

    console.log(
      `Compressing conversation with ${longConversationHistory.length} messages...\n`
    );

    const compressionResult =
      await multiTurnManager.compressConversationContext(
        longConversationHistory,
        {
          userPreferences: {
            preferredAPI: "graphql",
            technicalLevel: "advanced",
            topics: new Set([
              "products",
              "orders",
              "customers",
              "themes",
              "apps",
            ]),
          },
          turnCount: 20,
          lastCompressionTurn: 0,
        }
      );

    console.log("Context Compression Results:");
    console.log(`  Summary: ${compressionResult.summary}`);
    console.log(`  Compressed At: ${compressionResult.compressedAt}`);
    console.log(
      `  Original Turn Count: ${compressionResult.originalTurnCount}\n`
    );

    // Test 5: Enhanced context building
    console.log("🔍 Test 5: Enhanced Context Building");
    console.log("─".repeat(50));

    const testMessage = "What about recurring payments?";
    console.log(`Test Message: "${testMessage}"\n`);

    const enhancedContext = await multiTurnManager.buildEnhancedContext(
      testMessage,
      sessionId,
      conversationHistory,
      [] // Empty search results for testing
    );

    console.log("Enhanced Context Results:");
    console.log(`  Contextual Query: ${enhancedContext.contextualQuery}`);
    console.log(`  Turn Count: ${enhancedContext.conversationState.turnCount}`);
    console.log(
      `  Is Follow-up: ${enhancedContext.followUpDetection.isFollowUp}`
    );
    console.log(`  Needs Clarification: ${enhancedContext.needsClarification}`);
    console.log(
      `  User Preferences: ${JSON.stringify(
        enhancedContext.conversationState.userPreferences,
        null,
        2
      )}\n`
    );

    // Test 6: Conversation state management
    console.log("🔍 Test 6: Conversation State Management");
    console.log("─".repeat(50));

    const conversationStats = multiTurnManager.getConversationStats(sessionId);
    console.log("Conversation Statistics:");
    console.log(`  Turn Count: ${conversationStats.turnCount}`);
    console.log(
      `  Last Compression Turn: ${conversationStats.lastCompressionTurn}`
    );
    console.log(
      `  Has Context Summary: ${conversationStats.hasContextSummary}`
    );
    console.log(
      `  User Preferences: ${JSON.stringify(
        conversationStats.userPreferences,
        null,
        2
      )}\n`
    );

    // Test 7: Cleanup
    console.log("🔍 Test 7: State Cleanup");
    console.log("─".repeat(50));

    multiTurnManager.cleanupConversationState(sessionId);
    console.log("✅ Conversation state cleaned up\n");

    console.log("🎉 All Multi-Turn Conversation Tests Completed Successfully!");
    console.log("\n📋 Test Summary:");
    console.log("✅ Follow-up question detection");
    console.log("✅ Ambiguity detection and clarification");
    console.log("✅ User preference extraction");
    console.log("✅ Context compression");
    console.log("✅ Enhanced context building");
    console.log("✅ Conversation state management");
    console.log("✅ State cleanup");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the tests
testMultiTurnConversations()
  .then(() => {
    console.log("\n👋 Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
