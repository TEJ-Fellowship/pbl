import { BatchIngestion } from "./src/ingestion/batchIngestion.js";
import { GeminiChat } from "./src/chat/geminiChat.js";
import { config } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

class BatchChatApp {
  constructor() {
    this.batchIngestion = new BatchIngestion();
    this.chat = null;
  }

  async initialize() {
    logger.info("🚀 Initializing Batch Chat App...");

    // Validate configuration first
    if (!config.validate()) {
      logger.error(
        "Configuration validation failed. Please check your .env file."
      );
      return false;
    }

    config.printConfig();
    return true;
  }

  async ingestDirectory(directoryPath, options = {}) {
    try {
      const result = await this.batchIngestion.ingestDirectory(
        directoryPath,
        options
      );

      if (result.success) {
        // Initialize chat with the vector store
        this.chat = new GeminiChat(this.batchIngestion.vectorStore);
        logger.success("✅ Chat initialized with ingested documents");
        return result;
      } else {
        logger.error("❌ Directory ingestion failed");
        return result;
      }
    } catch (error) {
      logger.error("❌ Directory ingestion failed:", error);
      throw error;
    }
  }

  async ingestFiles(filePaths, options = {}) {
    try {
      const result = await this.batchIngestion.ingestFiles(filePaths, options);

      if (result.success) {
        // Initialize chat with the vector store
        this.chat = new GeminiChat(this.batchIngestion.vectorStore);
        logger.success("✅ Chat initialized with ingested documents");
        return result;
      } else {
        logger.error("❌ File ingestion failed");
        return result;
      }
    } catch (error) {
      logger.error("❌ File ingestion failed:", error);
      throw error;
    }
  }

  async startInteractiveChat() {
    logger.info("💬 Starting interactive session...");

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question(chalk.green("You: "), async (input) => {
        if (input.toLowerCase() === "quit") {
          console.log(chalk.blue("👋 Goodbye!"));
          rl.close();
          return;
        }

        if (input.toLowerCase() === "history") {
          if (!this.chat) {
            console.log(
              chalk.yellow(
                "📜 No chat history available. Please ingest documents first.\n"
              )
            );
          } else {
            const history = this.chat.getChatHistory();
            console.log(chalk.cyan("\n📜 Chat History:"));
            history.forEach((entry, index) => {
              console.log(chalk.yellow(`${index + 1}. ${entry.message}`));
              console.log(chalk.white(`   ${entry.response}\n`));
            });
          }
          askQuestion();
          return;
        }

        if (input.toLowerCase() === "stats") {
          const ingestionStats = this.batchIngestion.getStats();

          console.log(chalk.cyan("\n📄 Ingestion Statistics:"));
          console.log(
            chalk.white(`Processed Files: ${ingestionStats.processedFiles}`)
          );
          console.log(
            chalk.white(`Failed Files: ${ingestionStats.failedFiles}`)
          );
          console.log(
            chalk.white(`Total Chunks: ${ingestionStats.totalChunks}`)
          );

          if (ingestionStats.processedFilesList.length > 0) {
            console.log(chalk.cyan("\n📁 Processed Files:"));
            ingestionStats.processedFilesList.forEach((file, index) => {
              console.log(
                chalk.white(
                  `${index + 1}. ${path.basename(file.path)} (${
                    file.chunks
                  } chunks)`
                )
              );
            });
          }

          if (this.chat) {
            const stats = this.chat.getChatStats();
            console.log(chalk.cyan("\n📊 Chat Statistics:"));
            console.log(chalk.white(`Total Messages: ${stats.totalMessages}`));
            console.log(
              chalk.white(`Total Characters: ${stats.totalCharacters}`)
            );
            console.log(
              chalk.white(
                `Average Message Length: ${stats.averageMessageLength}`
              )
            );
            console.log(chalk.white(`Oldest Message: ${stats.oldestMessage}`));
            console.log(chalk.white(`Newest Message: ${stats.newestMessage}`));
          } else {
            console.log(
              chalk.yellow(
                "\n💬 Chat not initialized. Ingest documents to enable chat features."
              )
            );
          }

          console.log("\n");
          askQuestion();
          return;
        }

        if (input.toLowerCase() === "ingest") {
          await this.handleIngestCommand(rl);
          askQuestion();
          return;
        }

        // Handle regular chat messages
        if (!this.chat) {
          console.log(
            chalk.yellow(
              "💬 Chat not initialized. Please ingest documents first using the 'ingest' command.\n"
            )
          );
          askQuestion();
          return;
        }

        try {
          const response = await this.chat.chat(input);
          console.log(chalk.blue("AI: "), response, "\n");
        } catch (error) {
          logger.error("Chat error:", error);
          console.log(
            chalk.red("❌ Error occurred during chat. Please try again.\n")
          );
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  async handleIngestCommand(rl) {
    console.log(chalk.cyan("\n📁 Ingestion Options:"));
    console.log(chalk.white("1. Ingest directory"));
    console.log(chalk.white("2. Ingest specific files"));
    console.log(chalk.white("3. Cancel"));

    return new Promise((resolve) => {
      rl.question(chalk.yellow("Choose option (1-3): "), async (choice) => {
        if (choice === "1") {
          rl.question(
            chalk.yellow("Enter directory path: "),
            async (dirPath) => {
              try {
                const result = await this.ingestDirectory(dirPath);
                if (result.success) {
                  console.log(
                    chalk.green("✅ Directory ingested successfully!")
                  );
                  console.log(
                    chalk.cyan(
                      "💬 You can now ask questions about the ingested documents.\n"
                    )
                  );
                } else {
                  console.log(chalk.red("❌ Directory ingestion failed"));
                }
              } catch (error) {
                console.log(chalk.red("❌ Error:", error.message));
              }
              resolve();
            }
          );
        } else if (choice === "2") {
          rl.question(
            chalk.yellow("Enter file paths (comma-separated): "),
            async (filePaths) => {
              try {
                const paths = filePaths.split(",").map((p) => p.trim());
                const result = await this.ingestFiles(paths);
                if (result.success) {
                  console.log(chalk.green("✅ Files ingested successfully!"));
                  console.log(
                    chalk.cyan(
                      "💬 You can now ask questions about the ingested documents.\n"
                    )
                  );
                } else {
                  console.log(chalk.red("❌ File ingestion failed"));
                }
              } catch (error) {
                console.log(chalk.red("❌ Error:", error.message));
              }
              resolve();
            }
          );
        } else {
          console.log(chalk.yellow("Ingestion cancelled"));
          resolve();
        }
      });
    });
  }
}

// Main execution
const app = new BatchChatApp();

const main = async () => {
  try {
    console.log(chalk.blue("🚀 Starting Batch Chat App..."));
    const initialized = await app.initialize();

    if (initialized) {
      console.log(chalk.yellow("\n📁 Available commands:"));
      console.log(chalk.white("- 'ingest' to ingest documents"));
      console.log(chalk.white("- 'stats' to see statistics"));
      console.log(chalk.white("- 'history' to see chat history"));
      console.log(chalk.white("- 'quit' to exit"));
      console.log(
        chalk.yellow(
          "\n💡 Start by ingesting documents with 'ingest' command\n"
        )
      );

      await app.startInteractiveChat();
    } else {
      console.log(
        chalk.red(
          "❌ Failed to initialize the app. Please check your .env file."
        )
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("💥 Fatal error occurred:"));
    console.error(chalk.red(error.message));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
};

// Check if this file is being run directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  import.meta.url.includes("batch-chat.js");

if (isMainModule) {
  main();
}

export default BatchChatApp;
