import BufferWindowMemory from "../services/bufferWindowMemory.js";
import PostgreSQLMemoryService from "../services/postgresMemoryService.js";
import QueryReformulationService from "../services/queryReformulationService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";

/**
 * Memory Controller
 * Orchestrates short-term (BufferWindowMemory) and long-term (PostgreSQL) memory
 * Implements the complete conversational memory system as described in the guidelines
 */
class MemoryController {
  constructor() {
    this.bufferMemory = new BufferWindowMemory(8); // Last 8 messages (4 turns)
    this.postgresMemory = new PostgreSQLMemoryService();
    this.queryReformulation = new QueryReformulationService(
      this.bufferMemory,
      this.postgresMemory
    );
    this.currentSessionId = null;
    this.currentUserId = null;
    this.geminiClient = null;
    this.initializeGemini();
  }

  /**
   * Initialize Gemini client for AI-powered summarization
   */
  initializeGemini() {
    try {
      if (!config.GEMINI_API_KEY) {
        console.warn(
          "⚠️  GEMINI_API_KEY not found, using rule-based summarization"
        );
        return;
      }
      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      console.log(
        "✅ Gemini client initialized for conversation summarization"
      );
    } catch (error) {
      console.warn("⚠️  Failed to initialize Gemini client:", error.message);
    }
  }

  /**
   * Initialize memory system for a new session
   */
  async initializeSession(sessionId, userId = null, metadata = {}) {
    try {
      console.log(`🧠 Initializing memory system for session: ${sessionId}`);

      // Initialize buffer memory
      this.bufferMemory.initialize(sessionId);

      // Create or get PostgreSQL session
      await this.postgresMemory.createOrGetSession(sessionId, userId, metadata);

      // Set current session
      this.currentSessionId = sessionId;
      this.currentUserId = userId;

      console.log(`✅ Memory system initialized for session: ${sessionId}`);
      return {
        sessionId,
        userId,
        metadata,
        initialized: true,
      };
    } catch (error) {
      console.error("❌ Failed to initialize memory system:", error.message);
      throw error;
    }
  }

  /**
   * Process user message with memory integration
   */
  async processUserMessage(userMessage, metadata = {}) {
    if (!this.currentSessionId) {
      throw new Error(
        "Memory system not initialized. Call initializeSession() first."
      );
    }

    try {
      console.log(
        `\n👤 Processing user message: "${userMessage.substring(0, 100)}..."`
      );

      // Add to buffer memory
      const bufferMessage = this.bufferMemory.addMessage(
        "user",
        userMessage,
        metadata
      );

      // Store in PostgreSQL
      await this.postgresMemory.storeMessage(
        this.currentSessionId,
        "user",
        userMessage,
        metadata
      );

      console.log(`✅ User message processed and stored`);
      return bufferMessage;
    } catch (error) {
      console.error("❌ Failed to process user message:", error.message);
      throw error;
    }
  }

  /**
   * Process assistant response with memory integration
   */
  async processAssistantResponse(assistantResponse, metadata = {}) {
    if (!this.currentSessionId) {
      throw new Error(
        "Memory system not initialized. Call initializeSession() first."
      );
    }

    try {
      console.log(
        `🤖 Processing assistant response: "${assistantResponse.substring(
          0,
          100
        )}..."`
      );

      // Add to buffer memory
      const bufferMessage = this.bufferMemory.addMessage(
        "assistant",
        assistantResponse,
        metadata
      );

      // Store in PostgreSQL
      await this.postgresMemory.storeMessage(
        this.currentSessionId,
        "assistant",
        assistantResponse,
        metadata
      );

      // Extract Q&A pair for long-term memory
      const lastUserMessage = this.bufferMemory.getLastUserMessage();
      if (lastUserMessage) {
        await this.queryReformulation.extractQAPairs(
          this.currentSessionId,
          lastUserMessage.content,
          assistantResponse
        );
      }

      console.log(`✅ Assistant response processed and stored`);
      return bufferMessage;
    } catch (error) {
      console.error("❌ Failed to process assistant response:", error.message);
      throw error;
    }
  }

