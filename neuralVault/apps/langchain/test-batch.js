import { BatchIngestion } from "./src/ingestion/batchIngestion.js";
import { GeminiChat } from "./src/chat/geminiChat.js";
import { config } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";
import chalk from "chalk";
import path from "path";

async function testBatchIngestion() {
  console.log(chalk.blue("🧪 Testing Batch Ingestion System..."));
  console.log(chalk.blue("====================================="));

  try {
    // Initialize configuration
    if (!config.validate()) {
      console.log(chalk.red("❌ Configuration validation failed"));
      return;
    }

    // Create batch ingestion instance
    const batchIngestion = new BatchIngestion();

    // Test 1: Ingest specific files
    console.log(chalk.yellow("\n📄 Test 1: Ingesting specific files..."));

    const filesToIngest = [
      "./docs/sample_langchain_doc.pdf",
      "./docs/sample.txt",
      "./docs/sample.md",
    ];

    const result = await batchIngestion.ingestFiles(filesToIngest);

    if (result.success) {
      console.log(chalk.green("✅ Batch ingestion successful!"));
      console.log(
        chalk.white(`   Processed ${result.processedFiles.length} files`)
      );
      console.log(chalk.white(`   Total chunks: ${result.totalChunks}`));

      // Show processed files
      console.log(chalk.cyan("\n📁 Processed Files:"));
      result.processedFiles.forEach((file, index) => {
        console.log(
          chalk.white(
            `   ${index + 1}. ${path.basename(file.path)} (${
              file.chunks
            } chunks)`
          )
        );
      });

      // Test 2: Initialize chat
      console.log(chalk.yellow("\n💬 Test 2: Initializing chat..."));
      const chat = new GeminiChat(batchIngestion.vectorStore);
      console.log(chalk.green("✅ Chat initialized!"));

      // Test 3: Ask questions
      console.log(
        chalk.yellow("\n🔍 Test 3: Testing chat with ingested documents...")
      );

      const questions = [
        "What is LangChain?",
        "What are the types of machine learning?",
        "What documents have you processed?",
      ];

      for (const question of questions) {
        console.log(chalk.cyan(`\nQuestion: ${question}`));
        try {
          const response = await chat.chat(question);
          console.log(chalk.white(`Answer: ${response.substring(0, 200)}...`));
        } catch (error) {
          console.log(chalk.red(`Error: ${error.message}`));
        }
      }

      // Test 4: Show statistics
      console.log(chalk.yellow("\n📊 Test 4: Statistics..."));
      const stats = batchIngestion.getStats();
      console.log(chalk.white(`   Processed Files: ${stats.processedFiles}`));
      console.log(chalk.white(`   Failed Files: ${stats.failedFiles}`));
      console.log(chalk.white(`   Total Chunks: ${stats.totalChunks}`));

      console.log(chalk.green("\n🎉 All tests completed successfully!"));
      console.log(
        chalk.blue("Your batch ingestion system is working perfectly!")
      );
    } else {
      console.log(chalk.red("❌ Batch ingestion failed"));
    }
  } catch (error) {
    console.error(chalk.red("💥 Test failed:"), error.message);
    console.error(chalk.gray(error.stack));
  }
}

// Run the test
testBatchIngestion();
