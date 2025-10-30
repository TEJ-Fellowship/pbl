import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import HybridSearch from "../hybridSearch.js";
import PostgreSQLBM25Service from "./postgresBM25Service.js";
import MemoryController from "../controllers/memoryController.js";
import QueryClassifier from "./queryClassifier.js";
import MCPIntegrationService from "./mcpIntegrationService.js";
import config from "../config/config.js";

class ChatService {
  constructor() {
    this.geminiClient = null;
    this.embeddings = null;
    this.vectorStore = null;
    this.hybridSearch = null;
    this.memoryController = null;
    this.queryClassifier = null;
    this.mcpService = null;
    this.isInitialized = false;
    this.sessionTokenCounts = new Map(); // Track tokens per session
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokenCount(text) {
    if (!text) return 0;
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.max(1, Math.ceil(text.length / 4.0));
  }

  /**
   * Get current token count for a session
   */
  getSessionTokenCount(sessionId) {
    return this.sessionTokenCounts.get(sessionId) || 0;
  }

  /**
   * Add tokens to session count
   */
  addTokensToSession(sessionId, tokens) {
    const currentCount = this.getSessionTokenCount(sessionId);
    this.sessionTokenCounts.set(sessionId, currentCount + tokens);
    console.log(
      `📊 Session ${sessionId}: +${tokens} tokens (Total: ${
        currentCount + tokens
      })`
    );
  }

  /**
   * Get token usage info for a session
   */
  getSessionTokenUsage(sessionId) {
    const currentTokens = this.getSessionTokenCount(sessionId);
    const maxTokens = 4000; // Default limit
    const usagePercentage = (currentTokens / maxTokens) * 100;

    return {
      sessionId,
      currentTokens,
      maxTokens,
      usagePercentage,
      isNearLimit: usagePercentage >= 80,
      isAtLimit: usagePercentage >= 95,
    };
  }

  /**
   * Reset token count for a session (when creating new session)
   */
  resetSessionTokenCount(sessionId) {
    this.sessionTokenCounts.set(sessionId, 0);
    console.log(`🔄 Reset token count for session: ${sessionId}`);
  }

  /**
   * Initialize the chat service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("🔧 Initializing chat service...");
      console.log("   📋 Configuration check:");
      console.log(
        `      • GEMINI_API_KEY: ${
          config.GEMINI_API_KEY ? "✅ Set" : "❌ Missing"
        }`
      );
      console.log(
        `      • PINECONE_API_KEY: ${
          config.PINECONE_API_KEY ? "✅ Set" : "❌ Missing"
        }`
      );
      console.log(
        `      • PINECONE_INDEX_NAME: ${
          config.PINECONE_INDEX_NAME || "❌ Missing"
        }`
      );
      console.log(
        `      • DB_HOST: ${config.DB_HOST ? "✅ Set" : "❌ Missing"}`
      );
      console.log(
        `      • DB_NAME: ${config.DB_NAME ? "✅ Set" : "❌ Missing"}`
      );

      // Initialize Gemini client
      console.log("   🤖 Initializing Gemini client...");
      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      console.log("      ✅ Gemini client initialized");

      // Initialize embeddings
      console.log("   🧠 Initializing Gemini embeddings...");
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: config.GEMINI_API_KEY,
        modelName: "text-embedding-004",
      });
      console.log(
        "      ✅ Gemini embeddings initialized (text-embedding-004)"
      );

      // Initialize Pinecone
      console.log("   🌲 Initializing Pinecone vector store...");
      const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
      const index = pinecone.Index(config.PINECONE_INDEX_NAME);
      this.vectorStore = { type: "pinecone", index };
      console.log(
        `      ✅ Pinecone vector store initialized (${config.PINECONE_INDEX_NAME})`
      );

      // Initialize hybrid search
      console.log("   🔍 Initializing hybrid search system...");
      const postgresBM25Service = new PostgreSQLBM25Service();
      this.hybridSearch = new HybridSearch(
        this.vectorStore,
        this.embeddings,
        postgresBM25Service
      );
      await this.hybridSearch.initialize();
      console.log(
        "      ✅ Hybrid search initialized (PostgreSQL BM25 + Pinecone)"
      );

      // Initialize memory controller
      console.log("   🧠 Initializing memory controller...");
      this.memoryController = new MemoryController();
      console.log("      ✅ Memory controller initialized");

      // Initialize MCP service
      console.log("   🔧 Initializing MCP service...");
      this.mcpService = new MCPIntegrationService();
      await this.mcpService.initialize();
      console.log("      ✅ MCP service initialized");

      // Initialize query classifier
      console.log("   🤖 Initializing query classifier...");
      this.queryClassifier = new QueryClassifier(this.mcpService.orchestrator);
      console.log("      ✅ Query classifier initialized");

      this.isInitialized = true;
      console.log("🎉 Chat service fully initialized and ready!");
    } catch (error) {
      console.error("❌ Chat service initialization failed:", error);
      throw error;
    }
  }

  /**
   * Process a message and return AI response
   */
  async processMessage({ message, sessionId, userId, timestamp }) {
    try {
      // Ensure service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`💬 Processing message: "${message.substring(0, 50)}..."`);

      // Initialize or get existing session
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await this.memoryController.initializeSession(sessionId, userId, {
          project: "stripe_support",
          context: "customer_support",
          startTime: timestamp,
        });
        // Reset token count for new session
        this.resetSessionTokenCount(sessionId);
      } else {
        // For existing sessions, ensure memory system is initialized
        console.log(`🔄 Checking existing session: ${sessionId}`);
        console.log(
          `   Current session ID: ${this.memoryController.currentSessionId}`
        );

        if (
          !this.memoryController.currentSessionId ||
          this.memoryController.currentSessionId !== sessionId
        ) {
          console.log(`   🔄 Reinitializing memory for session: ${sessionId}`);
          await this.memoryController.initializeSession(sessionId, userId, {
            project: "stripe_support",
            context: "customer_support",
            startTime: timestamp,
          });
        } else {
          console.log(
            `   ✅ Memory already initialized for session: ${sessionId}`
          );
        }
      }

      // Count tokens for user message (fallback if database fails)
      const userMessageTokens = this.estimateTokenCount(message);
      this.addTokensToSession(sessionId, userMessageTokens);

      // Process user message with memory system
      await this.memoryController.processUserMessage(message, {
        timestamp,
        source: "api",
      });

      // Get memory context for query reformulation
      const memoryContext =
        await this.memoryController.getCompleteMemoryContext(message);
      console.log(
        `🧠 Memory context: ${
          memoryContext.recentContext?.messageCount || 0
        } recent messages`
      );

      // Step 1: Classify the query to decide approach
      const enabledTools = this.mcpService.getEnabledTools();
      let classification = await this.queryClassifier.classifyQuery(
        message,
        0.5,
        enabledTools
      );
      console.log(
        `📊 Classification: ${classification.approach} - ${classification.reasoning}`
      );

      let response;
      let searchQuery = memoryContext.reformulatedQuery || message;

      // Step 2: Route based on classification
      const isStripe = this.isStripeRelatedQuery(message);
      // Force MCP-only for non-Stripe queries to avoid hybrid search on Stripe docs
      if (!isStripe && classification.approach !== "MCP_TOOLS_ONLY") {
        console.log("🔧 Forcing MCP tools only for non-Stripe query");
        classification = { ...classification, approach: "MCP_TOOLS_ONLY" };
      }

      if (classification.approach === "MCP_TOOLS_ONLY") {
        console.log("🔧 Using MCP tools only approach");

        // Try MCP tools first
        const mcpResult = await this.mcpService.processQueryWithMCP(
          message,
          0.5
        );

        if (mcpResult.success && mcpResult.enhancedResponse) {
          // Generate response using MCP tools only
          response = await this.generateResponseWithMCP(
            message,
            [], // No chunks needed for MCP-only
            mcpResult.enhancedResponse,
            mcpResult.toolsUsed || [],
            mcpResult.confidence || 0
          );
        } else {
          // Fallback to hybrid search if MCP fails
          console.log("⚠️ MCP tools failed, falling back to hybrid search");
          response = await this.fallbackToHybridSearch(message, memoryContext);
        }
      } else if (classification.approach === "HYBRID_SEARCH") {
        console.log("🔍 Using hybrid search approach");
        response = await this.fallbackToHybridSearch(message, memoryContext);
      } else if (classification.approach === "COMBINED") {
        console.log("🔧 Using combined MCP + hybrid search approach");

        // Get hybrid search results first
        const chunks = await this.hybridSearch.hybridSearch(
          searchQuery,
          parseInt(config.MAX_CHUNKS) || 5
        );

        if (chunks.length === 0) {
          throw new Error(
            "No relevant information found. Try rephrasing your question."
          );
        }

        // Try MCP tools for enhancement
        const mcpResult = await this.mcpService.processQueryWithMCP(
          message,
          0.5
        );

        // Generate response with both hybrid search and MCP
        response = await this.generateResponseWithMemoryAndMCP(
          message,
          chunks,
          memoryContext,
          mcpResult
        );
      } else {
        // Default to hybrid search
        console.log("🔍 Using default hybrid search approach");
        response = await this.fallbackToHybridSearch(message, memoryContext);
      }

      // Count tokens for AI response (fallback if database fails)
      const aiResponseTokens = this.estimateTokenCount(response.answer);
      this.addTokensToSession(sessionId, aiResponseTokens);

      // Process assistant response with memory system
      await this.memoryController.processAssistantResponse(response.answer, {
        timestamp: new Date().toISOString(),
        sources: response.sources?.length || 0,
        searchQuery: searchQuery,
      });

      // Calculate confidence score (use empty array for MCP-only responses)
      const confidence = this.calculateConfidence([], response.sources);

      return {
        answer: response.answer,
        sources: response.sources,
        confidence,
        sessionId,
        searchQuery,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Chat service error:", error);
      throw error;
    }
  }

  /**
   * Fallback to hybrid search when MCP tools fail or for hybrid-only approach
   */
  async fallbackToHybridSearch(message, memoryContext) {
    const searchQuery = memoryContext.reformulatedQuery || message;
    console.log(`🔍 Searching with: "${searchQuery.substring(0, 100)}..."`);

    // Retrieve relevant chunks using hybrid search
    const chunks = await this.hybridSearch.hybridSearch(
      searchQuery,
      parseInt(config.MAX_CHUNKS) || 5
    );

    if (chunks.length === 0) {
      throw new Error(
        "No relevant information found. Try rephrasing your question."
      );
    }

    // Generate response with memory context
    return await this.generateResponseWithMemory(
      message,
      chunks,
      memoryContext
    );
  }

  /**
   * Generate response using MCP tools only
   */
  async generateResponseWithMCP(
    query,
    chunks,
    mcpEnhancement,
    toolsUsed,
    mcpConfidence
  ) {
    try {
      console.log("🤖 Generating response with MCP tools only...");

      // Build a richer prompt if web_search was used
      const usedWebSearch = (toolsUsed || []).includes("web_search");
      const prompt = usedWebSearch
        ? `You are an up-to-date assistant. Summarize the latest information from the web search results below.

      USER QUESTION:
      ${query}

      WEB SEARCH RESULTS (verbatim):
      ${mcpEnhancement}

      INSTRUCTIONS:
      - Produce a concise multi-bullet summary of the most important updates (3-6 bullets).
      - Each bullet should be a full sentence with concrete facts. Avoid fluff.
      - Add a short "Sources" section at the end listing 3-5 links as markdown list items. Use the actual URLs shown; keep titles short.
      - Prefer reputable/official domains where available. Do not invent links.
      - If results look noisy or off-topic, say so briefly and suggest a clearer query.
      - Do not include any Stripe-specific framing.
      `
        : `You are a helpful assistant. Answer the user's question based on the provided information.

      USER QUESTION: ${query}

      MCP TOOL ENHANCEMENT:
      ${mcpEnhancement}

      TOOLS USED: ${toolsUsed.join(", ")}
      MCP CONFIDENCE: ${(mcpConfidence * 100).toFixed(1)}%

      Provide a clear, helpful response based on the MCP tool results.`;

      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        answer: text,
        sources: [], // No sources for MCP-only responses
      };
    } catch (error) {
      console.error("❌ MCP response generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate response with both memory context and MCP tools
   */
  async generateResponseWithMemoryAndMCP(
    query,
    chunks,
    memoryContext,
    mcpResult
  ) {
    try {
      console.log("🤖 Generating response with memory and MCP integration...");

      // Limit sources to most relevant ones
      const maxSources = parseInt(config.MAX_SOURCES) || 3;
      const limitedChunks = chunks.slice(0, maxSources);

      // Prepare context from chunks
      const context = limitedChunks
        .map((chunk, index) => {
          const title =
            chunk.metadata?.title ||
            chunk.metadata?.doc_title ||
            `Document ${index + 1}`;
          const category = chunk.metadata?.category || "documentation";
          return `[Source ${index + 1}: ${title} (${category})]\n${
            chunk.content
          }`;
        })
        .join("\n\n");

      const sources = limitedChunks.map((chunk, index) => {
        let title = chunk.metadata?.title || chunk.metadata?.doc_title;
        if (!title || title.trim() === "") {
          const contentLines = chunk.content
            .split("\n")
            .filter((line) => line.trim() !== "");
          const firstLine = contentLines[0] || "";
          title =
            firstLine.length > 60
              ? firstLine.substring(0, 60) + "..."
              : firstLine;
          if (!title) title = "Stripe Documentation";
        }

        title = title
          .replace(/^#+\s*/, "")
          .replace(/\n.*$/, "")
          .trim();

        const category = chunk.metadata?.category || "documentation";
        const url =
          chunk.metadata?.source ||
          chunk.metadata?.source_url ||
          "https://stripe.com/docs";

        return {
          content: chunk.content,
          metadata: chunk.metadata,
          title: title,
          category: category,
          url: url,
          similarity: chunk.similarity || chunk.finalScore,
          score: chunk.finalScore || 0,
          index: index + 1,
        };
      });

      // Build memory context string
      let memoryContextString = "";
      if (
        memoryContext.recentContext &&
        memoryContext.recentContext.hasContext
      ) {
        memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
      }

      if (
        memoryContext.longTermContext &&
        memoryContext.longTermContext.hasLongTermContext
      ) {
        const relevantQAs = memoryContext.longTermContext.relevantQAs;
        if (relevantQAs && relevantQAs.length > 0) {
          memoryContextString += `\n\nRELEVANT PREVIOUS DISCUSSIONS:\n`;
          relevantQAs.forEach((qa, index) => {
            memoryContextString += `[Previous Q&A ${index + 1}] Q: ${
              qa.question
            }\nA: ${qa.answer.substring(0, 200)}...\n\n`;
          });
        }
      }

      // Build MCP enhancement string
      let mcpEnhancementString = "";
      if (mcpResult && mcpResult.success && mcpResult.enhancedResponse) {
        mcpEnhancementString = `\n\nMCP TOOL ENHANCEMENT:\n${
          mcpResult.enhancedResponse
        }\nTools Used: ${(mcpResult.toolsUsed || []).join(", ")}`;
      }

      // Choose prompt based on whether query is Stripe-related
      const isStripe = this.isStripeRelatedQuery(query);
      const prompt = isStripe
        ? `You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

          You have access to both current Stripe documentation and previous conversation context to provide contextually aware responses.

          CURRENT STRIPE DOCUMENTATION:
          ${context}

          CURRENT USER QUESTION: ${query}
          ${memoryContextString}${mcpEnhancementString}

          RESPONSE GUIDELINES:
          1. **Context Awareness**: Use previous conversation context to provide more relevant and personalized responses
          2. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
          3. **MCP Integration**: Incorporate MCP tool results when available to enhance your response
          4. **Continuity**: Reference previous discussions when relevant to maintain conversation flow
          5. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
          6. **Include Code**: Always include practical code examples in the appropriate programming language
          7. **Step-by-Step**: Break down complex processes into clear, actionable steps
          8. **Error Handling**: Mention common errors and how to handle them
          9. **Best Practices**: Include security considerations and best practices
          10. **If Uncertain**: Clearly state when information isn't available in the context

          FORMAT YOUR RESPONSE:
          - Start with a direct answer to the question
          - Reference previous context when relevant (e.g., "Building on our previous discussion about...")
          - Provide detailed explanation with code examples
          - Include relevant API endpoints and parameters
          - Mention any prerequisites or setup requirements
          - Focus on being helpful and practical
          - Do NOT include source citations in your response - they will be added automatically

          Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.`
        : `You are a helpful, up-to-date assistant. Answer the user's question directly and concisely using the information provided below. If Stripe documentation context is included but irrelevant to the user's question, ignore it.

          USER QUESTION: ${query}
          ${memoryContextString}${mcpEnhancementString}

          INFORMATION:
          ${context}

          GUIDELINES:
          - Be factual and current. If MCP tools include web search results, prioritize them.
          - Keep the answer focused on the user's question; avoid Stripe-specific framing unless the question is about Stripe.
          - If information is insufficient, say what is missing and suggest a follow-up.
          - Provide links or brief references when available in the provided information.`;

      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Post-process the response to add formatted sources
      const formattedResponse = this.addFormattedSources(text, sources, query);

      return {
        answer: formattedResponse,
        sources: sources,
      };
    } catch (error) {
      console.error("❌ Combined response generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate response with memory context
   */
  async generateResponseWithMemory(query, chunks, memoryContext) {
    try {
      console.log("🤖 Generating response with memory context...");

      // Limit sources to most relevant ones (configurable)
      const maxSources = parseInt(config.MAX_SOURCES) || 3;
      const limitedChunks = chunks.slice(0, maxSources);

      // Prepare context from limited chunks with meaningful source titles
      const context = limitedChunks
        .map((chunk, index) => {
          const title =
            chunk.metadata?.title ||
            chunk.metadata?.doc_title ||
            `Document ${index + 1}`;
          const category = chunk.metadata?.category || "documentation";
          return `[Source ${index + 1}: ${title} (${category})]\n${
            chunk.content
          }`;
        })
        .join("\n\n");

      const sources = limitedChunks.map((chunk, index) => {
        // Generate clean, ChatGPT-style titles
        let title = chunk.metadata?.title || chunk.metadata?.doc_title;

        // If no title, generate one from content
        if (!title || title.trim() === "") {
          const contentLines = chunk.content
            .split("\n")
            .filter((line) => line.trim() !== "");
          const firstLine = contentLines[0] || "";
          title =
            firstLine.length > 60
              ? firstLine.substring(0, 60) + "..."
              : firstLine;
          if (!title) title = "Stripe Documentation";
        }

        // Clean up title formatting
        title = title
          .replace(/^#+\s*/, "")
          .replace(/\n.*$/, "")
          .trim();

        const category = chunk.metadata?.category || "documentation";
        const url =
          chunk.metadata?.source ||
          chunk.metadata?.source_url ||
          "https://stripe.com/docs";

        return {
          content: chunk.content,
          metadata: chunk.metadata,
          title: title,
          category: category,
          url: url,
          similarity: chunk.similarity || chunk.finalScore,
          score: chunk.finalScore || 0,
          index: index + 1,
        };
      });

      // Build memory context string
      let memoryContextString = "";

      if (
        memoryContext.recentContext &&
        memoryContext.recentContext.hasContext
      ) {
        memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
      }

      if (
        memoryContext.longTermContext &&
        memoryContext.longTermContext.hasLongTermContext
      ) {
        const relevantQAs = memoryContext.longTermContext.relevantQAs;
        if (relevantQAs && relevantQAs.length > 0) {
          memoryContextString += `\n\nRELEVANT PREVIOUS DISCUSSIONS:\n`;
          relevantQAs.forEach((qa, index) => {
            memoryContextString += `[Previous Q&A ${index + 1}] Q: ${
              qa.question
            }\nA: ${qa.answer.substring(0, 200)}...\n\n`;
          });
        }
      }

      // Generate response using Gemini
      const prompt = `You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

You have access to both current Stripe documentation and previous conversation context to provide contextually aware responses.

CURRENT STRIPE DOCUMENTATION:
${context}

CURRENT USER QUESTION: ${query}
${memoryContextString}

RESPONSE GUIDELINES:
1. **Context Awareness**: Use previous conversation context to provide more relevant and personalized responses
2. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
3. **Continuity**: Reference previous discussions when relevant to maintain conversation flow
4. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
5. **Include Code**: Always include practical code examples in the appropriate programming language
6. **Step-by-Step**: Break down complex processes into clear, actionable steps
7. **Error Handling**: Mention common errors and how to handle them
8. **Best Practices**: Include security considerations and best practices
9. **Context Awareness**: Use the provided Stripe documentation context to inform your response
10. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Reference previous context when relevant (e.g., "Building on our previous discussion about...")
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- Focus on being helpful and practical
- Do NOT include source citations in your response - they will be added automatically

Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.`;

      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Post-process the response to add formatted sources
      const formattedResponse = this.addFormattedSources(text, sources, query);

      return {
        answer: formattedResponse,
        sources: sources,
      };
    } catch (error) {
      console.error("❌ Response generation failed:", error);
      throw error;
    }
  }

  /**
   * Calculate confidence score based on retrieval results
   */
  calculateConfidence(chunks, sources) {
    if (!chunks || chunks.length === 0) return 0.1;

    // Base confidence on top chunk similarity
    const topScore = chunks[0]?.finalScore || chunks[0]?.similarity || 0;

    // Adjust based on number of relevant sources
    const sourceBonus = Math.min(sources?.length || 0, 5) * 0.1;

    // Calculate final confidence (0-1 scale)
    const confidence = Math.min(0.9, Math.max(0.1, topScore + sourceBonus));

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if query is Stripe-related
   */
  isStripeRelatedQuery(query) {
    const stripeKeywords = [
      "stripe",
      "payment",
      "webhook",
      "api",
      "charge",
      "customer",
      "subscription",
      "billing",
      "invoice",
      "refund",
      "dispute",
      "connect",
      "radar",
      "terminal",
      "checkout",
      "payment intent",
      "payment method",
      "card",
      "bank",
      "ach",
      "payout",
      "balance",
      "fee",
      "tax",
      "shipping",
      "address",
      "verification",
    ];

    const queryLower = query.toLowerCase();
    return stripeKeywords.some((keyword) => queryLower.includes(keyword));
  }

  /**
   * Add formatted sources to the end of the response (only for Stripe-related queries)
   */
  addFormattedSources(text, sources, query) {
    // Only show sources for Stripe-related queries
    if (!this.isStripeRelatedQuery(query)) {
      return text;
    }

    if (!sources || sources.length === 0) {
      return text;
    }

    // Create formatted source list
    const sourceList = sources
      .map((source, index) => {
        const title = source.title || "Stripe Documentation";
        const category = source.category || "documentation";
        const url = source.url || "https://stripe.com/docs";

        return `🔗 [Source ${index + 1}: ${title} (${category})] - ${url}`;
      })
      .join("\n");

    // Add the formatted sources to the end of the response
    const formattedSources = `\n\n📚 **Sources Used:**\n${sourceList}`;

    return text + formattedSources;
  }

  /**
   * Get service status
   */
  async getStatus() {
    return {
      initialized: this.isInitialized,
      components: {
        gemini: !!this.geminiClient,
        embeddings: !!this.embeddings,
        vectorStore: !!this.vectorStore,
        hybridSearch: !!this.hybridSearch,
        memoryController: !!this.memoryController,
        queryClassifier: !!this.queryClassifier,
        mcpService: !!this.mcpService,
      },
    };
  }
}

// Export singleton instance
export const chatService = new ChatService();
