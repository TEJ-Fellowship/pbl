import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import HybridSearch from "../hybridSearch.js";
import PostgreSQLBM25Service from "./postgresBM25Service.js";
import MemoryController from "../controllers/memoryController.js";
import config from "../config/config.js";

class ChatService {
  constructor() {
    this.geminiClient = null;
    this.embeddings = null;
    this.vectorStore = null;
    this.hybridSearch = null;
    this.memoryController = null;
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
        `      • DATABASE_URL: ${config.DATABASE_URL ? "✅ Set" : "❌ Missing"}`
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

      // Use reformulated query for retrieval
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
      const response = await this.generateResponseWithMemory(
        message,
        chunks,
        memoryContext
      );

      // Count tokens for AI response (fallback if database fails)
      const aiResponseTokens = this.estimateTokenCount(response.answer);
      this.addTokensToSession(sessionId, aiResponseTokens);

      // Process assistant response with memory system
      await this.memoryController.processAssistantResponse(response.answer, {
        timestamp: new Date().toISOString(),
        sources: response.sources?.length || 0,
        searchQuery: searchQuery,
      });

      // Calculate confidence score
      const confidence = this.calculateConfidence(chunks, response.sources);

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
   * Generate response with memory context
   */
  async generateResponseWithMemory(query, chunks, memoryContext) {
    try {
      console.log("🤖 Generating response with memory context...");

      // Prepare context from retrieved chunks
      const context = chunks
        .map((chunk, index) => `[Source ${index + 1}] ${chunk.content}`)
        .join("\n\n");

      const sources = chunks.map((chunk, index) => ({
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: chunk.similarity || chunk.finalScore,
        score: chunk.finalScore || 0,
        index: index + 1,
      }));

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
9. **Source Citations**: Reference specific sources using [Source X] format
10. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Reference previous context when relevant (e.g., "Building on our previous discussion about...")
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- End with source citations

Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.`;

      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        answer: text,
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
      },
    };
  }
}

// Export singleton instance
export const chatService = new ChatService();
