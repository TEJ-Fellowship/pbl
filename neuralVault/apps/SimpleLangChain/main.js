import dotenv from "dotenv";
import { PDFLoader } from "./pdf-loader.js";
import { TextSplitter } from "./text-splitter.js";
import { VectorStore } from "./vector-store.js";
import { Chat } from "./chat.js";
import fs from "fs";

dotenv.config();

class LangChainDemo {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error("❌ GEMINI_API_KEY not found in .env file");
      process.exit(1);
    }
  }

  async run() {
    console.log("🚀 LangChain Demo");
    console.log("=".repeat(30));

    try {
      // Load PDFs
      const documents = await this.loadDocuments();
      if (documents.length === 0) {
        console.log("No PDF files found in ./test/data");
        return;
      }

      // Split into chunks
      const splitter = new TextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
      const chunks = await splitter.splitDocuments(documents);
      console.log(`✅ Created ${chunks.length} chunks`);

      // Create vector store
      const vectorStore = new VectorStore(this.apiKey);
      await vectorStore.addDocuments(chunks);
      console.log("✅ Vector store created");

      // Initialize chat
      const chat = new Chat(vectorStore, this.apiKey);

      // Interactive chat
      await this.interactiveChat(chat);
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }

  async loadDocuments() {
    const dataDir = "./test/data";
    if (!fs.existsSync(dataDir)) {
      console.log("Creating data directory...");
      fs.mkdirSync(dataDir, { recursive: true });
      return [];
    }

    const documents = await PDFLoader.loadFromDirectory(dataDir);
    console.log(`✅ Loaded ${documents.length} PDF documents`);
    return documents;
  }

  async interactiveChat(chat) {
    console.log("\n💬 Chat with your documents!");
    console.log("Type 'quit' to exit\n");

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question("❓ Your question: ", async (question) => {
        if (question.toLowerCase() === "quit") {
          console.log("👋 Goodbye!");
          rl.close();
          return;
        }

        try {
          const answer = await chat.ask(question);
          console.log(`💡 Answer: ${answer}\n`);
        } catch (error) {
          console.error("❌ Error:", error.message);
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

// Run the demo
const demo = new LangChainDemo();
demo.run().catch(console.error);
