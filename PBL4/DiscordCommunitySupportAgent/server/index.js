import inquirer from "inquirer";
import ChatController from "./src/controllers/chatController.js";
import DataController from "./src/controllers/dataController.js";
import fs from "fs-extra";
import Formatters from "./src/utils/formatters.js";

class DiscordSupportBot {
  constructor() {
    this.chatController = new ChatController();
    this.dataController = new DataController();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log("Discord Support RAG Bot - Tier 1");

      // Check if .env file exists
      if (!(await fs.pathExists(".env"))) {
        console.log(
          "No .env file found. Please create one with your Gemini API key."
        );
        console.log("Example .env content:");
        console.log("GEMINI_API_KEY=your_api_key_here");
        console.log("CHROMA_DB_PATH=./chroma_db");
        console.log("SCRAPER_DELAY=1000");
        console.log("MAX_CHUNK_SIZE=700");
        console.log("CHUNK_OVERLAP=50");
        process.exit(1);
      }

      // Initialize controllers
      await this.chatController.initialize();
      await this.dataController.initialize();

      this.isInitialized = true;
      console.log("Bot initialized successfully!");
    } catch (error) {
      console.error(`Initialization failed: ${error.message}`);
      process.exit(1);
    }
  }

  async showMainMenu() {
    try {
      const choices = [
        { name: "💬 Start Chat Session", value: "chat" },
        { name: "🕷️ Scrape Discord Support Pages", value: "scrape" },
        { name: "📊 View Database Stats", value: "stats" },
        { name: "🔍 Search Documents", value: "search" },
        { name: "📜 View Chat History", value: "history" },
        { name: "🗑️ Clear Chat History", value: "clear" },
        { name: "❌ Exit", value: "exit" },
      ];

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: choices,
        },
      ]);

      return action;
    } catch (error) {
      if (error.code === "ERR_USE_AFTER_CLOSE") {
        console.log("\n" + "Interface closed. Exiting...");
        return "exit";
      }
      throw error;
    }
  }

  async startChatSession() {
    console.log("Discord Support Chat Session");
    console.log(
      "Ask me anything about Discord server management, bots, permissions, or moderation!"
    );
    console.log('Type "exit" to return to main menu\n');

    while (true) {
      try {
        const { query } = await inquirer.prompt([
          {
            type: "input",
            name: "query",
            message: "Your question:",
            validate: (input) => {
              if (!input.trim()) {
                return "Please enter a question";
              }
              return true;
            },
          },
        ]);

        if (query.toLowerCase() === "exit") {
          break;
        }

        console.log("\n" + "Processing your question...");

        const result = await this.chatController.handleQuery(query);

        console.log("\n" + result.response + "\n");

        if (result.sources && result.sources.length > 0) {
          console.log("Sources used for this answer:");
          result.sources.forEach((source, index) => {
            console.log(
              `${index + 1}. ${source.title} (${source.relevance}% relevant)`
            );
          });
        }

        console.log("\n" + "─".repeat(50) + "\n");
      } catch (error) {
        if (error.code === "ERR_USE_AFTER_CLOSE") {
          console.log(
            "\n" +
              Formatters.formatInfo(
                "Interface closed. Returning to main menu..."
              )
          );
          break;
        }
        console.error(`Chat error: ${error.message}`);
      }
    }
  }

  async scrapeData() {
    try {
      console.log(Formatters.formatHeader("Scraping Discord Support Data"));

      const result = await this.dataController.scrapeAllData();

      if (result.success) {
        console.log(result.message);

        // Ask if user wants to process the scraped data
        const { processData } = await inquirer.prompt([
          {
            type: "confirm",
            name: "processData",
            message:
              "Would you like to process and store this data in the vector database?",
            default: true,
          },
        ]);

        if (processData) {
          const processResult = await this.dataController.processAndStoreData(
            result.data
          );
          console.log(processResult.message);
        }
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error(`Scraping failed: ${error.message}`);
    }
  }

  async showStats() {
    try {
      console.log("Database Statistics");

      const result = await this.dataController.getDatabaseStats();

      if (result.success) {
        console.log(`Total documents: ${result.stats.totalDocuments}`);
        console.log(`Collection: ${result.stats.collectionName}`);
      } else {
        console.log("Unable to retrieve database statistics");
      }
    } catch (error) {
      console.error(`Failed to get stats: ${error.message}`);
    }
  }

  async searchDocuments() {
    try {
      const { query } = await inquirer.prompt([
        {
          type: "input",
          name: "query",
          message: "Enter search query:",
          validate: (input) => {
            if (!input.trim()) {
              return "Please enter a search query";
            }
            return true;
          },
        },
      ]);

      console.log("Searching documents...");

      const result = await this.dataController.searchDocuments(query, 5);

      if (result.success && result.results.length > 0) {
        console.log(`Found ${result.count} results:`);
        result.results.forEach((doc, index) => {
          console.log(`\n${index + 1}. ${doc.metadata.title}`);
          console.log(`   Relevance: ${Math.round(doc.relevanceScore * 100)}%`);
          console.log(`   Text: ${doc.text.substring(0, 200)}...`);
        });
      } else {
        console.log("No results found");
      }
    } catch (error) {
      console.error(`Search failed: ${error.message}`);
    }
  }

  async showHistory() {
    try {
      const result = await this.chatController.getHistory();

      if (result.success && result.history.length > 0) {
        console.log("Chat History");
        result.history.forEach((entry, index) => {
          console.log(`\n${index + 1}. ${entry.timestamp}`);
          console.log(`   Q: ${entry.query}`);
          console.log(`   A: ${entry.response.substring(0, 100)}...`);
        });
      } else {
        console.log("No chat history available");
      }
    } catch (error) {
      console.error(`Failed to get history: ${error.message}`);
    }
  }

  async clearHistory() {
    try {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Are you sure you want to clear the chat history?",
          default: false,
        },
      ]);

      if (confirm) {
        const result = await this.chatController.clearHistory();
        console.log(result.message);
      }
    } catch (error) {
      console.error(`Failed to clear history: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.initialize();

      while (true) {
        const action = await this.showMainMenu();

        switch (action) {
          case "chat":
            await this.startChatSession();
            break;
          case "scrape":
            await this.scrapeData();
            break;
          case "stats":
            await this.showStats();
            break;
          case "search":
            await this.searchDocuments();
            break;
          case "history":
            await this.showHistory();
            break;
          case "clear":
            await this.clearHistory();
            break;
          case "exit":
            console.log("Goodbye! 👋");
            process.exit(0);
        }

        // Wait for user to continue
        await inquirer.prompt([
          {
            type: "input",
            name: "continue",
            message: "Press Enter to continue...",
          },
        ]);
      }
    } catch (error) {
      console.error(`Application error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Start the application
const bot = new DiscordSupportBot();
bot.run().catch(console.error);
