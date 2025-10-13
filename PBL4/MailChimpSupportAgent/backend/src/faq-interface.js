import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs/promises";
import path from "path";
import config from "../config/config.js";

class MailChimpFAQInterface {
  constructor() {
    // Initialize Gemini AI (will fallback to template responses if it fails)
    try {
      if (!config.GEMINI_API_KEY) {
        throw new Error("No API key provided");
      }
      this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      this.geminiAvailable = true;
    } catch (error) {
      // Silently handle Gemini initialization errors
      this.geminiAvailable = false;
    }

    // Initialize embeddings (will fallback to local search if it fails)
    try {
      if (!config.GEMINI_API_KEY) {
        throw new Error("No API key provided");
      }
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: config.GEMINI_API_KEY,
        modelName: "text-embedding-004",
      });
      this.embeddingsAvailable = true;
    } catch (error) {
      // Silently handle embeddings initialization errors
      this.embeddingsAvailable = false;
    }

    this.pinecone = null;
    this.index = null;
    this.localChunks = null;
  }

  async initialize() {
    console.log("🔧 Initializing FAQ Interface...");
    console.log(
      `📊 Gemini API Key: ${config.GEMINI_API_KEY ? "✅ Set" : "❌ Missing"}`
    );
    console.log(
      `🌲 Pinecone API Key: ${
        config.PINECONE_API_KEY ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `📦 Pinecone Index: ${config.PINECONE_INDEX_NAME || "mailerbyte-rag"}`
    );

    // Try to load local chunks as fallback
    await this.loadLocalChunks();

    try {
      this.pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
      this.index = this.pinecone.Index(config.PINECONE_INDEX_NAME);

      // Test Pinecone connection
      const stats = await this.index.describeIndexStats();
      console.log("✅ Connected to Pinecone vector database");
      console.log(`📊 Index stats: ${stats.totalVectorCount} vectors`);

      if (stats.totalVectorCount === 0) {
        console.log("⚠️  Pinecone index is empty! Using local data fallback.");
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to Pinecone:", error.message);
      console.log("🔄 Falling back to local data...");
      return false;
    }
  }

  async loadLocalChunks() {
    try {
      const chunksPath = path.resolve("./data/processed_chunks/chunks.json");
      const enhancedChunksPath = path.resolve(
        "./data/processed_chunks/enhanced_chunks.json"
      );

      // Try enhanced chunks first, then fallback to regular chunks
      let chunksData;
      try {
        chunksData = await fs.readFile(enhancedChunksPath, "utf-8");
        console.log("📁 Loaded enhanced chunks from local storage");
      } catch {
        chunksData = await fs.readFile(chunksPath, "utf-8");
        console.log("📁 Loaded regular chunks from local storage");
      }

      this.localChunks = JSON.parse(chunksData);
      console.log(`📚 Local chunks loaded: ${this.localChunks.length} chunks`);
    } catch (error) {
      console.error("❌ Failed to load local chunks:", error.message);
      this.localChunks = [];
    }
  }

  async searchSimilarChunks(query, limit = 5) {
    console.log(`🔍 Searching for: "${query}"`);

    // Try Pinecone first (only if embeddings are available)
    if (this.index && this.embeddingsAvailable) {
      try {
        const queryEmbedding = await this.embeddings.embedQuery(query);

        const searchResponse = await this.index.query({
          vector: queryEmbedding,
          topK: limit,
          includeMetadata: true,
          includeValues: false,
        });

        const matches = searchResponse.matches || [];
        console.log(`🌲 Pinecone found ${matches.length} matches`);

        if (matches.length > 0) {
          return matches;
        }
      } catch (error) {
        console.error("🌲 Pinecone search error:", error.message);
      }
    }

    // Fallback to local search
    console.log("🔄 Using local search fallback...");
    return this.searchLocalChunks(query, limit);
  }

  async searchLocalChunks(query, limit = 5) {
    if (!this.localChunks || this.localChunks.length === 0) {
      console.log("❌ No local chunks available");
      return [];
    }

    const queryLower = query.toLowerCase();
    const scoredChunks = [];

    for (const chunk of this.localChunks) {
      const content = chunk.pageContent || "";
      const metadata = chunk.metadata || {};

      // Simple keyword matching with scoring
      let score = 0;
      const contentLower = content.toLowerCase();
      const titleLower = (metadata.title || "").toLowerCase();
      const headingLower = (metadata.heading || "").toLowerCase();
      const categoryLower = (metadata.category || "").toLowerCase();

      // Exact phrase match (highest score)
      if (contentLower.includes(queryLower)) {
        score += 10;
      }

      // Title match
      if (titleLower.includes(queryLower)) {
        score += 8;
      }

      // Heading match
      if (headingLower.includes(queryLower)) {
        score += 6;
      }

      // Category match
      if (categoryLower.includes(queryLower)) {
        score += 4;
      }

      // Word matches
      const queryWords = queryLower.split(/\s+/);
      const contentWords = contentLower.split(/\s+/);
      const wordMatches = queryWords.filter((word) =>
        contentWords.some((cWord) => cWord.includes(word))
      );
      score += wordMatches.length * 2;

      if (score > 0) {
        scoredChunks.push({
          score: score / 20, // Normalize to 0-1 range
          metadata: {
            ...metadata,
            pageContent: content,
          },
        });
      }
    }

    // Sort by score and return top results
    scoredChunks.sort((a, b) => b.score - a.score);
    const results = scoredChunks.slice(0, limit);

    console.log(`📚 Local search found ${results.length} matches`);
    return results;
  }

  async generateAnswer(query, relevantChunks) {
    const context = relevantChunks
      .map((chunk, index) => {
        const metadata = chunk.metadata;
        return `[Source ${index + 1}] ${metadata.title} - ${metadata.heading}
Category: ${metadata.category} | Difficulty: ${metadata.difficulty}
Content: ${chunk.metadata.pageContent || "No content available"}`;
      })
      .join("\n\n");

    // Try Gemini first (only if available), fallback to template-based response
    if (this.geminiAvailable) {
      try {
        const result = await this.model
          .generateContent(`You are a MailChimp support agent. Answer the user's question using the provided context from MailChimp documentation.

User Question: ${query}

Context from MailChimp Documentation:
${context}

Instructions:
1. Provide a clear, step-by-step answer based on the context
2. If the context doesn't contain enough information, say so and suggest where to find more help
3. Include specific MailChimp features, tools, or steps mentioned in the context
4. Keep the answer concise but comprehensive
5. If there are numbered lists or specific steps in the context, preserve them
6. Mention the source category (campaigns/automation/lists/getting-started) when relevant

Answer:`);

        const response = await result.response;
        return response.text();
      } catch (error) {
        // Suppress Gemini error messages when using fallback
        console.log("🔄 Gemini unavailable, using template-based response...");
      }
    } else {
      console.log("🔄 Using template-based response (Gemini not available)...");
    }

    // Fallback: Generate a structured response from the context
    return this.generateTemplateAnswer(query, relevantChunks);
  }

  generateTemplateAnswer(query, relevantChunks) {
    if (relevantChunks.length === 0) {
      return "I couldn't find specific information about your question in the MailChimp documentation. Please try rephrasing your question or contact MailChimp support for assistance.";
    }

    const queryLower = query.toLowerCase();
    let answer = `Based on the MailChimp documentation, here's what I found about "${query}":\n\n`;

    // Group chunks by category
    const categories = {};
    relevantChunks.forEach((chunk) => {
      const category = chunk.metadata.category || "general";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(chunk);
    });

    // Generate answer based on categories
    Object.entries(categories).forEach(([category, chunks]) => {
      answer += `**${category.toUpperCase()}:**\n`;

      chunks.forEach((chunk, index) => {
        const content = chunk.metadata.pageContent || "";
        const heading = chunk.metadata.heading || "";

        // Extract key information
        if (
          content.includes("step") ||
          content.includes("1.") ||
          content.includes("2.")
        ) {
          answer += `\n📋 ${heading}:\n${content}\n`;
        } else if (content.includes("import") || content.includes("contact")) {
          answer += `\n📧 ${heading}:\n${content}\n`;
        } else if (content.includes("campaign") || content.includes("email")) {
          answer += `\n🎯 ${heading}:\n${content}\n`;
        } else {
          answer += `\n📖 ${heading}:\n${content}\n`;
        }
      });

      answer += "\n";
    });

    // Add helpful suggestions
    answer += `\n💡 **Additional Help:**\n`;
    answer += `- Visit MailChimp's help center for more detailed guides\n`;
    answer += `- Check the MailChimp community forums for user discussions\n`;
    answer += `- Contact MailChimp support for personalized assistance\n`;

    return answer;
  }

  async askQuestion(question) {
    console.log("\n🔍 Searching for relevant information...");

    const chunks = await this.searchSimilarChunks(question, 5);

    if (chunks.length === 0) {
      console.log("❌ No relevant information found in the knowledge base.");
      console.log("💡 Try running the ingestion process first:");
      console.log("   npm run enhanced-ingest");
      return;
    }

    console.log(`📚 Found ${chunks.length} relevant sources`);

    console.log("\n🤖 Generating answer...");
    const answer = await this.generateAnswer(question, chunks);

    console.log("\n" + "=".repeat(80));
    console.log("📋 ANSWER:");
    console.log("=".repeat(80));
    console.log(answer);
    console.log("=".repeat(80));

    // Show sources
    console.log("\n📖 Sources:");
    chunks.forEach((chunk, index) => {
      const metadata = chunk.metadata;
      console.log(`${index + 1}. ${metadata.title} - ${metadata.heading}`);
      console.log(
        `   Category: ${metadata.category} | Difficulty: ${metadata.difficulty}`
      );
      console.log(`   Score: ${(chunk.score * 100).toFixed(1)}%`);
    });
  }

  async showMainMenu() {
    const choices = [
      "❓ Ask a custom question",
      "📧 How do I import contacts?",
      "📊 What's a good open rate?",
      "🎯 How do I create a campaign?",
      "📋 How do I manage my audience?",
      "🤖 How do I set up automation?",
      "📈 How do I view reports?",
      "🔧 Getting started with MailChimp",
      "🔍 Debug: Show system status",
      "❌ Exit",
    ];

    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: "What would you like to know about MailChimp?",
        choices: choices,
        pageSize: 10,
      },
    ]);

    return choice;
  }

  async showSystemStatus() {
    console.log("\n🔧 SYSTEM STATUS");
    console.log("=".repeat(50));
    console.log(
      `📊 Gemini API: ${config.GEMINI_API_KEY ? "✅ Connected" : "❌ Missing"}`
    );
    console.log(
      `🌲 Pinecone API: ${
        config.PINECONE_API_KEY ? "✅ Connected" : "❌ Missing"
      }`
    );
    console.log(
      `📦 Pinecone Index: ${config.PINECONE_INDEX_NAME || "mailerbyte-rag"}`
    );
    console.log(
      `📚 Local Chunks: ${
        this.localChunks ? this.localChunks.length : 0
      } available`
    );

    if (this.index) {
      try {
        const stats = await this.index.describeIndexStats();
        console.log(`🌲 Pinecone Vectors: ${stats.totalVectorCount}`);
      } catch (error) {
        console.log(`🌲 Pinecone Status: ❌ ${error.message}`);
      }
    }

    console.log("\n💡 TROUBLESHOOTING:");
    console.log("1. Make sure .env file exists with API keys");
    console.log("2. Run: npm run enhanced-ingest");
    console.log("3. Check Pinecone index name matches config");
  }

  async handleCustomQuestion() {
    const { question } = await inquirer.prompt([
      {
        type: "input",
        name: "question",
        message: "What's your question about MailChimp?",
        validate: (input) =>
          input.trim().length > 0 || "Please enter a question",
      },
    ]);

    await this.askQuestion(question);
  }

  async run() {
    console.log("🎯 MailChimp Support Agent - FAQ Interface");
    console.log("=".repeat(50));

    await this.initialize();

    while (true) {
      try {
        const choice = await this.showMainMenu();

        if (choice === "❌ Exit") {
          console.log("\n👋 Thanks for using MailChimp Support Agent!");
          break;
        }

        if (choice === "🔍 Debug: Show system status") {
          await this.showSystemStatus();
        } else if (choice === "❓ Ask a custom question") {
          await this.handleCustomQuestion();
        } else {
          // Extract question from choice
          const question = choice.replace(/^[^\w]*/, "").replace(/\?$/, "");
          await this.askQuestion(question);
        }

        // Ask if user wants to continue
        const { continue: shouldContinue } = await inquirer.prompt([
          {
            type: "confirm",
            name: "continue",
            message: "\nWould you like to ask another question?",
            default: true,
          },
        ]);

        if (!shouldContinue) {
          console.log("\n👋 Thanks for using MailChimp Support Agent!");
          break;
        }
      } catch (error) {
        console.error("❌ An error occurred:", error.message);

        const { retry } = await inquirer.prompt([
          {
            type: "confirm",
            name: "retry",
            message: "Would you like to try again?",
            default: true,
          },
        ]);

        if (!retry) break;
      }
    }
  }
}

// Run the interface
const faqInterface = new MailChimpFAQInterface();
faqInterface.run().catch(console.error);