  /**
   * Reformulate query with context integration
   */
  async reformulateQuery(originalQuery) {
    if (!this.currentSessionId) {
      throw new Error(
        "Memory system not initialized. Call initializeSession() first."
      );
    }

    try {
      console.log(`\n🔄 Reformulating query with memory context`);

      const reformulation = await this.queryReformulation.reformulateQuery(
        originalQuery,
        this.currentSessionId,
        this.currentUserId
      );

      console.log(`✅ Query reformulated with context integration`);
      return reformulation;
    } catch (error) {
      console.error("❌ Failed to reformulate query:", error.message);
      // Fallback to original query
      return {
        originalQuery,
        reformulatedQuery: originalQuery,
        context: null,
      };
    }
  }

  /**
   * Get recent conversation context
   */
  getRecentContext() {
    const recentMessages = this.bufferMemory.getRecentMessages();
    return {
      bufferMemory: recentMessages,
      contextString: this.bufferMemory.getContextString(),
      summary: this.bufferMemory.getConversationSummary(),
      hasContext: this.bufferMemory.hasRecentContext(),
      messageCount: recentMessages.length,
    };
  }

  /**
   * Get long-term memory context
   */
  async getLongTermContext(query) {
    try {
      console.log(
        `\n🔍 Searching for relevant Q&A pairs for query: "${query}"`
      );
      console.log(`📊 Current session ID: ${this.currentSessionId}`);

      const relevantQAs = await this.postgresMemory.getRelevantQAPairs(
        query,
        this.currentSessionId,
        5
      );

      const conversationSummary =
        await this.postgresMemory.getConversationSummary(this.currentSessionId);

      console.log(
        `📝 Conversation summary:`,
        conversationSummary ? "Found" : "None"
      );

      // Debug: Check if this is a new session with no data yet
      if (relevantQAs.length === 0 && !conversationSummary) {
        console.log(
          "ℹ️  No long-term context available yet - this is normal for new sessions"
        );
        console.log(
          "ℹ️  Long-term context will be populated as conversations progress"
        );
      }

      return {
        relevantQAs,
        conversationSummary,
        hasLongTermContext:
          relevantQAs.length > 0 || conversationSummary !== null,
      };
    } catch (error) {
      console.error("❌ Failed to get long-term context:", error.message);
      return {
        relevantQAs: [],
        conversationSummary: null,
        hasLongTermContext: false,
      };
    }
  }

  /**
   * Get session context and metadata - OPTIMIZED VERSION with Session Summarization
   */
  async getSessionContext() {
    if (!this.currentSessionId) {
      return null;
    }

    try {
      // Fetch session data, stats, and conversation summary in parallel
      const [session, stats, conversationSummary] = await Promise.all([
        this.postgresMemory.createOrGetSession(this.currentSessionId),
        this.postgresMemory.getSessionStats(this.currentSessionId),
        this.postgresMemory.getConversationSummary(this.currentSessionId),
      ]);

      console.log(
        `📊 Session context: ${stats?.total_messages || 0} messages, ${
          stats?.qa_pairs || 0
        } Q&A pairs`
      );
      console.log(
        `📝 Session summary: ${conversationSummary ? "Available" : "None"}`
      );

      return {
        sessionId: this.currentSessionId,
        metadata: session.metadata || {},
        stats: stats,
        isActive: session.is_active,
        conversationSummary: conversationSummary
          ? {
              summaryText: conversationSummary.summary_text,
              keyTopics: conversationSummary.key_topics || [],
              createdAt: conversationSummary.created_at,
            }
          : null,
        hasSummary: conversationSummary !== null,
      };
    } catch (error) {
      console.error("❌ Failed to get session context:", error.message);
      return null;
    }
  }

