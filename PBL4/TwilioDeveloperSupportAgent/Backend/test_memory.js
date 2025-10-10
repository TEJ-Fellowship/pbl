// backend/test_memory.js
import ConversationMemory from "./src/conversationMemory.js";
import APIDetector from "./src/apiDetector.js";
import chalk from "chalk";

/**
 * Test script for the conversation memory system
 *
 * This script demonstrates:
 * - Memory initialization and persistence
 * - API detection capabilities
 * - Language preference tracking
 * - Conversation context management
 * - Memory statistics and insights
 */

async function testMemorySystem() {
  console.log(chalk.bold.blue("🧠 Testing Conversation Memory System"));
  console.log(chalk.gray("=".repeat(50)));

  try {
    // Initialize memory system
    console.log("\n1. Initializing Memory System...");
    const memory = new ConversationMemory("test-session");
    const apiDetector = new APIDetector();

    const initialized = await memory.initialize();
    if (!initialized) {
      throw new Error("Failed to initialize memory system");
    }
    console.log(chalk.green("✅ Memory system initialized"));

    // Test API detection
    console.log("\n2. Testing API Detection...");
    const testQueries = [
      "How do I send an SMS message in Node.js?",
      "I need to make a voice call using Python",
      "How to create a video room for a meeting?",
      "What's the error code 30001 for?",
      "How to verify a phone number with Twilio?",
      "I want to use WhatsApp Business API",
    ];

    testQueries.forEach((query, index) => {
      console.log(`\n   Query ${index + 1}: "${query}"`);
      const detection = apiDetector.detectAPI(query);

      if (detection.primary) {
        console.log(
          chalk.cyan(
            `   → Detected API: ${detection.primary.api.toUpperCase()}`
          )
        );
        console.log(
          chalk.gray(
            `   → Confidence: ${(detection.primary.confidence * 100).toFixed(
              1
            )}%`
          )
        );
        console.log(
          chalk.gray(`   → Reasons: ${detection.primary.reasons.join(", ")}`)
        );
      } else {
        console.log(chalk.yellow("   → No specific API detected"));
      }
    });

    // Test language detection
    console.log("\n3. Testing Language Detection...");
    const languageQueries = [
      "How to send SMS in Python?",
      "I need Node.js code for voice calls",
      "Show me PHP examples for video rooms",
      "Java implementation for phone verification",
    ];

    languageQueries.forEach((query, index) => {
      console.log(`\n   Query ${index + 1}: "${query}"`);
      // We'll use the detectQueryLanguage function from chat.js
      const language = detectQueryLanguage(query);
      if (language) {
        console.log(chalk.cyan(`   → Detected Language: ${language}`));
      } else {
        console.log(chalk.yellow("   → No specific language detected"));
      }
    });

    // Simulate conversation turns
    console.log("\n4. Simulating Conversation Turns...");
    const conversationTurns = [
      {
        query: "How do I send an SMS in Node.js?",
        response:
          "To send an SMS in Node.js, you can use the Twilio Node.js library...",
        metadata: { language: "javascript", api: "sms", errorCodes: [] },
      },
      {
        query: "What about error handling?",
        response:
          "For error handling in SMS, you should catch TwilioError exceptions...",
        metadata: { language: "javascript", api: "sms", errorCodes: [] },
      },
      {
        query: "How do I check delivery status?",
        response:
          "You can check SMS delivery status using webhooks or the StatusCallback parameter...",
        metadata: { language: "javascript", api: "sms", errorCodes: [] },
      },
      {
        query: "What's error 30001?",
        response: "Error 30001 is a 'Message body is required' error...",
        metadata: { language: "javascript", api: "sms", errorCodes: ["30001"] },
      },
    ];

    for (let i = 0; i < conversationTurns.length; i++) {
      const turn = conversationTurns[i];
      console.log(`\n   Turn ${i + 1}: "${turn.query}"`);

      await memory.addConversationTurn(
        turn.query,
        turn.response,
        turn.metadata
      );

      // Update preferences
      if (turn.metadata.language) {
        await memory.updateLanguagePreference(turn.metadata.language);
      }
      if (turn.metadata.api) {
        await memory.updateAPIPreference(turn.metadata.api);
      }

      console.log(chalk.green(`   ✅ Added to memory`));
    }

    // Test context generation
    console.log("\n5. Testing Context Generation...");
    const context = memory.getConversationContext();
    console.log("   User Preferences:", context.userPreferences);
    console.log("   Recent Topics:", context.topics);
    console.log("   Common Error Codes:", context.commonErrorCodes);
    console.log("   Language Patterns:", context.languagePatterns);
    console.log("   Session Duration:", context.sessionDuration, "minutes");

    // Test context prompt generation
    console.log("\n6. Testing Context Prompt Generation...");
    const testQuery = "How do I handle webhooks?";
    const contextPrompt = memory.generateContextPrompt(testQuery);
    console.log("   Context Prompt:");
    console.log(chalk.gray(contextPrompt));

    // Test memory statistics
    console.log("\n7. Memory Statistics...");
    const stats = memory.getMemoryStats();
    console.log("   Session ID:", stats.sessionId);
    console.log("   Conversation Turns:", stats.conversationTurns);
    console.log("   Session Duration:", stats.sessionDuration, "minutes");
    console.log("   Total Sessions:", stats.totalSessions);

    // Test API relationships
    console.log("\n8. Testing API Relationships...");
    const smsRelated = apiDetector.getRelatedAPIs("sms");
    console.log("   SMS related APIs:", smsRelated);

    const voiceRelated = apiDetector.getRelatedAPIs("voice");
    console.log("   Voice related APIs:", voiceRelated);

    const areRelated = apiDetector.areAPIsRelated("sms", "messaging");
    console.log("   Are SMS and messaging related?", areRelated);

    // Test API suggestions
    console.log("\n9. Testing API Suggestions...");
    const smsSuggestions = apiDetector.getAPISuggestions("sms");
    console.log("   SMS suggestions:", smsSuggestions);

    console.log(
      chalk.green("\n✅ All memory system tests completed successfully!")
    );
  } catch (error) {
    console.error(chalk.red("❌ Memory system test failed:"), error.message);
    console.error(error.stack);
  }
}

// Simple language detection function (copied from chat.js)
function detectQueryLanguage(query) {
  const q = query.toLowerCase();
  if (/\b(python|py|pip|flask|django)\b/.test(q)) return "python";
  if (/\b(node|nodejs|npm|express|javascript|js)\b/.test(q))
    return "javascript";
  if (/\b(php|composer|laravel)\b/.test(q)) return "php";
  if (/\b(java|maven|gradle)\b/.test(q)) return "java";
  if (/\b(csharp|c#|dotnet|\.net)\b/.test(q)) return "csharp";
  if (/\b(curl|bash|shell|cli)\b/.test(q)) return "bash";
  return null;
}

// Run the test
if (process.argv[1] && process.argv[1].endsWith("test_memory.js")) {
  testMemorySystem().catch(console.error);
}

export { testMemorySystem };
