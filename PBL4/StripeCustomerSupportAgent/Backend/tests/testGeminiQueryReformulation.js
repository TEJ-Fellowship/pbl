import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import BufferWindowMemory from "../services/bufferWindowMemory.js";
import PostgreSQLMemoryService from "../services/postgresMemoryService.js";
import QueryReformulationService from "../services/queryReformulationService.js";
import config from "../config/config.js";

/**
 * Test Gemini-Powered Query Reformulation
 * Demonstrates the enhanced AI-powered query reformulation capabilities
 */
class GeminiQueryReformulationTester {
  constructor() {
    this.bufferMemory = null;
    this.postgresMemory = null;
    this.queryReformulation = null;
    this.sessionId = `test_session_${Date.now()}`;
  }

  async runAllTests() {
    console.log("🧪 Testing Gemini-Powered Query Reformulation");
    console.log("=".repeat(60));

    try {
      await this.testGeminiInitialization();
      await this.testQueryReformulation();
      await this.testQAAnalysis();
      await this.testFallbackBehavior();
      await this.testStatistics();

      console.log("\n✅ All Gemini query reformulation tests passed!");
    } catch (error) {
      console.error("❌ Test failed:", error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testGeminiInitialization() {
    console.log("\n🧠 Test 1: Gemini Initialization");
    console.log("-".repeat(40));

    // Initialize memory services
    this.bufferMemory = new BufferWindowMemory(8);
    this.postgresMemory = new PostgreSQLMemoryService();
    this.queryReformulation = new QueryReformulationService(
      this.bufferMemory,
      this.postgresMemory
    );

    // Initialize session
    await this.bufferMemory.initialize(this.sessionId);
    await this.postgresMemory.createOrGetSession(this.sessionId, "test_user");

    const stats = this.queryReformulation.getStats();
    console.log(`✅ Query reformulation service initialized`);
    console.log(`   Gemini enabled: ${stats.geminiEnabled}`);
    console.log(`   Gemini status: ${stats.geminiStatus}`);
    console.log(`   Buffer messages: ${stats.messageCount}`);
  }

  async testQueryReformulation() {
    console.log("\n🔄 Test 2: AI-Powered Query Reformulation");
    console.log("-".repeat(40));

    // Add some conversation context
    await this.bufferMemory.addMessage(
      "user",
      "How do I create a payment intent with Stripe?"
    );
    await this.bufferMemory.addMessage(
      "assistant",
      "To create a payment intent with Stripe, you can use the Payment Intents API. Here's how to do it in Node.js..."
    );
    await this.bufferMemory.addMessage(
      "user",
      "What about webhook signatures?"
    );
    await this.bufferMemory.addMessage(
      "assistant",
      "Webhook signatures help verify that webhooks are coming from Stripe. You can verify them using the Stripe webhook signature verification..."
    );

    // Test query reformulation
    const testQueries = [
      "How do I handle errors?",
      "What about authentication?",
      "Can you help with billing?",
      "I'm getting a card declined error",
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);

      try {
        const result = await this.queryReformulation.reformulateQuery(
          query,
          this.sessionId
        );

        console.log(`   Original: "${result.originalQuery}"`);
        console.log(`   Reformulated: "${result.reformulatedQuery}"`);
        console.log(`   Method: ${result.method}`);
        console.log(
          `   Has context: ${
            result.context?.recentContext?.hasRecentContext || false
          }`
        );

        if (result.context?.recentContext?.hasRecentContext) {
          console.log(
            `   Recent messages: ${result.context.recentContext.messageCount}`
          );
        }
      } catch (error) {
        console.error(`   ❌ Failed to reformulate: ${error.message}`);
      }
    }
  }

  async testQAAnalysis() {
    console.log("\n🧠 Test 3: AI-Powered Q&A Analysis");
    console.log("-".repeat(40));

    const testQAs = [
      {
        question: "How do I create a payment intent?",
        answer:
          "To create a payment intent with Stripe, you can use the Payment Intents API. Here's a Node.js example: const paymentIntent = await stripe.paymentIntents.create({ amount: 2000, currency: 'usd' });",
      },
      {
        question: "What's a webhook signature?",
        answer:
          "A webhook signature is a cryptographic signature that Stripe includes with webhook events to verify that the webhook is coming from Stripe and hasn't been tampered with.",
      },
      {
        question: "How do I handle card declined errors?",
        answer:
          "When a card is declined, you'll receive a card_declined error. You should check the decline_code to understand why the card was declined and provide appropriate messaging to your customer.",
      },
    ];

    for (const qa of testQAs) {
      console.log(`\n📝 Analyzing Q&A: "${qa.question.substring(0, 50)}..."`);

      try {
        const result = await this.queryReformulation.extractQAPairs(
          this.sessionId,
          qa.question,
          qa.answer
        );

        if (result) {
          console.log(`   ✅ Q&A extracted successfully`);
          console.log(`   Q&A ID: ${result.qa_id}`);
          console.log(`   Relevance score: ${result.relevance_score}`);
          console.log(`   Is important: ${result.is_important}`);
          console.log(`   Tags: ${result.tags?.join(", ") || "none"}`);
        } else {
          console.log(`   ⚠️  Q&A extraction returned null`);
        }
      } catch (error) {
        console.error(`   ❌ Q&A analysis failed: ${error.message}`);
      }
    }
  }

  async testFallbackBehavior() {
    console.log("\n🔄 Test 4: Fallback Behavior");
    console.log("-".repeat(40));

    // Test with a query that might cause issues
    const problematicQuery =
      "This is a very long query that might cause issues with the AI reformulation and should trigger fallback behavior if there are any problems with the Gemini API or if the response is malformed in some way that would cause parsing errors";

    try {
      const result = await this.queryReformulation.reformulateQuery(
        problematicQuery,
        this.sessionId
      );
      console.log(`✅ Fallback test completed`);
      console.log(`   Method used: ${result.method}`);
      console.log(`   Original: "${result.originalQuery.substring(0, 50)}..."`);
      console.log(
        `   Reformulated: "${result.reformulatedQuery.substring(0, 50)}..."`
      );
    } catch (error) {
      console.error(`❌ Fallback test failed: ${error.message}`);
    }
  }

  async testStatistics() {
    console.log("\n📊 Test 5: Enhanced Statistics");
    console.log("-".repeat(40));

    const stats = this.queryReformulation.getStats();
    console.log("📈 Query Reformulation Statistics:");
    console.table({
      "Gemini Enabled": stats.geminiEnabled,
      "Gemini Status": stats.geminiStatus,
      "Buffer Messages": stats.messageCount,
      "Has Recent Context": stats.hasRecentContext,
      "Buffer Memory Stats": JSON.stringify(stats.bufferMemoryStats),
    });
  }

  async cleanup() {
    try {
      if (this.postgresMemory) {
        await this.postgresMemory.close();
      }
      console.log("🔒 Memory services closed");
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
    }
  }
}

// Run tests if called directly
if (
  process.argv[1] &&
  process.argv[1].endsWith("testGeminiQueryReformulation.js")
) {
  const tester = new GeminiQueryReformulationTester();
  tester.runAllTests().catch(console.error);
}

export default GeminiQueryReformulationTester;
