import { DocumentProcessor } from "./ingestion/processors/documentProcessor.js";
import { VectorStoreManager } from "./storage/vectorStore.js";
import { GeminiChat } from "./chat/geminiChat.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import chalk from "chalk";

class LangChainApp {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.vectorStore = new VectorStoreManager();
    this.chat = null;
  }

  async initialize(filePath = null) {
    logger.info("🚀 Initializing LangChain Data Ingestion App...");

    // Validate configuration first
    if (!config.validate()) {
      logger.error(
        "Configuration validation failed. Please check your .env file."
      );
      return false;
    }

    config.printConfig();

    try {
      const appConfig = config.getAppConfig();
      const documentPath = filePath || appConfig.defaultDocumentPath;

      // Process document
      const processedDocs = await this.documentProcessor.processPDF(
        documentPath
      );

      // Initialize vector store
      await this.vectorStore.initializeFromDocuments(processedDocs);

      // Initialize chat
      this.chat = new GeminiChat(this.vectorStore);

      logger.success("App initialized successfully!");
      return true;
    } catch (error) {
      logger.error("Initialization failed:", error);
      return false;
    }
  }

  async startInteractiveChat() {
    if (!this.chat) {
      logger.error("Chat not initialized. Please initialize the app first.");
      return;
    }

    logger.info("💬 Starting interactive chat session...");
    console.log(
      chalk.yellow(
        "Type 'quit' to exit, 'history' to see chat history, 'stats' for chat statistics\n"
      )
    );

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
          const history = this.chat.getChatHistory();
          console.log(chalk.cyan("\n📜 Chat History:"));
          history.forEach((entry, index) => {
            console.log(chalk.yellow(`${index + 1}. ${entry.message}`));
            console.log(chalk.white(`   ${entry.response}\n`));
          });
          askQuestion();
          return;
        }

        if (input.toLowerCase() === "stats") {
          const stats = this.chat.getChatStats();
          console.log(chalk.cyan("\n📊 Chat Statistics:"));
          console.log(chalk.white(`Total Messages: ${stats.totalMessages}`));
          console.log(
            chalk.white(`Total Characters: ${stats.totalCharacters}`)
          );
          console.log(
            chalk.white(`Average Message Length: ${stats.averageMessageLength}`)
          );
          console.log(chalk.white(`Oldest Message: ${stats.oldestMessage}`));
          console.log(chalk.white(`Newest Message: ${stats.newestMessage}\n`));
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

  async search(query, k = 4) {
    if (!this.vectorStore.isInitialized()) {
      throw new Error(
        "Vector store not initialized. Please run initialization first."
      );
    }

    return await this.vectorStore.similaritySearch(query, k);
  }

  async chatWithRetrieval(message, options = {}) {
    if (!this.chat) {
      throw new Error("Chat not initialized. Please run initialization first.");
    }

    return await this.chat.chat(message, { useRetrieval: true, ...options });
  }

  async chatWithoutRetrieval(message, options = {}) {
    if (!this.chat) {
      throw new Error("Chat not initialized. Please run initialization first.");
    }

    return await this.chat.chat(message, { useRetrieval: false, ...options });
  }

  getChatHistory() {
    return this.chat ? this.chat.getChatHistory() : [];
  }

  getChatStats() {
    return this.chat ? this.chat.getChatStats() : null;
  }

  clearChatHistory() {
    if (this.chat) {
      this.chat.clearChatHistory();
    }
  }
}

// Main execution
const app = new LangChainApp();

// Example usage
const main = async () => {
  try {
    console.log(chalk.blue("🚀 Starting LangChain Data Ingestion App..."));
    const initialized = await app.initialize();
    if (initialized) {
      await app.startInteractiveChat();
    } else {
      console.log(
        chalk.red(
          "❌ Failed to initialize the app. Please check the error messages above."
        )
      );
      console.log(chalk.yellow("💡 Make sure you have:"));
      console.log(chalk.yellow("   1. Created .env file with GEMINI_API_KEY"));
      console.log(
        chalk.yellow("   2. PDF file exists in ./docs/sample_langchain_doc.pdf")
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("💥 Fatal error occurred:"));
    console.error(chalk.red(error.message));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    console.log(chalk.yellow("\n🔧 Troubleshooting tips:"));
    console.log(chalk.yellow("1. Run 'node debug.js' to check configuration"));
    console.log(chalk.yellow("2. Create .env file: cp env.example .env"));
    console.log(chalk.yellow("3. Add your GEMINI_API_KEY to .env file"));
    console.log(chalk.yellow("4. Ensure PDF file exists in ./docs/"));
    process.exit(1);
  }
};

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1])
) {
  main();
}

export default LangChainApp;
