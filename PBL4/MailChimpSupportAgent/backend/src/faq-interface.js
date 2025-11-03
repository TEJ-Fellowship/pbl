import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs/promises";
import path from "path";
import config from "../config/config.js";
import HybridSearch from "./hybridSearch.js";
import mcpClient from "./mcpClient/mcpClient.js";
import QueryClassifier, { classifyQuery } from "./utils/queryClassifier.js";

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
    this.hybridSearch = null;
    this.hybridSearchAvailable = false;

    // Initialize MCP Client (will fallback to semantic search if it fails)
    this.mcpClient = null;
    this.mcpAvailable = false;

    // Initialize Query Classifier
    this.queryClassifier = new QueryClassifier();
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
    console.log(
      `🗄️  PostgreSQL Database: ${config.DB_NAME || "mailchimp_support_db"}`
    );

    // Try to load local chunks as fallback
    await this.loadLocalChunks();

    // Initialize MCP Client
    await this.initializeMCPClient();

    try {
      this.pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
      this.index = this.pinecone.Index(config.PINECONE_INDEX_NAME);

      // Test Pinecone connection
      const stats = await this.index.describeIndexStats();
      console.log("✅ Connected to Pinecone vector database");
      console.log(`📊 Index stats: ${stats.totalVectorCount} vectors`);

      if (stats.totalVectorCount === 0) {
        console.log("⚠️  Pinecone index is empty! Using local data fallback.");
      }

      // Initialize Hybrid Search if embeddings are available
      if (this.embeddingsAvailable) {
        try {
          console.log(
            "🔧 Initializing Hybrid Search (BM25 + Semantic + Recency)..."
          );
          const vectorStore = {
            type: "pinecone",
            index: this.index,
          };
          this.hybridSearch = new HybridSearch(vectorStore, this.embeddings);
          await this.hybridSearch.initialize();
          this.hybridSearchAvailable = true;
          console.log("✅ Hybrid Search initialized successfully");
        } catch (error) {
          console.log(
            `⚠️  Hybrid Search initialization failed: ${error.message}`
          );
          console.log("🔄 Will use semantic-only search as fallback");
          this.hybridSearchAvailable = false;
        }
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
      const chunksPath = path.resolve(
        "./src/data/processed_chunks/enhanced_chunks.json"
      );
      const enhancedChunksPath = path.resolve(
        "./src/data/processed_chunks/enhanced_chunks.json"
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

  async initializeMCPClient() {
    try {
      console.log("🔧 Initializing MCP Client...");
      this.mcpClient = mcpClient;
      // Touch the server by listing tools to ensure connectivity
      await this.mcpClient.listTools();
      this.mcpAvailable = true;
      console.log("✅ MCP Client initialized successfully");
    } catch (error) {
      console.log(`⚠️  MCP Client initialization failed: ${error.message}`);
      console.log("🔄 Will use semantic search as fallback");
      this.mcpAvailable = false;
    }
  }

  async searchSimilarChunks(query, limit = 5) {
    console.log(`🔍 Searching for: "${query}"`);

    // Try Hybrid Search first (BM25 + Semantic + Recency Boost)
    if (this.hybridSearchAvailable && this.hybridSearch) {
      try {
        console.log("🔬 Using Hybrid Search (BM25 + Semantic + Recency Boost)");
        const results = await this.hybridSearch.hybridSearch(query, limit);

        if (results.length > 0) {
          // Format results to match expected structure
          return results.map((result) => ({
            score: result.finalScore || result.semanticScore || 0,
            metadata: {
              ...result.metadata,
              pageContent: result.content,
              title: result.metadata?.title || "Untitled",
              heading: result.metadata?.heading || "",
              category: result.metadata?.category || "general",
              difficulty: result.metadata?.difficulty || "intermediate",
            },
          }));
        }
      } catch (error) {
        console.error("❌ Hybrid search error:", error.message);
        console.log("🔄 Falling back to semantic-only search...");
      }
    }

    // Fallback to Pinecone semantic search
    if (this.index && this.embeddingsAvailable) {
      try {
        console.log("🔍 Using semantic search (Pinecone only)");
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

    // Final fallback to local search
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
          .generateContent(`You are a professional Mailchimp Support AI trained on official Mailchimp documentation. Your goal is to help users by giving accurate, concise, and friendly explanations using only the provided documentation context.


User Question: ${query}

Context from MailChimp Documentation:
${context}

1. Use ONLY the context provided — do not invent or assume information.
2. Give a clear, step-by-step answer tailored to the user’s question.
3. Mention specific Mailchimp features, tools, or UI paths (e.g., “Campaigns → Automations → Create Email”).
4. Preserve any numbered lists or bullet points from the documentation.
5. Reference the **source category** (e.g., “Campaigns,” “Lists,” “Automation,” “Getting Started”) when explaining.
6. If the context doesn’t have enough information, clearly say so and suggest checking the Mailchimp Help Center.
7. Maintain a friendly, knowledgeable tone — like a real Mailchimp expert helping a user on chat.

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

  async processWithMCPTools(userQuery, recommendedTool = null) {
    try {
      const q = userQuery.toLowerCase();

      // Use recommended tool if provided, otherwise decide via heuristics
      let tool = recommendedTool;
      let args = {};

      // If no recommended tool, use heuristics to determine the tool
      if (tool) {
        // Set appropriate args based on the recommended tool
        if (
          tool === "search_email_best_practices" ||
          tool === "search_email_trends"
        ) {
          args = { query: userQuery, maxResults: 5 };
        } else if (tool === "analyze_email_subject") {
          const match = userQuery.match(/"([^"]+)"|'([^']+)'/);
          const subject = match ? match[1] || match[2] : userQuery;
          args = { subject };
        } else if (tool === "send_time_optimizer") {
          const industries = [
            "ecommerce",
            "software",
            "saas",
            "marketing",
            "retail",
            "hospitality",
            "b2b",
          ];
          const industry = industries.find((i) => q.includes(i)) || "default";
          args = { industry };
        } else if (tool === "email_list_growth") {
          const nums = q.match(/\d+/g) || [];
          if (nums.length >= 3) {
            args = {
              startingSubscribers: Number(nums[0]),
              newSubscribers: Number(nums[1]),
              unsubscribes: Number(nums[2]),
            };
          } else {
            // Not enough numbers for this tool
            tool = null;
          }
        }
      } else if (q.includes("best practice")) {
        tool = "search_email_best_practices";
        args = { query: userQuery, maxResults: 5 };
      } else if (q.includes("trend") || q.includes("latest")) {
        tool = "search_email_trends";
        args = { query: userQuery, maxResults: 5 };
      } else if (q.includes("subject line") || q.includes("subject")) {
        tool = "analyze_email_subject";
        // Try to extract a quoted subject; otherwise use whole question
        const match = userQuery.match(/"([^"]+)"|'([^']+)'/);
        const subject = match ? match[1] || match[2] : userQuery;
        args = { subject };
      } else if (
        q.includes("send time") ||
        q.includes("best time") ||
        q.includes("best day")
      ) {
        tool = "send_time_optimizer";
        // crude industry extraction
        const industries = [
          "ecommerce",
          "software",
          "saas",
          "marketing",
          "retail",
          "hospitality",
          "b2b",
        ];
        const industry = industries.find((i) => q.includes(i)) || "default";
        args = { industry };
      } else if (
        (q.includes("list growth") || q.includes("subscriber growth")) &&
        /\d/.test(q)
      ) {
        // Only choose if numbers are present
        tool = "email_list_growth";
        // Extract simple numbers; fallback if not found -> skip MCP
        const nums = q.match(/\d+/g) || [];
        if (nums.length >= 3) {
          args = {
            startingSubscribers: Number(nums[0]),
            newSubscribers: Number(nums[1]),
            unsubscribes: Number(nums[2]),
          };
        } else {
          tool = null;
        }
      }

      if (!tool) {
        return { success: false, response: "No suitable MCP tool matched." };
      }

      console.log(`🔧 Using MCP tool: ${tool}`);
      const result = await this.mcpClient.callTool(tool, args);
      const response = this.formatMcpResponse(tool, result);

      return { success: true, response, tool, confidence: 0.8 };
    } catch (error) {
      console.error("Error processing query with MCP:", error);
      return {
        success: false,
        response: "Sorry, I encountered an error processing your request.",
      };
    }
  }

  formatMcpResponse(tool, result) {
    // Expect result.content[0].text to be a JSON string; parse if possible
    let parsed = null;
    try {
      const text = Array.isArray(result?.content)
        ? result.content[0]?.text || ""
        : "";
      parsed = JSON.parse(text);
    } catch (_) {
      // leave parsed null, fallback to raw
    }

    if (
      tool === "search_email_trends" ||
      tool === "search_email_best_practices"
    ) {
      if (parsed) {
        const lines = [];
        if (parsed.summary) lines.push(parsed.summary);
        if (Array.isArray(parsed.results)) {
          lines.push("\nTop sources:");
          parsed.results.slice(0, 5).forEach((r, i) => {
            lines.push(`${i + 1}. ${r.title}`);
            if (r.url) lines.push(`   ${r.url}`);
            if (r.snippet) lines.push(`   ${r.snippet}`);
          });
        }
        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    if (tool === "analyze_email_subject") {
      if (parsed) {
        const {
          subject,
          length,
          wordCount,
          spamScore,
          readability,
          tips = [],
        } = parsed;
        const lines = [
          `Subject: ${subject}`,
          `Length: ${length} chars | Words: ${wordCount}`,
          `Spam score: ${spamScore}/100`,
          `Readability: ${readability}`,
        ];
        if (tips.length) {
          lines.push("Tips:");
          tips.forEach((t) => lines.push(`- ${t}`));
        }
        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    if (tool === "send_time_optimizer") {
      if (parsed) {
        const lines = [
          `Industry: ${parsed.industry}`,
          `Best days: ${parsed.bestDays?.join(", ") || "N/A"}`,
          `Best times: ${parsed.bestTimes?.join(", ") || "N/A"}`,
        ];
        if (Array.isArray(parsed.generalTips)) {
          lines.push("General tips:");
          parsed.generalTips.forEach((t) => lines.push(`- ${t}`));
        }
        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    if (tool === "email_list_growth_simple" || tool === "email_list_growth") {
      if (parsed) {
        const lines = [
          `Starting subscribers: ${parsed.startingSubscribers}`,
          `New subscribers: ${parsed.newSubscribers}`,
          `Unsubscribes: ${parsed.unsubscribes}`,
          `Net growth: ${parsed.netGrowth}`,
          `Growth rate: ${
            parsed["email list growth rate"] || parsed.growthRate
          }`,
          `Insight: ${parsed.insight}`,
        ];
        if (Array.isArray(parsed.tips)) {
          lines.push("Tips:");
          parsed.tips.forEach((t) => lines.push(`- ${t}`));
        }
        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    // Fallback raw
    return typeof result === "string"
      ? result
      : JSON.stringify(result, null, 2);
  }

  async askQuestion(question) {
    console.log("\n🔍 Processing your question...");

    // Initialize query classifier if not already
    if (!this.queryClassifier) {
      this.queryClassifier = new QueryClassifier(
        this.geminiAvailable ? this.model : null
      );
    }

    // Classify the query with enhanced AI-powered classifier
    const context = {
      mcpAvailable: this.mcpAvailable,
      hybridSearchAvailable: this.hybridSearchAvailable,
    };

    const classification = await this.queryClassifier.classifyQuery(
      question,
      0.5,
      context
    );

    if (classification.category) {
      console.log(
        `🏷️  Query classified as: ${classification.category} (confidence: ${(
          classification.confidence * 100
        ).toFixed(1)}%)`
      );
      if (classification.reasoning) {
        console.log(`💭 Reasoning: ${classification.reasoning}`);
      }
      console.log(
        `🧭 Recommended approach: ${classification.approach || "HYBRID_SEARCH"}`
      );
    }

    // First, try MCP tools if available (based on classification)
    const shouldUseMCP =
      this.mcpAvailable &&
      (classification.approach === "MCP_TOOLS_ONLY" ||
        classification.approach === "COMBINED" ||
        classification.category === "mcp_tools");

    if (shouldUseMCP) {
      try {
        console.log("🔧 Checking if MCP tools can handle this query...");
        const mcpResult = await this.processWithMCPTools(question);

        if (mcpResult.success) {
          console.log("\n" + "=".repeat(80));
          console.log("🤖 MAILCHIMP SUPPORT AGENT RESPONSE:");
          console.log("=".repeat(80));
          console.log(mcpResult.response);
          console.log("=".repeat(80));

          if (mcpResult.tool) {
            console.log(`\n🔧 Tool used: ${mcpResult.tool}`);
            console.log(
              `📊 Confidence: ${(mcpResult.confidence * 100).toFixed(1)}%`
            );
          }
          return;
        } else {
          console.log(
            "🔄 MCP tools couldn't handle this query, falling back to semantic search..."
          );
        }
      } catch (error) {
        console.log(`⚠️  MCP processing failed: ${error.message}`);
        console.log("🔄 Falling back to semantic search...");
      }
    } else if (classification.approach === "CONVERSATIONAL") {
      console.log("💬 Handling as conversational query...");
      // For CLI mode, we can provide a simple conversational response
      if (!this.mcpAvailable && !this.hybridSearchAvailable) {
        console.log("\n" + "=".repeat(80));
        console.log("🤖 MAILCHIMP SUPPORT AGENT RESPONSE:");
        console.log("=".repeat(80));
        console.log(
          "I can help with MailChimp-related questions. Please specify what you'd like to know about MailChimp."
        );
        console.log("=".repeat(80));
        return;
      }
    }

    // Fallback to semantic search
    console.log("\n🔍 Searching knowledge base...");
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
      "📊 How to improve click rates?",
      "🎯 How do I create a campaign?",
      "📋 How do I manage my audience?",
      "🤖 How do I set up automation?",
      "📈 How do I view reports?",
      "🔧 How do I generate an API key?",
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
    console.log(`🗄️  PostgreSQL: ${config.DB_NAME || "mailchimp_support_db"}`);
    console.log(
      `🔬 Hybrid Search: ${
        this.hybridSearchAvailable
          ? "✅ Active (BM25 + Semantic + Recency)"
          : "❌ Inactive"
      }`
    );
    console.log(
      `📚 Local Chunks: ${
        this.localChunks ? this.localChunks.length : 0
      } available`
    );
    console.log(
      `🔧 MCP Client: ${this.mcpAvailable ? "✅ Connected" : "❌ Disconnected"}`
    );
    console.log(
      `🧠 MCP Tools: ${this.mcpAvailable ? "✅ Available" : "❌ Unavailable"}`
    );

    if (this.index) {
      try {
        const stats = await this.index.describeIndexStats();
        console.log(`🌲 Pinecone Vectors: ${stats.totalVectorCount}`);
      } catch (error) {
        console.log(`🌲 Pinecone Status: ❌ ${error.message}`);
      }
    }

    // Check PostgreSQL status
    if (this.hybridSearch && this.hybridSearch.postgresBM25Service) {
      try {
        const dbStats = await this.hybridSearch.postgresBM25Service.getStats();
        console.log(`🗄️  PostgreSQL Documents: ${dbStats.total_chunks}`);
        console.log(`🗄️  PostgreSQL Categories: ${dbStats.categories}`);
      } catch (error) {
        console.log(`🗄️  PostgreSQL Status: ❌ ${error.message}`);
      }
    }

    // Check MCP tools status
    if (this.mcpAvailable && this.mcpClient) {
      try {
        const tools = await this.mcpClient.listTools();
        console.log(`🛠️  Available MCP Tools: ${tools.length}`);
        tools.forEach((tool) => {
          console.log(`   • ${tool.name}: ${tool.description || ""}`);
        });
      } catch (error) {
        console.log(`🛠️  MCP Tools Status: ❌ ${error.message}`);
      }
    }

    console.log("\n💡 TROUBLESHOOTING:");
    console.log(
      "1. Make sure .env file exists with API keys and DB credentials"
    );
    console.log("2. Run: npm run db:setup (setup PostgreSQL)");
    console.log("3. Run: npm run enhanced-ingest (process documents)");
    console.log("4. Run: npm run db:populate (populate PostgreSQL)");
    console.log("5. Check Pinecone index name matches config");
    console.log("6. Run: npm run mcp:server (start MCP server)");
    console.log("7. Check config.js has TAVILY_API_KEY for MCP tools");
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

    // Cleanup
    if (this.mcpAvailable && this.mcpClient) {
      this.mcpClient.cleanup();
    }
  }
}

// Export the class for use in API server
export default MailChimpFAQInterface;

// Run the interface only if this file is executed directly (CLI mode)
if (process.argv[1] && process.argv[1].endsWith("faq-interface.js")) {
  const faqInterface = new MailChimpFAQInterface();
  faqInterface.run().catch(console.error);
}
