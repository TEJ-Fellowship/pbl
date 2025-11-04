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
import ConversationMemoryService from "./services/conversationMemoryService.js";
import { tavily as createTavily } from "@tavily/core";

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

    // Conversational memory
    this.memory = new ConversationMemoryService(8);
    this.sessionId = null;

    // Web fallback
    this.tavily = null;
    this.tavilyAvailable = false;
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

    // Resume last session if present; otherwise create a new one
    try {
      const existing = await this.memory.getLatestSessionId("terminal-user");
      if (existing) {
        this.sessionId = existing;
        console.log(`🗄️  Resumed conversation session: ${this.sessionId}`);
      } else {
        this.sessionId = await this.memory.createSession("terminal-user");
        console.log(`🗄️  Conversation session created: ${this.sessionId}`);
      }
    } catch (e) {
      console.log(`⚠️  Conversation memory unavailable: ${e.message}`);
    }

    // Try to load local chunks as fallback
    await this.loadLocalChunks();

    // Initialize MCP Client
    await this.initializeMCPClient();

    let pineconeOk = false;
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
      pineconeOk = true;
    } catch (error) {
      console.error("❌ Failed to connect to Pinecone:", error.message);
      console.log("🔄 Falling back to local data...");
      pineconeOk = false;
    }

    // Initialize Tavily web search client (best-effort, non-fatal)
    try {
      if (config.TAVILY_API_KEY) {
        this.tavily = createTavily({ apiKey: config.TAVILY_API_KEY });
        this.tavilyAvailable = true;
      }
    } catch {
      this.tavilyAvailable = false;
    }

    return pineconeOk;
  }

  async loadLocalChunks() {
    // Try multiple possible locations for processed chunks
    const possiblePaths = [
      path.resolve("./src/data/processed_chunks/enhanced_chunks.json"),
      path.resolve("../src/data/processed_chunks/enhanced_chunks.json"),
      path.resolve("../data/processed_chunks/enhanced_chunks.json"),
      path.resolve("./data/processed_chunks/enhanced_chunks.json"),
      path.resolve("./src/data/processed_chunks/chunks.json"),
    ];

    for (const chunksPath of possiblePaths) {
      try {
        const chunksData = await fs.readFile(chunksPath, "utf-8");
        this.localChunks = JSON.parse(chunksData);
        console.log(`📁 Loaded chunks from: ${chunksPath}`);
        console.log(
          `📚 Local chunks loaded: ${this.localChunks.length} chunks`
        );
        return; // Successfully loaded
      } catch (err) {
        // Try next path
        continue;
      }
    }

    // If all paths failed
    console.error("❌ Failed to load local chunks from any known location");
    console.error("💡 Make sure you've run: npm run enhanced-ingest");
    this.localChunks = [];
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

    // Expand asset-related queries to improve recall for image upload in campaigns
    const expandedQuery = this.expandQueryIfNeeded(query);

    // Try Hybrid Search first (BM25 + Semantic + Recency Boost)
    if (this.hybridSearchAvailable && this.hybridSearch) {
      try {
        console.log("🔬 Using Hybrid Search (BM25 + Semantic + Recency Boost)");
        const results = await this.hybridSearch.hybridSearch(
          expandedQuery,
          limit
        );

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
        const queryEmbedding = await this.embeddings.embedQuery(expandedQuery);

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
    const localResults = this.searchLocalChunks(expandedQuery, limit);

    if (
      localResults.length === 0 &&
      this.localChunks &&
      this.localChunks.length > 0
    ) {
      console.log(
        `⚠️  Local search returned 0 results from ${this.localChunks.length} available chunks`
      );
      console.log(`🔍 Query: "${expandedQuery}"`);
      console.log(
        `💡 Try using more specific Mailchimp terms (campaign, audience, automation, etc.)`
      );
    }

    return localResults;
  }

  expandQueryIfNeeded(query) {
    const q = String(query || "");
    const lower = q.toLowerCase();
    const mentionsImage =
      /\b(image|upload|picture|media|logo|banner|asset|photo|alt text)\b/.test(
        lower
      );
    const mentionsCampaign = /\b(campaign|email|template|design|editor)\b/.test(
      lower
    );

    // Only expand when the user actually mentions images/media; do NOT expand on
    // generic campaign queries. If both are present, keep expansion to image topics.
    if (mentionsImage) {
      const boosters = [
        "image upload",
        "media library",
        "content studio",
        "add image",
        "replace image",
        "image size",
        "supported formats",
        "alt text",
        "optimize images",
        "template editor",
      ];
      // Optionally bias to campaign context if mentioned, without altering user intent
      const contextHint = mentionsCampaign ? " campaign" : "";
      return `${q}${contextHint} ${boosters.join(" ")}`.trim();
    }
    return q;
  }

  async webSearchFallback(query, limit = 5) {
    if (!this.tavilyAvailable || !this.tavily) return [];
    try {
      const result = await this.tavily.search(query, {
        maxResults: limit,
        searchDepth: "advanced",
        includeAnswer: true,
        include_raw_content: true,
      });

      const items = (result?.results || []).map((r) => ({
        score: 0.5,
        metadata: {
          title: r.title || "Web Result",
          heading: r.title || "",
          category: "web",
          difficulty: "intermediate",
          pageContent: (r.content || r.snippet || "").slice(0, 1200),
          url: r.url,
        },
      }));

      if (!items.length && result?.answer) {
        items.push({
          score: 0.5,
          metadata: {
            title: "Web Summary",
            heading: "Web Summary",
            category: "web",
            difficulty: "intermediate",
            pageContent: String(result.answer).slice(0, 1500),
          },
        });
      }

      // Store the answer for rich formatting
      if (result?.answer) {
        items.tavilyAnswer = result.answer;
      }

      return items;
    } catch (e) {
      console.log(`🌐 Web search failed: ${e.message}`);
      return [];
    }
  }

  formatWebSearchResponse(query, chunks, generatedAnswer) {
    const lines = [];

    // Header
    lines.push("");
    lines.push("🌐 Web Search Results");
    lines.push("━".repeat(60));
    lines.push("");

    // Query Context
    lines.push("🔍 Your Query");
    lines.push("─".repeat(60));
    lines.push(query);
    lines.push("");

    // AI-Generated Summary
    if (generatedAnswer && generatedAnswer.length > 0) {
      lines.push("📋 Summary");
      lines.push("─".repeat(60));

      // Clean up the generated answer
      const cleanAnswer = generatedAnswer
        .replace(/\*\*/g, "") // Remove markdown bold
        .replace(/\*/g, "") // Remove markdown italics
        .trim();

      // Split into paragraphs and format
      const paragraphs = cleanAnswer
        .split("\n\n")
        .filter((p) => p.trim().length > 0);
      paragraphs.forEach((para, i) => {
        if (i > 0) lines.push("");
        lines.push(para.trim());
      });
      lines.push("");
    }

    // Key Points (if answer has bullet points or numbered lists)
    const bulletPoints = generatedAnswer.match(/^[•\-\*]\s+.+$/gm);
    const numberedPoints = generatedAnswer.match(/^\d+\.\s+.+$/gm);

    if (bulletPoints && bulletPoints.length > 0) {
      lines.push("🔑 Key Points");
      lines.push("─".repeat(60));
      bulletPoints.slice(0, 5).forEach((point) => {
        const cleaned = point.replace(/^[•\-\*]\s+/, "").trim();
        lines.push(`\n✓ ${cleaned}`);
      });
      lines.push("");
    } else if (numberedPoints && numberedPoints.length > 0) {
      lines.push("🔑 Key Points");
      lines.push("─".repeat(60));
      numberedPoints.slice(0, 5).forEach((point, i) => {
        const cleaned = point.replace(/^\d+\.\s+/, "").trim();
        lines.push(`\n${i + 1}. ${cleaned}`);
      });
      lines.push("");
    }

    // Sources
    if (Array.isArray(chunks) && chunks.length > 0) {
      lines.push("📚 Sources & References");
      lines.push("─".repeat(60));

      const uniqueSources = [];
      const seenUrls = new Set();

      chunks.forEach((chunk) => {
        const url = chunk.metadata?.url;
        const title = chunk.metadata?.title;
        if (url && !seenUrls.has(url) && title && title !== "Web Summary") {
          seenUrls.add(url);
          uniqueSources.push({ title, url });
        }
      });

      uniqueSources.slice(0, 5).forEach((source, i) => {
        lines.push(`\n[${i + 1}] ${source.title}`);
        lines.push(`    ${source.url}`);
      });
      lines.push("");
    }

    // Footer
    lines.push("");
    lines.push("─".repeat(60));
    lines.push(
      "💡 These results are from web search. For Mailchimp-specific help, try asking about Mailchimp features!"
    );
    lines.push("");

    return lines.join("\n");
  }

  areResultsWeak(results, minScore = 0.15) {
    if (!Array.isArray(results) || results.length === 0) return true;
    // Use 'score' if present; otherwise try to infer from mapped fields
    const scores = results.map((r) => {
      if (typeof r.score === "number") return r.score;
      const m = r.metadata || {};
      // Fallback: if we mapped final/semantic/bm25 earlier into score, it's already there
      // If no score, consider neutral 0.0
      return 0;
    });
    const top = Math.max(...scores);
    return !Number.isFinite(top) || top < minScore;
  }

  async searchLocalChunks(query, limit = 5) {
    if (!this.localChunks || this.localChunks.length === 0) {
      console.log("❌ No local chunks available");
      console.log("💡 Make sure you've run: npm run enhanced-ingest");
      return [];
    }

    console.log(
      `🔍 Searching ${this.localChunks.length} local chunks for: "${query}"`
    );
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

  async generateAnswer(
    query,
    relevantChunks,
    memory = { recentMessages: [], recalled: [] },
    source = "docs",
    queryType = "documentation"
  ) {
    const memorySnippet = this.formatMemoryForPrompt(
      memory.recentMessages,
      memory.recalled
    );
    // Extract user name from recent messages, if provided by user
    let userName = null;
    const recent = memory.recentMessages || [];
    for (let i = recent.length - 1; i >= 0; i--) {
      const m = recent[i];
      if (m.role === "user") {
        // Enhanced name extraction patterns
        const patterns = [
          /my name is\s+([a-zA-Z][\w\s'-]+)/i,
          /i'?m\s+([a-zA-Z][\w\s'-]+)/i,
          /i am\s+([a-zA-Z][\w\s'-]+)/i,
          /call me\s+([a-zA-Z][\w\s'-]+)/i,
          /this is\s+([a-zA-Z][\w\s'-]+)/i,
        ];

        for (const pattern of patterns) {
          const match = pattern.exec(m.content || "");
          if (match && match[1]) {
            const potentialName = match[1].trim();
            // Filter out common false positives
            const commonWords = [
              "not",
              "here",
              "ready",
              "interested",
              "sure",
              "good",
              "fine",
              "done",
              "back",
            ];
            if (!commonWords.includes(potentialName.toLowerCase())) {
              userName = potentialName;
              break;
            }
          }
        }
        if (userName) break;
      }
    }

    // Try Gemini first (only if available), fallback to template-based response
    if (this.geminiAvailable) {
      try {
        let prompt = "";

        // Different prompts based on query type
        if (queryType === "conversational") {
          // CONVERSATIONAL PROMPT - Simple response without sources
          prompt = `You are a friendly and helpful Mailchimp Support AI. 
The user has sent you a conversational message (greeting, general chat, or casual question).

User Message: ${query}

Conversation Memory (most recent first, then recalled snippets):
${memorySnippet}

User Profile:
Name: ${userName || "(unknown)"}

INSTRUCTIONS:
1. Respond naturally and warmly to the user's message
2. If it's a greeting, greet them back and offer help with Mailchimp
3. If they ask a general question about you, explain you're a Mailchimp Support AI assistant designed to help with Mailchimp-related questions
4. Keep the response brief and friendly (2-3 sentences max)
5. If they mention their name, acknowledge it warmly
6. Do NOT provide technical documentation or sources
7. Keep it conversational and welcoming
8. Encourage them to ask specific Mailchimp questions if needed

Response:`;
        } else {
          // DOCUMENTATION OR WEB SEARCH PROMPT - Response with sources
          const context = relevantChunks
            .map((chunk, index) => {
              const metadata = chunk.metadata;
              const sourceUrl = metadata.url ? `\nURL: ${metadata.url}` : "";
              return `[Source ${index + 1}] ${metadata.title} - ${
                metadata.heading
              }
Category: ${metadata.category} | Difficulty: ${metadata.difficulty}${sourceUrl}
Content: ${chunk.metadata.pageContent || "No content available"}`;
            })
            .join("\n\n");

          const sourceHint =
            source === "web"
              ? "These results are from web search. Provide accurate, helpful information and CITE the source URLs when available."
              : source === "mixed"
              ? "These results combine Mailchimp documentation with web sources. Prioritize Mailchimp docs when available and cite sources."
              : "These results are from Mailchimp documentation. Use official Mailchimp terminology and features. Reference the source titles when helpful.";

          prompt = `You are a professional Mailchimp Support AI. Provide accurate, concise, and friendly explanations using the provided context.

User Question: ${query}

Conversation Memory (most recent first, then recalled snippets):
${memorySnippet}

User Profile:
Name: ${userName || "(unknown)"}

Source Type: ${
            source === "web"
              ? "Web Search (Tavily)"
              : source === "mixed"
              ? "Mixed (Mailchimp Docs + Web)"
              : "Mailchimp Documentation"
          }
${sourceHint}

Context:
${context}

INSTRUCTIONS:
1. **Personal Information Queries**: If the user asks about personal information (like their name, previous questions, etc.), check the Conversation Memory and User Profile sections FIRST.
2. **Use Context Appropriately**: For Mailchimp-related questions, use ONLY the context provided — do not invent or assume information.
3. Give a clear, step-by-step answer tailored to the user's question.
4. ${
            source === "docs"
              ? "When referencing information, mention the source title naturally (e.g., 'According to the Campaign Setup guide...')"
              : "When referencing information from web sources, include the URL or mention 'according to [source title]'"
          }
5. Preserve any numbered lists or bullet points from the sources.
6. If the context doesn't have enough information, clearly say so and suggest contacting Mailchimp support.
7. Maintain a friendly, knowledgeable tone.
8. If a user name is provided and it's their first interaction, acknowledge them by name.

Answer:`;
        }

        const result = await this.model.generateContent(prompt);
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
    if (queryType === "conversational") {
      const greeting = userName
        ? `Hello ${userName}! I'm your Mailchimp Support AI assistant.`
        : "Hello! I'm your Mailchimp Support AI assistant.";
      return `${greeting} I'm here to help you with any questions about Mailchimp features, campaigns, audiences, automations, and more. What would you like to know?`;
    }

    return this.generateTemplateAnswer(
      query,
      relevantChunks,
      { recentMessages: memory.recentMessages, recalled: memory.recalled },
      source
    );
  }

  formatMemoryForPrompt(recentMessages = [], recalled = []) {
    const recent = recentMessages
      .map(
        (m) =>
          `${
            m.created_at?.toISOString
              ? m.created_at.toISOString()
              : m.created_at
          } - ${m.role.toUpperCase()}: ${m.content}`
      )
      .join("\n");

    const rec = recalled
      .map(
        (m) =>
          `RECALLED (${(m.score || 0).toFixed(2)}): ${m.role.toUpperCase()}: ${
            m.content
          }`
      )
      .join("\n");

    const combined = [recent, rec].filter(Boolean).join("\n");
    return combined || "(no prior messages)";
  }

  generateTemplateAnswer(
    query,
    relevantChunks,
    memory = { recentMessages: [], recalled: [] },
    source = "docs"
  ) {
    if (relevantChunks.length === 0) {
      const msg =
        source === "web"
          ? "I couldn't find relevant information from web search. Please try rephrasing your question."
          : "I couldn't find specific information about your question in the MailChimp documentation. Please try rephrasing your question or contact MailChimp support for assistance.";
      return msg;
    }

    const queryLower = query.toLowerCase();
    // Personalize with a simple name extractor from recent messages
    const recent = memory.recentMessages || [];
    let userName = null;
    for (let i = recent.length - 1; i >= 0; i--) {
      const m = recent[i];
      if (m.role === "user") {
        const match = /my name is\s+([a-zA-Z][\w\s'-]+)/i.exec(m.content || "");
        if (match && match[1]) {
          userName = match[1].trim();
          break;
        }
      }
    }

    const sourcePrefix =
      source === "web"
        ? "Based on web search results"
        : source === "mixed"
        ? "Based on MailChimp documentation and web sources"
        : "Based on the MailChimp documentation";

    let answer = userName
      ? `Hi ${userName}, ${sourcePrefix.toLowerCase()}, here's what I found about "${query}":\n\n`
      : `${sourcePrefix}, here's what I found about "${query}":\n\n`;

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

    // Mention that earlier conversation was considered if recall found matches
    const recalled = memory.recalled || [];
    if (recalled.length > 0) {
      answer += `\n🧠 I also considered your earlier messages while answering.`;
    }

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
          // Smart extraction: try to find context-specific numbers
          let startingSubscribers = null;
          let newSubscribers = null;
          let unsubscribes = null;

          // Pattern matching for contextual extraction
          const startingMatch = userQuery.match(
            /starting\s+subscriber[s]?\s+(?:is|are|:)?\s*(\d+)/i
          );
          const newMatch = userQuery.match(
            /new\s+subscriber[s]?\s+(?:is|are|:)?\s*(\d+)/i
          );
          const unsubMatch = userQuery.match(
            /unsubscribe[s]?\s+(?:is|are|:)?\s*(\d+)/i
          );

          if (startingMatch) startingSubscribers = Number(startingMatch[1]);
          if (newMatch) newSubscribers = Number(newMatch[1]);
          if (unsubMatch) unsubscribes = Number(unsubMatch[1]);

          // Fallback: extract all numbers in order
          if (
            startingSubscribers === null ||
            newSubscribers === null ||
            unsubscribes === null
          ) {
            const nums = userQuery.match(/\d+/g) || [];
            if (nums.length >= 3) {
              startingSubscribers = startingSubscribers ?? Number(nums[0]);
              newSubscribers = newSubscribers ?? Number(nums[1]);
              unsubscribes = unsubscribes ?? Number(nums[2]);
            }
          }

          // Check if we have all required parameters
          if (
            startingSubscribers !== null &&
            newSubscribers !== null &&
            unsubscribes !== null
          ) {
            args = {
              startingSubscribers,
              newSubscribers,
              unsubscribes,
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
        (q.includes("list growth") ||
          q.includes("subscriber growth") ||
          q.includes("growth rate") ||
          q.includes("email growth") ||
          q.includes("calculate growth") ||
          (q.includes("growth") && q.includes("rate")) ||
          q.includes("list rate")) &&
        /\d/.test(q)
      ) {
        // Only choose if numbers are present
        tool = "email_list_growth";

        // Smart extraction: try to find context-specific numbers
        let startingSubscribers = null;
        let newSubscribers = null;
        let unsubscribes = null;

        // Pattern matching for contextual extraction
        const startingMatch = userQuery.match(
          /starting\s+subscriber[s]?\s+(?:is|are|:)?\s*(\d+)/i
        );
        const newMatch = userQuery.match(
          /new\s+subscriber[s]?\s+(?:is|are|:)?\s*(\d+)/i
        );
        const unsubMatch = userQuery.match(
          /unsubscribe[s]?\s+(?:is|are|:)?\s*(\d+)/i
        );

        if (startingMatch) startingSubscribers = Number(startingMatch[1]);
        if (newMatch) newSubscribers = Number(newMatch[1]);
        if (unsubMatch) unsubscribes = Number(unsubMatch[1]);

        // Fallback: extract all numbers in order
        if (
          startingSubscribers === null ||
          newSubscribers === null ||
          unsubscribes === null
        ) {
          const nums = userQuery.match(/\d+/g) || [];
          if (nums.length >= 3) {
            startingSubscribers = startingSubscribers ?? Number(nums[0]);
            newSubscribers = newSubscribers ?? Number(nums[1]);
            unsubscribes = unsubscribes ?? Number(nums[2]);
          }
        }

        // Check if we have all required parameters
        if (
          startingSubscribers !== null &&
          newSubscribers !== null &&
          unsubscribes !== null
        ) {
          args = {
            startingSubscribers,
            newSubscribers,
            unsubscribes,
          };
        } else {
          // Not enough numbers for this tool
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

        // Header with icon and title
        const isBestPractices = tool === "search_email_best_practices";
        const headerEmoji = isBestPractices ? "📧" : "📈";
        const headerTitle = isBestPractices
          ? "Email Marketing Best Practices"
          : "Email Marketing Trends";

        lines.push("");
        lines.push(`${headerEmoji} ${headerTitle}`);
        lines.push("━".repeat(20));
        lines.push("");

        // Extract and format key points from summary
        if (parsed.summary) {
          // Clean up the summary - remove artifacts and noise
          let cleanSummary = parsed.summary
            .replace(/\[\.\.\.\]/g, "")
            .replace(/https?:\/\/[^\s]+/g, "")
            .replace(/Image shows[^.]*\./g, "")
            .replace(/Image source:[^\n]*/g, "")
            .replace(/Updated [A-Z][a-z]+ \d+, \d+/g, "")
            .replace(/Watch now/gi, "")
            .replace(/Read more/gi, "")
            .replace(/Click here/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          // Split into sentences and clean each one
          const sentences = cleanSummary
            .split(/[.!?]+/)
            .map((s) => {
              // Remove leading/trailing numbers and whitespace
              let cleaned = s
                .trim()
                .replace(/^\d+\s*/, "") // Remove leading numbers
                .replace(/\s+\d+$/, "") // Remove trailing numbers
                .replace(/^\s*[-•*]\s*/, "") // Remove bullet points
                .trim();

              // Ensure it starts with capital letter
              if (cleaned.length > 0) {
                cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
              }

              return cleaned;
            })
            .filter((s) => {
              // Filter for complete, meaningful sentences
              return (
                s.length > 50 &&
                s.length < 350 &&
                !s.match(/^\d+$/) && // Not just numbers
                !s.match(/^(See|Read|Watch|Click)/i) && // Not call-to-action fragments
                s.split(" ").length >= 6
              ); // At least 6 words
            });

          if (sentences.length > 0) {
            // Key Insights - Take next 3-5 actionable points
            const keyPoints = sentences.slice(2, 7);
            if (keyPoints.length > 0) {
              lines.push("Key Insights");
              lines.push("─".repeat(20));
              keyPoints.forEach((point, i) => {
                if (point && point.length > 30) {
                  // Ensure point ends with period
                  const formattedPoint = point.endsWith(".")
                    ? point
                    : point + ".";
                  lines.push(`\n${i + 1}. ${formattedPoint}`);
                }
              });
              lines.push("");
            }
          }
        }

        // Actionable Recommendations
        if (Array.isArray(parsed.results) && parsed.results.length > 0) {
          lines.push("");
          lines.push("Actionable Recommendations");
          lines.push("─".repeat(20));

          // Extract specific recommendations from snippets
          const recommendations = parsed.results
            .slice(0, 3)
            .map((r) => {
              if (r.snippet) {
                // Extract short, actionable sentences
                const actionable = r.snippet
                  .split(/[.!?]+/)
                  .map((s) => {
                    // Clean up each sentence
                    return s
                      .trim()
                      .replace(/^\d+\s*/, "") // Remove leading numbers
                      .replace(/\s+\d+$/, "") // Remove trailing numbers
                      .replace(/^\s*[-•*]\s*/, "") // Remove bullet points
                      .trim();
                  })
                  .filter(
                    (s) =>
                      s.length > 40 &&
                      s.length < 400 && // Increased from 200 to allow complete sentences
                      s.split(" ").length >= 5 && // At least 5 words
                      (s.toLowerCase().includes("should") ||
                        s.toLowerCase().includes("ensure") ||
                        s.toLowerCase().includes("use") ||
                        s.toLowerCase().includes("make") ||
                        s.toLowerCase().includes("keep") ||
                        s.toLowerCase().includes("avoid") ||
                        s.toLowerCase().includes("consider") ||
                        s.toLowerCase().includes("implement"))
                  )
                  .slice(0, 1);

                if (actionable[0]) {
                  let rec = actionable[0].trim();
                  // Ensure it starts with capital letter
                  if (rec.length > 0) {
                    rec = rec.charAt(0).toUpperCase() + rec.slice(1);
                  }
                  return rec;
                }
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 5);

          if (recommendations.length > 0) {
            recommendations.forEach((rec) => {
              // Ensure recommendation ends with period
              const formattedRec = rec.endsWith(".") ? rec : rec + ".";
              lines.push(`\n• ${formattedRec}`); // Changed from ✓ to •
            });
            lines.push("");
          }
        }

        // References
        if (Array.isArray(parsed.results) && parsed.results.length > 0) {
          lines.push("");
          lines.push("References & Further Reading");
          lines.push("─".repeat(20));
          parsed.results.slice(0, 4).forEach((r, i) => {
            if (r.title && r.url) {
              lines.push(`\n[${i + 1}] ${r.title}`);
              lines.push(`    ${r.url}`);
            }
          });
          lines.push("");
        }

        // Footer note
        lines.push("");
        lines.push("─".repeat(60));
        lines.push(
          "💬 Need more specific guidance? Feel free to ask follow-up questions!"
        );
        lines.push("");

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

        const lines = [];

        // Header
        lines.push("");
        lines.push("✉️ Email Subject Line Analysis");
        lines.push("━".repeat(60));
        lines.push("");

        // Subject Line Display
        lines.push("📝 Your Subject Line");
        lines.push("─".repeat(60));
        lines.push(`"${subject}"`);
        lines.push("");

        // Performance Metrics
        lines.push("📊 Performance Metrics");
        lines.push("─".repeat(60));

        // Length Analysis with recommendation
        const lengthStatus =
          length <= 60
            ? "✅ Optimal"
            : length <= 70
            ? "⚠️ Acceptable"
            : "❌ Too Long";
        lines.push(`\nLength: ${length} characters ${lengthStatus}`);
        if (length > 60) {
          lines.push(
            `  → Recommended: Keep under 60 characters for better mobile visibility`
          );
        }

        // Word Count
        const wordStatus =
          wordCount >= 3 && wordCount <= 9 ? "✅ Good" : "⚠️ Adjust";
        lines.push(`\nWord Count: ${wordCount} words ${wordStatus}`);

        // Spam Score with visual indicator
        const spamStatus =
          spamScore <= 30
            ? "✅ Low Risk"
            : spamScore <= 60
            ? "⚠️ Medium Risk"
            : "❌ High Risk";
        const spamBar =
          "█".repeat(Math.floor(spamScore / 10)) +
          "░".repeat(10 - Math.floor(spamScore / 10));
        lines.push(`\nSpam Score: ${spamScore}/100 ${spamStatus}`);
        lines.push(`  ${spamBar}`);

        // Readability
        lines.push(`\nReadability: ${readability}`);
        lines.push("");

        // Optimization Tips
        if (tips.length) {
          lines.push("💡 Optimization Recommendations");
          lines.push("─".repeat(60));
          tips.forEach((t) => lines.push(`\n✓ ${t}`));
          lines.push("");
        }

        // Quick Wins Section
        lines.push("");
        lines.push("🚀 Quick Wins");
        lines.push("─".repeat(60));
        const quickWins = [];
        if (spamScore > 50)
          quickWins.push("Remove spammy words like 'FREE', 'BUY NOW'");
        if (length > 60) quickWins.push("Shorten to 50-60 characters");
        if (!/[!?]/.test(subject) && spamScore < 30)
          quickWins.push("Consider adding urgency (use sparingly)");
        if (!subject.match(/[A-Z]/g) || subject === subject.toLowerCase())
          quickWins.push("Use title case for professionalism");

        if (quickWins.length > 0) {
          quickWins.forEach((win) => lines.push(`• ${win}`));
        } else {
          lines.push(
            "• Your subject line looks great! Consider A/B testing variations."
          );
        }

        lines.push("");
        lines.push("─".repeat(60));
        lines.push("💬 Want to test another subject line? Just ask!");
        lines.push("");

        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    if (tool === "send_time_optimizer") {
      if (parsed) {
        const lines = [];

        // Header
        lines.push("");
        lines.push("⏰ Optimal Send Time Strategy");
        lines.push("━".repeat(60));
        lines.push("");

        // Industry Context
        const industryName =
          parsed.industry.charAt(0).toUpperCase() + parsed.industry.slice(1);
        lines.push("🏢 Industry Analysis");
        lines.push("─".repeat(60));
        lines.push(
          `Target Industry: ${
            industryName === "Default"
              ? "General / Mixed Audience"
              : industryName
          }`
        );
        lines.push("");

        // Optimal Timing
        lines.push("📅 Recommended Send Schedule");
        lines.push("─".repeat(60));
        lines.push("");
        lines.push("Best Days of Week:");
        if (parsed.bestDays && parsed.bestDays.length > 0) {
          parsed.bestDays.forEach((day) => {
            lines.push(`  📌 ${day}`);
          });
        }
        lines.push("");
        lines.push("Best Times of Day:");
        if (parsed.bestTimes && parsed.bestTimes.length > 0) {
          parsed.bestTimes.forEach((time) => {
            lines.push(`  🕐 ${time}`);
          });
        }
        lines.push("");

        // Why It Matters
        lines.push("🎯 Why This Matters");
        lines.push("─".repeat(60));
        lines.push(
          "Sending at the right time can increase your open rates by 20-50%."
        );
        lines.push(
          "These recommendations are based on industry benchmarks and user behavior patterns."
        );
        lines.push("");

        // General Best Practices
        if (
          Array.isArray(parsed.generalTips) &&
          parsed.generalTips.length > 0
        ) {
          lines.push("💡 Best Practices");
          lines.push("─".repeat(60));
          parsed.generalTips.forEach((t) => lines.push(`\n✓ ${t}`));
          lines.push("");
        }

        // Advanced Strategies
        if (
          Array.isArray(parsed.advancedTips) &&
          parsed.advancedTips.length > 0
        ) {
          lines.push("");
          lines.push("🚀 Advanced Optimization");
          lines.push("─".repeat(60));
          parsed.advancedTips.forEach((t, i) => {
            lines.push(`\n${i + 1}. ${t}`);
          });
          lines.push("");
        }

        // Action Items
        lines.push("");
        lines.push("✅ Next Steps");
        lines.push("─".repeat(60));
        lines.push(
          "• Schedule your next campaign for one of the recommended time slots"
        );
        lines.push("• Run A/B tests comparing different send times");
        lines.push(
          "• Monitor your analytics to find your audience's sweet spot"
        );
        lines.push("• Consider time zones if you have a global audience");
        lines.push("");
        lines.push("─".repeat(60));
        lines.push("💬 Need help with scheduling or analytics? Just ask!");
        lines.push("");

        return lines.join("\n");
      }
      return JSON.stringify(result, null, 2);
    }

    if (tool === "email_list_growth_simple" || tool === "email_list_growth") {
      if (parsed) {
        const growthRate =
          parsed["email list growth rate"] || parsed.growthRate || "0%";
        const isPositive = parsed.netGrowth > 0;
        const growthEmoji = isPositive
          ? "📈"
          : parsed.netGrowth === 0
          ? "➡️"
          : "📉";

        const lines = [];

        // Header
        lines.push("");
        lines.push("📊 Email List Growth Analysis");
        lines.push("━".repeat(60));
        lines.push("");

        // Input Summary
        lines.push("📥 Your Data");
        lines.push("─".repeat(60));
        lines.push(
          `Starting Subscribers: ${parsed.startingSubscribers.toLocaleString()}`
        );
        lines.push(
          `New Subscribers: ${parsed.newSubscribers.toLocaleString()}`
        );
        lines.push(`Unsubscribes: ${parsed.unsubscribes.toLocaleString()}`);
        lines.push("");

        // Growth Metrics
        lines.push("🎯 Growth Metrics");
        lines.push("─".repeat(60));
        lines.push("");

        // Net Growth with visual
        const netGrowthFormatted =
          parsed.netGrowth >= 0
            ? `+${parsed.netGrowth.toLocaleString()}`
            : parsed.netGrowth.toLocaleString();
        lines.push(
          `Net Subscriber Change: ${growthEmoji} ${netGrowthFormatted}`
        );

        // Growth Rate with progress bar
        const rateValue = parseFloat(growthRate);
        const barLength = Math.min(Math.abs(Math.floor(rateValue / 2)), 30);
        const progressBar = isPositive
          ? "█".repeat(barLength)
          : "▓".repeat(barLength);
        lines.push(`Growth Rate: ${growthRate}`);
        if (barLength > 0) {
          lines.push(`${progressBar}`);
        }
        lines.push("");

        // Final Count
        const finalCount = parsed.startingSubscribers + parsed.netGrowth;
        lines.push(
          `Current List Size: ${finalCount.toLocaleString()} subscribers`
        );
        lines.push("");

        // Performance Assessment
        lines.push("🔍 Performance Assessment");
        lines.push("─".repeat(60));
        lines.push(parsed.insight);
        lines.push("");

        // Benchmarks
        lines.push("📊 Industry Benchmarks");
        lines.push("─".repeat(60));
        lines.push("• Excellent Growth: > 5% per month");
        lines.push("• Good Growth: 2-5% per month");
        lines.push("• Average Growth: 0-2% per month");
        lines.push("• Negative Growth: < 0%");
        lines.push("");

        // Actionable Recommendations
        if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
          lines.push("💡 Growth Optimization Strategies");
          lines.push("─".repeat(60));
          parsed.tips.forEach((t, i) => {
            lines.push(`\n${i + 1}. ${t}`);
          });
          lines.push("");
        }

        // Next Steps
        lines.push("");
        lines.push("✅ Recommended Actions");
        lines.push("─".repeat(60));
        if (isPositive) {
          lines.push(
            "• Keep doing what you're doing - your strategy is working!"
          );
          lines.push("• Document your successful tactics for future reference");
          lines.push("• Consider scaling your acquisition efforts");
          lines.push("• Monitor engagement metrics to ensure quality growth");
        } else if (parsed.netGrowth === 0) {
          lines.push("• Analyze your signup forms and calls-to-action");
          lines.push("• Review your content quality and frequency");
          lines.push("• Survey subscribers to understand their needs");
          lines.push("• Implement re-engagement campaigns");
        } else {
          lines.push("• Urgent: Review why subscribers are leaving");
          lines.push("• Audit your email frequency and content relevance");
          lines.push("• Implement a win-back campaign");
          lines.push("• Segment your list and personalize content");
        }

        lines.push("");
        lines.push("─".repeat(60));
        lines.push(
          "💬 Want to calculate growth over a different period? Just ask!"
        );
        lines.push("");

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

    // Lightweight math Q&A (e.g., "addition of 12 and 9", "12 + 9")
    const mathAnswer = this.maybeAnswerMath(question);
    if (mathAnswer !== null) {
      // Save user question
      if (this.sessionId) {
        try {
          await this.memory.addMessage(this.sessionId, "user", question);
        } catch {}
      }

      // Output and save assistant answer
      console.log("\n" + "=".repeat(80));
      console.log("📋 ANSWER:");
      console.log("=".repeat(80));
      console.log(mathAnswer);
      console.log("=".repeat(80));

      if (this.sessionId) {
        try {
          await this.memory.addMessage(this.sessionId, "assistant", mathAnswer);
        } catch {}
      }

      return;
    }

    // Save user question to memory
    if (this.sessionId) {
      try {
        await this.memory.addMessage(this.sessionId, "user", question);
      } catch {}
    }

    // Retrieve recent buffer and relevant recalled snippets
    let recentMessages = [];
    let recalled = [];
    if (this.sessionId) {
      try {
        recentMessages = await this.memory.getRecentMessages(this.sessionId, 8);
        recalled = await this.memory.recallRelevant(
          this.sessionId,
          question,
          3
        );
      } catch {}
    }

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

          // Save assistant answer to memory
          if (this.sessionId) {
            try {
              await this.memory.addMessage(
                this.sessionId,
                "assistant",
                mcpResult.response
              );
            } catch {}
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

      // Generate conversational response using the unified generateAnswer method
      const conversationalResponse = await this.generateAnswer(
        question,
        [], // No chunks needed for conversational queries
        {
          recentMessages,
          recalled,
        },
        "conversational", // source type
        "conversational" // queryType
      );

      console.log("\n" + "=".repeat(80));
      console.log("🤖 MAILCHIMP SUPPORT AGENT RESPONSE:");
      console.log("=".repeat(80));
      console.log(conversationalResponse);
      console.log("=".repeat(80));

      // Save assistant answer to memory
      if (this.sessionId) {
        try {
          await this.memory.addMessage(
            this.sessionId,
            "assistant",
            conversationalResponse
          );
        } catch {}
      }

      // Return early - no sources needed for conversational queries
      return;
    }

    // Detect if question is Mailchimp-related
    const isMailchimpRelated = this.isMailchimpRelated(question);
    // Detect intents that must use Mailchimp docs only (never web fallback)
    const docsOnlyIntent = this.isDocsOnlyIntent(question);
    let chunks = [];
    let answerSource = "docs";

    if (isMailchimpRelated) {
      console.log(
        "📚 Question is Mailchimp-related. Searching Mailchimp documentation..."
      );
      chunks = await this.searchSimilarChunks(question, 5);
      answerSource = "docs";

      console.log(
        `📊 Search returned ${chunks.length} chunks from Mailchimp docs`
      );

      // Show what was found for debugging
      if (chunks.length > 0) {
        console.log(`📄 Top chunks found:`);
        chunks.slice(0, 3).forEach((chunk, i) => {
          const title = chunk.metadata?.title || "Unknown";
          const score =
            typeof chunk.score === "number"
              ? (chunk.score * 100).toFixed(1)
              : "N/A";
          console.log(`   ${i + 1}. ${title} (score: ${score}%)`);
        });
      } else {
        console.log(`⚠️  No chunks found! Available sources:`);
        console.log(`   - Local chunks: ${this.localChunks?.length || 0}`);
        console.log(
          `   - Hybrid search: ${this.hybridSearchAvailable ? "✅" : "❌"}`
        );
        console.log(`   - Pinecone: ${this.index ? "✅" : "❌"}`);
      }

      // Check if docs results are meaningful (not just empty or very low quality),
      // unless this is a docs-only intent where we must not use web fallback.
      const isWeak = this.areResultsWeak(chunks, 0.05);

      if (!docsOnlyIntent && (chunks.length === 0 || isWeak)) {
        console.log(
          "⚠️  Mailchimp documentation has no/weak results. Trying web search (Tavily) for better answers..."
        );
        const expanded = this.expandQueryIfNeeded(question);
        const webChunks = await this.webSearchFallback(expanded, 5);

        if (webChunks.length > 0) {
          // Use web results if docs are empty, otherwise combine
          if (chunks.length === 0) {
            chunks = webChunks;
            answerSource = "web";
            console.log(
              "🌐 Using web search results (no Mailchimp docs available)"
            );
          } else {
            // Combine weak docs with web for better coverage
            chunks = [...chunks, ...webChunks];
            answerSource = "mixed";
            console.log(
              `🌐 Combined ${chunks.length} results (docs + web) for comprehensive answer`
            );
          }
        } else if (chunks.length === 0) {
          console.log("❌ No results found from Mailchimp docs or web search.");
          return;
        } else {
          console.log(
            `✅ Using ${chunks.length} Mailchimp documentation results (web search unavailable)`
          );
        }
      } else {
        // We have good docs results - use them!
        console.log(
          `✅ Found ${chunks.length} relevant Mailchimp documentation results`
        );
      }
    } else {
      console.log(
        "🌐 Question is not Mailchimp-related. Using web search (Tavily)..."
      );
      const expanded = this.expandQueryIfNeeded(question);
      chunks = await this.webSearchFallback(expanded, 5);
      answerSource = "web";

      if (chunks.length === 0) {
        console.log("❌ No relevant information found from web search.");
        return;
      }
    }

    console.log(`📚 Found ${chunks.length} relevant sources`);

    console.log("\n🤖 Generating answer...");
    let answer = await this.generateAnswer(
      question,
      chunks,
      {
        recentMessages,
        recalled,
      },
      answerSource,
      "documentation" // queryType - using documentation for Mailchimp queries
    );

    // Check if the answer indicates insufficient information from docs
    // If so, and we haven't used Tavily yet, try web search — except for docs-only intents
    if (
      isMailchimpRelated &&
      !docsOnlyIntent &&
      answerSource === "docs" &&
      this.isAnswerInsufficient(answer)
    ) {
      console.log(
        "\n⚠️  Answer indicates docs don't have enough info. Trying web search (Tavily)..."
      );
      const expanded = this.expandQueryIfNeeded(question);
      const webChunks = await this.webSearchFallback(expanded, 5);

      if (webChunks.length > 0) {
        // Regenerate with web results
        chunks = [...chunks, ...webChunks];
        answerSource = "mixed";
        console.log(
          `🌐 Regenerating with ${chunks.length} combined results (docs + web)...`
        );
        answer = await this.generateAnswer(
          question,
          chunks,
          {
            recentMessages,
            recalled,
          },
          answerSource,
          "documentation" // queryType - still documentation even with web results
        );
      }
    }

    // Format output based on source type
    if (answerSource === "web" || answerSource === "mixed") {
      // Use rich web search formatting
      const formattedResponse = this.formatWebSearchResponse(
        question,
        chunks,
        answer
      );
      console.log(formattedResponse);
    } else {
      // Standard documentation response
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

    // Save assistant answer to memory
    if (this.sessionId) {
      try {
        await this.memory.addMessage(this.sessionId, "assistant", answer);
      } catch {}
    }
  }

  maybeAnswerMath(question) {
    if (!question) return null;
    const q = String(question).toLowerCase().trim();

    // Patterns like: "addition of 12 and 9", "sum of 12 and 9"
    let m = q.match(
      /\b(addition|sum)\s+of\s+(-?\d+(?:\.\d+)?)\s+and\s+(-?\d+(?:\.\d+)?)/
    );
    if (m) {
      const a = parseFloat(m[2]);
      const b = parseFloat(m[3]);
      const res = a + b;
      return `${a} + ${b} = ${res}`;
    }

    // Direct operators: "12 + 9", "20 - 5", "6 * 3", "15 / 2"
    m = q.match(/(-?\d+(?:\.\d+)?)\s*([+\-*\/])\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const a = parseFloat(m[1]);
      const op = m[2];
      const b = parseFloat(m[3]);
      let res;
      switch (op) {
        case "+":
          res = a + b;
          break;
        case "-":
          res = a - b;
          break;
        case "*":
          res = a * b;
          break;
        case "/":
          res = b === 0 ? "Infinity" : a / b;
          break;
        default:
          return null;
      }
      return `${a} ${op} ${b} = ${res}`;
    }

    return null;
  }

  detectForceWeb(question) {
    const q = String(question || "").toLowerCase();
    return (
      q.startsWith("web:") ||
      /\b(search\s+web|use\s+web|internet\s+search)\b/.test(q)
    );
  }

  stripForceWeb(question) {
    return String(question || "")
      .replace(/^\s*web:\s*/i, "")
      .trim();
  }

  isAnswerInsufficient(answer) {
    if (!answer || typeof answer !== "string") return false;
    const lower = answer.toLowerCase();

    // Phrases that indicate the answer doesn't have enough info
    const insufficientPhrases = [
      "doesn't contain",
      "does not contain",
      "not contain",
      "doesn't have",
      "does not have",
      "not have",
      "unfortunately",
      "currently have access to does not",
      "does not provide",
      "doesn't provide",
      "not provide",
      "not available",
      "unavailable",
      "no information",
      "no details",
      "no specific",
      "insufficient",
      "cannot find",
      "couldn't find",
      "don't have enough",
      "not enough information",
    ];

    return insufficientPhrases.some((phrase) => lower.includes(phrase));
  }

  isMailchimpRelated(question) {
    if (!question) return false;
    const q = String(question).toLowerCase();

    // Mailchimp-specific keywords (expanded list)
    const mailchimpKeywords = [
      "mailchimp",
      "mail chimp",
      "campaign",
      "audience",
      "list",
      "automation",
      "template",
      "email marketing",
      "subscriber",
      "segment",
      "merge field",
      "tag",
      "landing page",
      "pop-up",
      "form",
      "survey",
      "report",
      "analytics",
      "ab testing",
      "a/b test",
      "transactional",
      "api key",
      "integration",
      "workflow",
      "trigger",
      "sender",
      "domain",
      "dns",
      "autoresponder",
      // Contact/subscriber management
      "import",
      "import contacts",
      "contact",
      "contacts",
      "add contact",
      "upload contacts",
      "csv import",
      "csv upload",
      // Common Mailchimp tasks
      "create",
      "edit",
      "delete",
      "manage",
      "set up",
      "setup",
      "configure",
      "send",
      "schedule",
      "draft",
      // Email-specific
      "email",
      "newsletter",
      "blast",
      "broadcast",
    ];

    // Check for Mailchimp keywords
    const hasMailchimpKeyword = mailchimpKeywords.some((keyword) =>
      q.includes(keyword)
    );

    // Exclude non-Mailchimp contexts (general math, programming languages, etc.)
    const isMathOrGeneral =
      /^(\d+\s*[+\-*\/]\s*\d+)|addition|subtraction|multiplication|division|calculate|sum|difference|product|quotient/i.test(
        q
      );
    if (isMathOrGeneral) return false;

    // If question contains "how do i" or "how to" and has Mailchimp keywords, it's likely Mailchimp-related
    const hasHowQuestion = /^(how do i|how to|how can i|how should i)/i.test(
      q.trim()
    );
    if (hasHowQuestion) {
      // More likely to be Mailchimp-related if it's a "how do I" question
      // unless it's clearly about something else (like "how do i learn python")
      const clearlyNotMailchimp =
        /(python|javascript|java|code|programming|learn|tutorial|course|book)/i.test(
          q
        );
      return !clearlyNotMailchimp || hasMailchimpKeyword;
    }

    // Exclude very general questions without context
    const isGeneralQuestion =
      /^what is (email|marketing|automation|campaign)$/i.test(q.trim());

    // If it's a general "what is" question without Mailchimp keywords, it's not Mailchimp-related
    if (isGeneralQuestion && !hasMailchimpKeyword) return false;

    // Default: if it has Mailchimp keywords, it's related
    // Also, if it's asking "how do I" something, assume it's Mailchimp-related unless proven otherwise
    return hasMailchimpKeyword || hasHowQuestion;
  }

  // Certain intents must be answered strictly from Mailchimp docs (no web fallback)
  isDocsOnlyIntent(question) {
    const q = String(question || "").toLowerCase();
    // Core Mailchimp guided flows we want to keep docs-only
    const patterns = [
      /\b(create|set\s*up|setup|make|build)\s+(a\s+)?(regular\s+email\s+)?campaign\b/,
      /\bimport\s+(contacts|audience|subscribers)\b/,
      /\bmanage\s+(audience|list|contacts)\b/,
      /\bcreate\s+(template|email\s+template)\b/,
      /\bautomation\b/, // setup automation flows
    ];
    return patterns.some((re) => re.test(q));
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
