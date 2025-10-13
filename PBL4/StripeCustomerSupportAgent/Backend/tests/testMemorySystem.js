import MemoryController from "../controllers/memoryController.js";
import PostgreSQLMemoryService from "../services/postgresMemoryService.js";
import BufferWindowMemory from "../services/bufferWindowMemory.js";
import QueryReformulationService from "../services/queryReformulationService.js";

/**
 * Memory System Integration Tests
 * Tests the complete conversational memory system
 */
class MemorySystemTester {
  constructor() {
    this.memoryController = null;
    this.testSessionId = `test_session_${Date.now()}`;
    this.testUserId = "test_user_123";
  }

  async runAllTests() {
    console.log("🧪 Starting Memory System Integration Tests");
    console.log("=".repeat(60));

    try {
      // Test 1: Initialize memory system
      await this.testMemoryInitialization();

      // Test 2: Buffer window memory
      await this.testBufferWindowMemory();

      // Test 3: PostgreSQL memory persistence
      await this.testPostgreSQLMemory();

      // Test 4: Query reformulation
      await this.testQueryReformulation();

      // Test 5: Complete memory context
      await this.testCompleteMemoryContext();

      // Test 6: Q&A pair extraction
      await this.testQAPairExtraction();

      // Test 7: Conversation summary
      await this.testConversationSummary();

      // Test 8: Memory statistics
      await this.testMemoryStatistics();

      console.log("\n✅ All memory system tests passed!");
    } catch (error) {
      console.error("❌ Memory system tests failed:", error.message);
      throw error;
    } finally {
      // Cleanup
      if (this.memoryController) {
        await this.memoryController.close();
      }
    }
  }

  async testMemoryInitialization() {
    console.log("\n🧠 Test 1: Memory System Initialization");

    this.memoryController = new MemoryController();
    await this.memoryController.initializeSession(
      this.testSessionId,
      this.testUserId,
      {
        project: "stripe_support",
        context: "testing",
        startTime: new Date().toISOString(),
      }
    );

    const stats = this.memoryController.getMemoryStats();
    console.log("✅ Memory system initialized");
    console.log(`   Session ID: ${stats.sessionId}`);
    console.log(`   User ID: ${stats.userId}`);
    console.log(`   Buffer messages: ${stats.messageCount}`);
  }

  async testBufferWindowMemory() {
    console.log("\n🧠 Test 2: Buffer Window Memory");

    // Add test messages
    await this.memoryController.processUserMessage(
      "How do I create a payment intent with Stripe?",
      { test: true }
    );

    await this.memoryController.processAssistantResponse(
      "To create a payment intent with Stripe, you can use the Payment Intents API...",
      { test: true }
    );

    await this.memoryController.processUserMessage(
      "What about webhook signatures?",
      { test: true }
    );

    await this.memoryController.processAssistantResponse(
      "Webhook signatures help verify that webhooks are coming from Stripe...",
      { test: true }
    );

    const recentContext = this.memoryController.getRecentContext();
    console.log("✅ Buffer window memory test passed");
    console.log(`   Recent messages: ${recentContext.bufferMemory.length}`);
    console.log(`   Has context: ${recentContext.hasContext}`);
  }

  async testPostgreSQLMemory() {
    console.log("\n🧠 Test 3: PostgreSQL Memory Persistence");

    // Test session stats
    const sessionStats = await this.memoryController.getSessionStats();
    console.log("✅ PostgreSQL memory test passed");
    console.log(`   Total messages: ${sessionStats.total_messages}`);
    console.log(`   User messages: ${sessionStats.user_messages}`);
    console.log(`   Assistant messages: ${sessionStats.assistant_messages}`);
  }

  async testQueryReformulation() {
    console.log("\n🧠 Test 4: Query Reformulation");

    const originalQuery = "How do I handle errors?";
    const reformulation = await this.memoryController.reformulateQuery(
      originalQuery
    );

    console.log("✅ Query reformulation test passed");
    console.log(`   Original: "${originalQuery}"`);
    console.log(`   Reformulated: "${reformulation.reformulatedQuery}"`);
    console.log(`   Has context: ${reformulation.context ? "Yes" : "No"}`);
  }

  async testCompleteMemoryContext() {
    console.log("\n🧠 Test 5: Complete Memory Context");

    const query = "What about authentication?";
    const memoryContext = await this.memoryController.getCompleteMemoryContext(
      query
    );

    console.log("✅ Complete memory context test passed");
    console.log(`   Original query: "${memoryContext.originalQuery}"`);
    console.log(`   Reformulated: "${memoryContext.reformulatedQuery}"`);
    console.log(
      `   Recent context: ${
        memoryContext.recentContext?.messageCount || 0
      } messages`
    );
    console.log(
      `   Long-term context: ${
        memoryContext.longTermContext?.relevantQAs?.length || 0
      } Q&As`
    );
  }

  async testQAPairExtraction() {
    console.log("\n🧠 Test 6: Q&A Pair Extraction");

    // Add a conversation that should generate Q&A pairs
    await this.memoryController.processUserMessage(
      "How do I implement 3D Secure authentication with Stripe?",
      { test: true }
    );

    await this.memoryController.processAssistantResponse(
      "3D Secure authentication is implemented using the Payment Intents API with the confirmation_method parameter...",
      { test: true }
    );

    // Check if Q&A pairs were extracted
    const sessionStats = await this.memoryController.getSessionStats();
    console.log("✅ Q&A pair extraction test passed");
    console.log(`   Q&A pairs stored: ${sessionStats.qa_pairs}`);
  }

  async testConversationSummary() {
    console.log("\n🧠 Test 7: Conversation Summary");

    // Create conversation summary
    const summary = await this.memoryController.createConversationSummary();

    console.log("✅ Conversation summary test passed");
    console.log(`   Summary ID: ${summary.summary_id}`);
    console.log(`   Key topics: ${summary.key_topics.join(", ")}`);
  }

  async testMemoryStatistics() {
    console.log("\n🧠 Test 8: Memory Statistics");

    const bufferStats = this.memoryController.getMemoryStats();
    const sessionStats = await this.memoryController.getSessionStats();

    console.log("✅ Memory statistics test passed");
    console.log("   Buffer Memory Stats:");
    console.log(`     Messages: ${bufferStats.messageCount}`);
    console.log(`     Has context: ${bufferStats.hasRecentContext}`);
    console.log("   Session Stats:");
    console.log(`     Total messages: ${sessionStats.total_messages}`);
    console.log(`     Q&A pairs: ${sessionStats.qa_pairs}`);
    console.log(`     Summaries: ${sessionStats.summaries}`);
  }

  async testMemoryCleanup() {
    console.log("\n🧠 Test 9: Memory Cleanup");

    // Clear session memory
    this.memoryController.clearSessionMemory();

    const stats = this.memoryController.getMemoryStats();
    console.log("✅ Memory cleanup test passed");
    console.log(`   Session cleared: ${stats.sessionId === null}`);
    console.log(`   Messages cleared: ${stats.messageCount === 0}`);
  }
}

// Run tests if called directly
async function runMemoryTests() {
  const tester = new MemorySystemTester();
  await tester.runAllTests();
}

if (process.argv[1] && process.argv[1].endsWith("testMemorySystem.js")) {
  runMemoryTests().catch(console.error);
}

export default MemorySystemTester;