  /**
   * Get complete memory context for RAG - OPTIMIZED VERSION
   * Fetches all context once and passes it to reformulation to eliminate redundancies
   */
  async getCompleteMemoryContext(originalQuery) {
    try {
      console.log(
        `\n🧠 Gathering complete memory context for query (OPTIMIZED)`
      );

      // Fetch all context in parallel - SINGLE RETRIEVAL
      const [recentContext, longTermContext, sessionContext] =
        await Promise.all([
          this.getRecentContext(),
          this.getLongTermContext(originalQuery),
          this.getSessionContext(),
        ]);

      console.log(
        `📊 Context fetched: ${
          recentContext?.messageCount || 0
        } recent messages, ${
          longTermContext?.relevantQAs?.length || 0
        } relevant Q&As`
      );

      // Pass pre-fetched context to reformulation to avoid duplicate queries
      const reformulation =
        await this.queryReformulation.reformulateQueryWithContext(
          originalQuery,
          this.currentSessionId,
          this.currentUserId,
          {
            recentContext,
            relevantQAs: longTermContext?.relevantQAs || [],
            sessionContext,
          }
        );

      return {
        originalQuery,
        reformulatedQuery: reformulation.reformulatedQuery,
        recentContext,
        longTermContext,
        reformulationContext: reformulation.context,
        memoryStats: this.getMemoryStats(),
      };
    } catch (error) {
      console.error("❌ Failed to get complete memory context:", error.message);
      return {
        originalQuery,
        reformulatedQuery: originalQuery,
        recentContext: null,
        longTermContext: null,
        reformulationContext: null,
        memoryStats: null,
      };
    }
  }

  /**
   * Create conversation summary
   */
  async createConversationSummary() {
    if (!this.currentSessionId) {
      throw new Error(
        "Memory system not initialized. Call initializeSession() first."
      );
    }

    try {
      console.log(
        `📝 Creating conversation summary for session: ${this.currentSessionId}`
      );

      const recentMessages = this.bufferMemory.getRecentMessages();
      const conversationHistory =
        await this.postgresMemory.getConversationHistory(
          this.currentSessionId,
          20
        );

      // Extract key topics from conversation
      const keyTopics = this.extractKeyTopics(conversationHistory);

      // Create summary text using Gemini AI
      const summaryText = await this.generateSummaryText(
        conversationHistory,
        keyTopics
      );

      // Store summary
      const summary = await this.postgresMemory.storeConversationSummary(
        this.currentSessionId,
        summaryText,
        keyTopics
      );

      console.log(`✅ Conversation summary created and stored`);
      return summary;
    } catch (error) {
      console.error("❌ Failed to create conversation summary:", error.message);
      throw error;
    }
  }

  /**
   * Extract key topics from conversation
   */
  extractKeyTopics(conversationHistory) {
    const topics = new Set();

    conversationHistory.forEach((message) => {
      const content = message.content.toLowerCase();

      // Extract technical topics
      if (content.includes("payment")) topics.add("payment");
      if (content.includes("webhook")) topics.add("webhook");
      if (content.includes("api")) topics.add("api");
      if (content.includes("error")) topics.add("error");
      if (content.includes("integration")) topics.add("integration");
      if (content.includes("stripe")) topics.add("stripe");
      if (content.includes("authentication")) topics.add("authentication");
      if (content.includes("security")) topics.add("security");
    });

    return Array.from(topics);
  }

