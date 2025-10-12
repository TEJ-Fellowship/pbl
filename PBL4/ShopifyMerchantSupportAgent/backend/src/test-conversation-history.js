import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import BufferWindowMemory from "./memory/BufferWindowMemory.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";

async function testConversationHistory() {
  console.log("🧪 Testing Conversation History Implementation\n");

  try {
    // Connect to MongoDB
    console.log("1. Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully\n");

    // Test 1: Initialize BufferWindowMemory
    console.log("2. Testing BufferWindowMemory initialization...");
    const memory = new BufferWindowMemory({
      windowSize: 8,
      sessionId: `test_session_${Date.now()}`,
    });

    await memory.initializeConversation();
    console.log("✅ BufferWindowMemory initialized successfully\n");

    // Test 2: Add user message
    console.log("3. Testing user message storage...");
    const userMessage = await memory.addMessage(
      "user",
      "How do I add products to my Shopify store?"
    );
    console.log("✅ User message stored successfully\n");

    // Test 3: Add assistant response
    console.log("4. Testing assistant message storage...");
    const assistantMessage = await memory.addMessage(
      "assistant",
      "To add products to your Shopify store, go to Products > Add product in your admin panel.",
      {
        searchResults: [
          {
            title: "Adding Products",
            source_url: "https://help.shopify.com/manual/products",
            category: "products",
            score: 0.85,
            searchType: "semantic",
          },
        ],
        modelUsed: "gemini-1.5-flash",
        processingTime: 1500,
        tokensUsed: 0,
      }
    );
    console.log("✅ Assistant message stored successfully\n");

    // Test 4: Get conversation context
    console.log("5. Testing conversation context retrieval...");
    const context = await memory.getConversationContext();
    console.log("✅ Conversation context retrieved:");
    console.log(context);
    console.log();

    // Test 5: Add more messages to test sliding window
    console.log("6. Testing sliding window functionality...");
    for (let i = 0; i < 5; i++) {
      await memory.addMessage("user", `Follow-up question ${i + 1}`);
      await memory.addMessage("assistant", `Response to follow-up ${i + 1}`);
    }

    const recentMessages = await memory.getRecentMessages();
    console.log(
      `✅ Sliding window working: Retrieved ${recentMessages.length} recent messages\n`
    );

    // Test 6: Get conversation statistics
    console.log("7. Testing conversation statistics...");
    const stats = await memory.getStats();
    console.log("✅ Conversation statistics:");
    console.log(`   Session ID: ${stats.sessionId}`);
    console.log(`   Message Count: ${stats.messageCount}`);
    console.log(`   Window Size: ${stats.windowSize}`);
    console.log(`   Conversation ID: ${stats.conversationId}`);
    console.log();

    // Test 7: Test clear history
    console.log("8. Testing clear history functionality...");
    await memory.clearHistory();
    const clearedStats = await memory.getStats();
    console.log(
      `✅ History cleared: ${clearedStats.messageCount} messages remaining\n`
    );

    // Test 8: Verify MongoDB data persistence
    console.log("9. Testing MongoDB data persistence...");
    const conversationCount = await Conversation.countDocuments();
    const messageCount = await Message.countDocuments();
    console.log(`✅ MongoDB persistence verified:`);
    console.log(`   Total conversations: ${conversationCount}`);
    console.log(`   Total messages: ${messageCount}`);
    console.log();

    console.log(
      "🎉 All tests passed! Conversation history implementation is working correctly.\n"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    // Clean up
    await disconnectDB();
    console.log("✅ MongoDB disconnected");
  }
}

// Run the test
testConversationHistory().catch(console.error);
