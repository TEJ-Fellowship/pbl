import { DocumentProcessor } from "./src/ingestion/processors/documentProcessor.js";
import { VectorStoreManager } from "./src/storage/vectorStore.js";
import { GeminiChat } from "./src/chat/geminiChat.js";
import { config } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";
import chalk from "chalk";

console.log(chalk.blue("🚀 Testing LangChain App Startup..."));

async function testStartup() {
  try {
    console.log(chalk.yellow("1. Testing configuration..."));
    if (!config.validate()) {
      console.log(chalk.red("❌ Configuration validation failed"));
      return;
    }
    console.log(chalk.green("✅ Configuration valid"));

    console.log(chalk.yellow("2. Testing document processor..."));
    const documentProcessor = new DocumentProcessor();
    console.log(chalk.green("✅ Document processor created"));

    console.log(chalk.yellow("3. Testing vector store..."));
    const vectorStore = new VectorStoreManager();
    console.log(chalk.green("✅ Vector store created"));

    console.log(chalk.yellow("4. Testing chat..."));
    const chat = new GeminiChat(vectorStore);
    console.log(chalk.green("✅ Chat created"));

    console.log(chalk.green("🎉 All components working!"));
    console.log(chalk.blue("Now testing document processing..."));

    const processedDocs = await documentProcessor.processPDF(
      "./docs/sample_langchain_doc.pdf"
    );
    console.log(chalk.green(`✅ Processed ${processedDocs.length} documents`));

    await vectorStore.initializeFromDocuments(processedDocs);
    console.log(chalk.green("✅ Vector store initialized"));

    console.log(chalk.green("🎉 Ready to start chat!"));
    console.log(chalk.blue("Starting interactive chat..."));

    // Start interactive chat
    await startChat(chat);
  } catch (error) {
    console.error(chalk.red("💥 Error during startup:"));
    console.error(chalk.red(error.message));
    console.error(chalk.gray(error.stack));
  }
}

async function startChat(chat) {
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
        const history = chat.getChatHistory();
        console.log(chalk.cyan("\n📜 Chat History:"));
        history.forEach((entry, index) => {
          console.log(chalk.yellow(`${index + 1}. ${entry.message}`));
          console.log(chalk.white(`   ${entry.response}\n`));
        });
        askQuestion();
        return;
      }

      if (input.toLowerCase() === "stats") {
        const stats = chat.getChatStats();
        console.log(chalk.cyan("\n📊 Chat Statistics:"));
        console.log(chalk.white(`Total Messages: ${stats.totalMessages}`));
        console.log(chalk.white(`Total Characters: ${stats.totalCharacters}`));
        console.log(
          chalk.white(`Average Message Length: ${stats.averageMessageLength}`)
        );
        console.log(chalk.white(`Oldest Message: ${stats.oldestMessage}`));
        console.log(chalk.white(`Newest Message: ${stats.newestMessage}\n`));
        askQuestion();
        return;
      }

      try {
        const response = await chat.chat(input);
        console.log(chalk.blue("AI: "), response, "\n");
      } catch (error) {
        console.log(
          chalk.red("❌ Error occurred during chat. Please try again.\n")
        );
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Run the test
testStartup();
