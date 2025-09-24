import dotenv from "dotenv";
import { PDFLoader } from "./pdf-loader.js";
import { TextSplitter } from "./text-splitter.js";
import { VectorStore } from "./vector-store.js";
import { Chat } from "./chat.js";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

/**
 * Simple LangChain Demo - Demonstrates essential concepts
 *
 * This application shows:
 * 1. Document Loading (PDF)
 * 2. Text Chunking
 * 3. Embeddings (Gemini)
 * 4. Vector Storage
 * 5. Semantic Search
 * 6. RAG (Retrieval-Augmented Generation)
 */
class SimpleLangChainDemo {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.vectorStore = null;
    this.chat = null;

    if (!this.apiKey) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      console.log(
        "Please create a .env file with: GEMINI_API_KEY=your_api_key_here"
      );
      process.exit(1);
    }
  }

  /**
   * Main demonstration function
   */
  async run() {
    console.log("🚀 SIMPLE LANGCHAIN DEMONSTRATION");
    console.log("=".repeat(60));
    console.log(
      "This demo shows the essential concepts of LangChain with Gemini"
    );
    console.log("");

    try {
      // Step 1: Load PDF documents
      await this.loadDocuments();

      // Step 2: Demonstrate text chunking
      await this.demonstrateChunking();

      // Step 3: Create embeddings and vector store
      await this.createVectorStore();

      // Step 4: Demonstrate semantic search
      await this.demonstrateSearch();

      // Step 5: Demonstrate RAG chat
      await this.demonstrateChat();

      // Step 6: Interactive chat session
      await this.interactiveChat();
    } catch (error) {
      console.error("❌ Demo failed:", error.message);
    }
  }

  /**
   * Step 1: Load PDF documents
   */
  async loadDocuments() {
    console.log("\n📄 STEP 1: DOCUMENT LOADING");
    console.log("=".repeat(50));

    // Check if we have a data directory with PDFs
    const dataDir = "./test/data";
    if (!fs.existsSync(dataDir)) {
      console.log("📁 Creating sample data directory...");
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("⚠️  Please add some PDF files to the ./test/data directory");
      console.log("   You can download sample PDFs or add your own documents");
      return [];
    }

    const documents = await PDFLoader.loadFromDirectory(dataDir);

    if (documents.length === 0) {
      console.log("⚠️  No PDF files found in ./test/data directory");
      console.log("   Please add some PDF files to continue the demo");
      return [];
    }

    console.log(`✅ Loaded ${documents.length} PDF documents`);
    this.documents = documents;
    return documents;
  }

  /**
   * Step 2: Demonstrate text chunking
   */
  async demonstrateChunking() {
    console.log("\n✂️ STEP 2: TEXT CHUNKING");
    console.log("=".repeat(50));
    console.log(
      "Chunking breaks large documents into smaller pieces for better processing"
    );

    if (!this.documents || this.documents.length === 0) {
      console.log("⚠️  No documents to chunk. Please add PDF files first.");
      return [];
    }

    const splitter = new TextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Demonstrate chunking on the first document
    const chunks = await splitter.demonstrateChunking(this.documents[0]);

    // Chunk all documents
    this.chunks = await splitter.splitDocuments(this.documents);

    console.log(
      `✅ Created ${this.chunks.length} chunks from ${this.documents.length} documents`
    );
    return this.chunks;
  }

  /**
   * Step 3: Create vector store with embeddings
   */
  async createVectorStore() {
    console.log("\n🔮 STEP 3: EMBEDDINGS & VECTOR STORE");
    console.log("=".repeat(50));
    console.log(
      "Embeddings convert text into numerical vectors for semantic search"
    );

    if (!this.chunks || this.chunks.length === 0) {
      console.log(
        "⚠️  No chunks available. Please load and chunk documents first."
      );
      return;
    }

    this.vectorStore = new VectorStore(this.apiKey);

    // Demonstrate embeddings first
    await this.vectorStore.demonstrateEmbeddings();

    // Create vector store
    await this.vectorStore.addDocuments(this.chunks);

    console.log("✅ Vector store created successfully!");
    console.log(
      "🧠 Each document chunk is now represented as a high-dimensional vector"
    );
  }

  /**
   * Step 4: Demonstrate semantic search
   */
  async demonstrateSearch() {
    console.log("\n🔍 STEP 4: SEMANTIC SEARCH");
    console.log("=".repeat(50));
    console.log(
      "Semantic search finds relevant content based on meaning, not just keywords"
    );

    if (!this.vectorStore) {
      console.log("⚠️  Vector store not initialized. Please create it first.");
      return;
    }

    const searchQueries = [
      "What is the main topic?",
      "Tell me about key concepts",
      "What are the important points?",
    ];

    for (const query of searchQueries) {
      console.log(`\n🔎 Searching for: "${query}"`);
      await this.vectorStore.searchWithScores(query, 2);
    }
  }

  /**
   * Step 5: Demonstrate RAG chat
   */
  async demonstrateChat() {
    console.log("\n💬 STEP 5: RAG CHAT");
    console.log("=".repeat(50));
    console.log(
      "RAG combines retrieval (finding relevant info) with generation (creating responses)"
    );

    if (!this.vectorStore) {
      console.log("⚠️  Vector store not initialized. Please create it first.");
      return;
    }

    this.chat = new Chat(this.vectorStore, this.apiKey);

    const demoQuestions = [
      "What is this document about?",
      "What are the key points mentioned?",
      "Can you summarize the main content?",
    ];

    for (const question of demoQuestions) {
      console.log(`\n❓ Question: ${question}`);
      const answer = await this.chat.ask(question);
      console.log(`💡 Answer: ${answer}`);
    }
  }

  /**
   * Step 6: Interactive chat session
   */
  async interactiveChat() {
    console.log("\n🎯 STEP 6: INTERACTIVE CHAT");
    console.log("=".repeat(50));
    console.log("Now you can ask questions about your documents!");
    console.log('Type "quit" to exit, "help" for commands');

    if (!this.chat) {
      console.log(
        "⚠️  Chat not initialized. Please complete previous steps first."
      );
      return;
    }

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question("\n❓ Your question: ", async (question) => {
        if (question.toLowerCase() === "quit") {
          console.log("👋 Goodbye!");
          rl.close();
          return;
        }

        if (question.toLowerCase() === "help") {
          console.log("\n📋 Available commands:");
          console.log("  - Ask any question about your documents");
          console.log('  - "demo" - Show RAG demonstration');
          console.log('  - "compare" - Compare RAG vs simple chat');
          console.log('  - "search <query>" - Perform semantic search');
          console.log('  - "stats" - Show system statistics');
          console.log('  - "quit" - Exit the application');
          askQuestion();
          return;
        }

        if (question.toLowerCase() === "demo") {
          await this.chat.demonstrateRAG("What is this document about?");
          askQuestion();
          return;
        }

        if (question.toLowerCase() === "compare") {
          await this.chat.compareRAGvsSimple("What is this document about?");
          askQuestion();
          return;
        }

        if (question.startsWith("search ")) {
          const searchQuery = question.substring(7);
          await this.vectorStore.searchWithScores(searchQuery, 3);
          askQuestion();
          return;
        }

        if (question.toLowerCase() === "stats") {
          const stats = this.vectorStore.getStats();
          console.log("\n📊 System Statistics:");
          console.log(`  Documents: ${stats.totalDocuments}`);
          console.log(
            `  Vector Store: ${
              stats.isInitialized ? "Initialized" : "Not initialized"
            }`
          );
          console.log(`  Embedding Model: ${stats.embeddingModel}`);
          askQuestion();
          return;
        }

        // Regular question
        try {
          const answer = await this.chat.ask(question);
          console.log(`💡 Answer: ${answer}`);
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
const demo = new SimpleLangChainDemo();
demo.run().catch(console.error);
