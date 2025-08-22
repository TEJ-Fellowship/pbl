import LangChainApp from "./index.js";
import { logger } from "./utils/logger.js";
import chalk from "chalk";

const testApp = async () => {
  const app = new LangChainApp();

  logger.info("🧪 Running LangChain App Test...");

  try {
    // Test initialization
    const initialized = await app.initialize();
    if (!initialized) {
      logger.error("❌ App initialization failed");
      return;
    }

    logger.success("✅ App initialized successfully");

    // Test similarity search
    logger.info("🔍 Testing similarity search...");
    const searchResults = await app.search("What is LangChain?", 2);
    console.log(chalk.green("✅ Similarity search results:"));
    searchResults.forEach((result, index) => {
      console.log(chalk.cyan(`${index + 1}. Score: ${result.score || "N/A"}`));
      console.log(
        chalk.white(`   Content: ${result.pageContent.substring(0, 100)}...`)
      );
      console.log(
        chalk.gray(`   Metadata: ${JSON.stringify(result.metadata)}\n`)
      );
    });

    // Test chat with retrieval
    logger.info("💬 Testing chat with retrieval...");
    const chatResponse = await app.chatWithRetrieval("What is LangChain?");
    console.log(chalk.green("✅ Chat response:"));
    console.log(chalk.white(chatResponse), "\n");

    // Test chat without retrieval
    logger.info("💬 Testing chat without retrieval...");
    const generalResponse = await app.chatWithoutRetrieval(
      "What is artificial intelligence?"
    );
    console.log(chalk.green("✅ General chat response:"));
    console.log(chalk.white(generalResponse), "\n");

    // Test chat statistics
    const stats = app.getChatStats();
    console.log(chalk.green("✅ Chat statistics:"));
    console.log(chalk.white(JSON.stringify(stats, null, 2)), "\n");

    logger.success("🎉 All tests completed successfully!");
  } catch (error) {
    logger.error("❌ Test failed:", error);
  }
};

// Run tests
testApp().catch(console.error);