  /**
   * Generate summary text from conversation using Gemini AI
   */
  async generateSummaryText(conversationHistory, keyTopics) {
    try {
      // If Gemini is not available, fall back to rule-based summarization
      if (!this.geminiClient) {
        return this.generateRuleBasedSummary(conversationHistory, keyTopics);
      }

      console.log("🤖 Generating AI-powered conversation summary with Gemini");

      // Prepare conversation context for Gemini
      const conversationText =
        this.formatConversationForGemini(conversationHistory);

      // Create prompt for Gemini
      const prompt = this.createSummaryPrompt(conversationText, keyTopics);

      // Get Gemini model
      const model = this.geminiClient.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        },
      });

      // Generate summary with Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      console.log("✅ AI-powered conversation summary generated: ", summary);
      return summary;
    } catch (error) {
      console.warn(
        "⚠️  Failed to generate AI summary, falling back to rule-based:",
        error.message
      );
      return this.generateRuleBasedSummary(conversationHistory, keyTopics);
    }
  }

  /**
   * Format conversation history for Gemini processing
   */
  formatConversationForGemini(conversationHistory) {
    return conversationHistory
      .map((msg, index) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        const timestamp = msg.timestamp
          ? new Date(msg.timestamp).toISOString()
          : "";
        return `${role} (${timestamp}): ${msg.content}`;
      })
      .join("\n\n");
  }

  /**
   * Create prompt for Gemini summarization
   */
  createSummaryPrompt(conversationText, keyTopics) {
    const topicsText =
      keyTopics.length > 0
        ? `\n\nKey topics identified: ${keyTopics.join(", ")}`
        : "";

    return `You are an expert at analyzing customer support conversations. Please create a comprehensive summary of the following conversation between a user and a Stripe customer support assistant.

      ${conversationText}${topicsText}

      Please provide a summary that includes:
      1. The main issues or questions the user had
      2. Key solutions or information provided by the assistant
      3. The overall outcome or resolution status
      4. Important technical details or topics discussed
      5. Any follow-up actions or next steps mentioned

      Keep the summary concise but informative (2-3 paragraphs maximum). Focus on the most important aspects that would be useful for future reference or context.`;
  }

  /**
   * Fallback rule-based summary generation
   */
  generateRuleBasedSummary(conversationHistory, keyTopics) {
    const userMessages = conversationHistory.filter(
      (msg) => msg.role === "user"
    );
    const assistantMessages = conversationHistory.filter(
      (msg) => msg.role === "assistant"
    );

    let summary = `Conversation with ${userMessages.length} user questions and ${assistantMessages.length} assistant responses. `;

    if (keyTopics.length > 0) {
      summary += `Key topics discussed: ${keyTopics.join(", ")}. `;
    }

    if (userMessages.length > 0) {
      const firstQuestion = userMessages[0].content.substring(0, 100);
      summary += `Started with: "${firstQuestion}...". `;
    }

    if (assistantMessages.length > 0) {
      const lastResponse = assistantMessages[
        assistantMessages.length - 1
      ].content.substring(0, 100);
      summary += `Latest discussion: "${lastResponse}...".`;
    }

    return summary;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      bufferMemory: this.bufferMemory.getStats(),
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      hasRecentContext: this.bufferMemory.hasRecentContext(),
      messageCount: this.bufferMemory.getRecentMessages().length,
    };
  }

  /**
   * Get session statistics from PostgreSQL
   */
  async getSessionStats() {
    if (!this.currentSessionId) {
      return null;
    }

    try {
      return await this.postgresMemory.getSessionStats(this.currentSessionId);
    } catch (error) {
      console.error("❌ Failed to get session stats:", error.message);
      return null;
    }
  }

  /**
   * Check database status and provide debugging information
   */
  async checkDatabaseStatus() {
    try {
      console.log("🔍 Checking database status...");

      // Check if tables exist and have data
      const stats = await this.postgresMemory.getDatabaseStats();
      console.log("📊 Database statistics:", stats);

      if (this.currentSessionId) {
        const sessionStats = await this.getSessionStats();
        console.log("📋 Session statistics:", sessionStats);
      }

      return stats;
    } catch (error) {
      console.error("❌ Failed to check database status:", error.message);
      return null;
    }
  }

  /**
   * Search conversation history
   */
  async searchConversations(query, limit = 20) {
    try {
      return await this.postgresMemory.searchConversations(
        query,
        this.currentUserId,
        limit
      );
    } catch (error) {
      console.error("❌ Failed to search conversations:", error.message);
      return [];
    }
  }

  /**
   * Clear current session memory
   */
  clearSessionMemory() {
    this.bufferMemory.clear();
    this.currentSessionId = null;
    this.currentUserId = null;
    console.log(`🧹 Session memory cleared`);
  }

  /**
   * Close memory system
   */
  async close() {
    try {
      await this.postgresMemory.close();
      console.log(`🔒 Memory system closed`);
    } catch (error) {
      console.error("❌ Failed to close memory system:", error.message);
    }
  }
}

export default MemoryController;
