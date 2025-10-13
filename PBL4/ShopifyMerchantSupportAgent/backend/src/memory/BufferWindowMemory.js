import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { v4 as uuidv4 } from "uuid";
import TokenCounter from "../utils/TokenCounter.js";

class BufferWindowMemory {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 8; // Last 8 messages (4 turns)
    this.sessionId = options.sessionId || uuidv4();
    this.conversation = null;

    // Token-aware context windowing
    this.maxTokens = options.maxTokens || 6000; // Maximum tokens for context
    this.modelName = options.modelName || "gemini-1.5-flash";
    this.tokenCounter = new TokenCounter(this.modelName);

    // Context windowing strategy
    this.prioritizeRecent = options.prioritizeRecent !== false; // Default: true
    this.prioritizeRelevance = options.prioritizeRelevance !== false; // Default: true
  }

  /**
   * Initialize or retrieve conversation for the current session
   */
  async initializeConversation() {
    try {
      // Try to find existing conversation
      this.conversation = await Conversation.findOne({
        sessionId: this.sessionId,
      }).populate({
        path: "messages",
        options: { sort: { timestamp: 1 } },
      });

      // If no conversation exists, create a new one
      if (!this.conversation) {
        this.conversation = new Conversation({
          sessionId: this.sessionId,
          title: "Shopify Support Chat",
        });
        await this.conversation.save();
        console.log(`✅ Created new conversation: ${this.sessionId}`);
      } else {
        console.log(`✅ Retrieved existing conversation: ${this.sessionId}`);
      }

      return this.conversation;
    } catch (error) {
      console.error("❌ Error initializing conversation:", error);
      throw error;
    }
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(role, content, metadata = {}) {
    try {
      if (!this.conversation) {
        await this.initializeConversation();
      }

      // Create new message
      const message = new Message({
        conversationId: this.conversation._id,
        role,
        content,
        metadata,
      });

      await message.save();

      // Add message to conversation
      await this.conversation.addMessage(message._id);

      console.log(`✅ Added ${role} message to conversation`);
      return message;
    } catch (error) {
      console.error("❌ Error adding message:", error);
      throw error;
    }
  }

  /**
   * Get recent messages for context (sliding window)
   */
  async getRecentMessages() {
    try {
      if (!this.conversation) {
        await this.initializeConversation();
      }

      // Populate messages and get recent ones
      await this.conversation.populate({
        path: "messages",
        options: {
          sort: { timestamp: -1 },
          limit: this.windowSize,
        },
      });

      // Reverse to get chronological order
      const recentMessages = this.conversation.messages.reverse();

      console.log(
        `📝 Retrieved ${recentMessages.length} recent messages for context`
      );
      return recentMessages.map((msg) => msg.getFormattedMessage());
    } catch (error) {
      console.error("❌ Error getting recent messages:", error);
      return [];
    }
  }

  /**
   * Get token-aware context window (prioritizes recent + relevant messages)
   * @param {Array} retrievedDocs - Retrieved documents from RAG
   * @param {string} systemPrompt - System prompt text
   * @returns {Object} - Optimized context with token usage info
   */
  async getTokenAwareContext(retrievedDocs = [], systemPrompt = "") {
    try {
      if (!this.conversation) {
        await this.initializeConversation();
      }

      // Get all messages first
      await this.conversation.populate({
        path: "messages",
        options: { sort: { timestamp: 1 } },
      });

      const allMessages = this.conversation.messages.map((msg) =>
        msg.getFormattedMessage()
      );

      // Calculate token usage
      const contextSize = this.tokenCounter.estimateContextSize(
        allMessages,
        retrievedDocs,
        systemPrompt
      );

      console.log(`🔍 Context Analysis:`);
      console.log(`   Messages: ${contextSize.messageTokens} tokens`);
      console.log(`   Documents: ${contextSize.documentTokens} tokens`);
      console.log(`   System: ${contextSize.systemTokens} tokens`);
      console.log(`   Total: ${contextSize.totalTokens} tokens`);

      // Check if we need to truncate
      const limitCheck = this.tokenCounter.checkTokenLimit(
        contextSize.totalTokens,
        this.maxTokens
      );

      if (!limitCheck.exceeds) {
        console.log(`✅ Context within limits (${limitCheck.percentage}%)`);
        return {
          messages: allMessages,
          documents: retrievedDocs,
          systemPrompt,
          tokenUsage: contextSize,
          limitCheck,
          truncated: false,
        };
      }

      console.log(
        `⚠️ Context exceeds limit by ${
          limitCheck.totalTokens - this.maxTokens
        } tokens`
      );

      // Apply token-aware windowing strategy
      const optimizedContext = await this.applyTokenWindowing(
        allMessages,
        retrievedDocs,
        systemPrompt
      );

      return optimizedContext;
    } catch (error) {
      console.error("❌ Error getting token-aware context:", error);
      // Fallback to simple windowing
      const recentMessages = await this.getRecentMessages();
      return {
        messages: recentMessages,
        documents: retrievedDocs,
        systemPrompt,
        tokenUsage: { totalTokens: 0 },
        limitCheck: { exceeds: false },
        truncated: false,
        error: error.message,
      };
    }
  }

  /**
   * Apply token-aware windowing strategy
   * @param {Array} allMessages - All conversation messages
   * @param {Array} retrievedDocs - Retrieved documents
   * @param {string} systemPrompt - System prompt
   * @returns {Object} - Optimized context
   */
  async applyTokenWindowing(allMessages, retrievedDocs, systemPrompt) {
    const systemTokens = this.tokenCounter.countTokens(systemPrompt);
    const availableTokens = this.maxTokens - systemTokens;

    console.log(`🎯 Applying token windowing strategy:`);
    console.log(
      `   Available tokens: ${availableTokens} (${this.maxTokens} - ${systemTokens} system)`
    );

    // Strategy 1: Prioritize most recent messages
    let selectedMessages = [];
    let selectedDocs = [];
    let currentTokens = 0;

    if (this.prioritizeRecent) {
      // Start with most recent messages
      const recentMessages = [...allMessages].reverse();

      for (const message of recentMessages) {
        const messageTokens = this.tokenCounter.countMessageTokens(message);

        if (currentTokens + messageTokens <= availableTokens * 0.7) {
          // Reserve 30% for docs
          selectedMessages.unshift(message); // Keep chronological order
          currentTokens += messageTokens;
        } else {
          break;
        }
      }
    }

    // Strategy 2: Add most relevant documents
    if (this.prioritizeRelevance && retrievedDocs.length > 0) {
      const remainingTokens = availableTokens - currentTokens;

      // Sort documents by relevance score (if available)
      const sortedDocs = [...retrievedDocs].sort((a, b) => {
        const scoreA = a.metadata?.score || a.score || 0;
        const scoreB = b.metadata?.score || b.score || 0;
        return scoreB - scoreA;
      });

      for (const doc of sortedDocs) {
        const docTokens = this.tokenCounter.countDocumentsTokens([doc]);

        if (currentTokens + docTokens <= availableTokens) {
          selectedDocs.push(doc);
          currentTokens += docTokens;
        } else {
          break;
        }
      }
    }

    // Final token calculation
    const finalContextSize = this.tokenCounter.estimateContextSize(
      selectedMessages,
      selectedDocs,
      systemPrompt
    );

    const finalLimitCheck = this.tokenCounter.checkTokenLimit(
      finalContextSize.totalTokens,
      this.maxTokens
    );

    console.log(`✅ Token windowing complete:`);
    console.log(
      `   Selected messages: ${selectedMessages.length}/${allMessages.length}`
    );
    console.log(
      `   Selected documents: ${selectedDocs.length}/${retrievedDocs.length}`
    );
    console.log(
      `   Final tokens: ${finalContextSize.totalTokens}/${this.maxTokens}`
    );

    return {
      messages: selectedMessages,
      documents: selectedDocs,
      systemPrompt,
      tokenUsage: finalContextSize,
      limitCheck: finalLimitCheck,
      truncated: true,
      windowingStrategy: {
        prioritizeRecent: this.prioritizeRecent,
        prioritizeRelevance: this.prioritizeRelevance,
        originalMessageCount: allMessages.length,
        originalDocCount: retrievedDocs.length,
        selectedMessageCount: selectedMessages.length,
        selectedDocCount: selectedDocs.length,
      },
    };
  }

  /**
   * Get conversation history for retrieval query reformulation
   */
  async getConversationContext() {
    try {
      const recentMessages = await this.getRecentMessages();

      if (recentMessages.length === 0) {
        return "";
      }

      // Format messages for context
      const context = recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      return `Previous conversation context:\n${context}\n\n`;
    } catch (error) {
      console.error("❌ Error getting conversation context:", error);
      return "";
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory() {
    try {
      if (!this.conversation) {
        return;
      }

      // Delete all messages in this conversation
      await Message.deleteMany({
        conversationId: this.conversation._id,
      });

      // Clear messages array in conversation
      this.conversation.messages = [];
      await this.conversation.save();

      console.log("✅ Conversation history cleared");
    } catch (error) {
      console.error("❌ Error clearing history:", error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    try {
      if (!this.conversation) {
        await this.initializeConversation();
      }

      const messageCount = await Message.countDocuments({
        conversationId: this.conversation._id,
      });

      // Get token usage stats
      const recentMessages = await this.getRecentMessages();
      const tokenStats = this.tokenCounter.estimateContextSize(recentMessages);

      return {
        sessionId: this.sessionId,
        messageCount,
        windowSize: this.windowSize,
        conversationId: this.conversation._id,
        createdAt: this.conversation.createdAt,
        updatedAt: this.conversation.updatedAt,

        // Token-aware stats
        tokenConfig: {
          maxTokens: this.maxTokens,
          modelName: this.modelName,
          prioritizeRecent: this.prioritizeRecent,
          prioritizeRelevance: this.prioritizeRelevance,
        },
        currentTokenUsage: {
          messageTokens: tokenStats.messageTokens,
          totalTokens: tokenStats.totalTokens,
          percentage:
            Math.round((tokenStats.totalTokens / this.maxTokens) * 100 * 100) /
            100,
        },
        tokenCounterStats: this.tokenCounter.getStats(),
      };
    } catch (error) {
      console.error("❌ Error getting stats:", error);
      return null;
    }
  }

  /**
   * Update conversation title based on first user message
   */
  async updateTitle(firstUserMessage) {
    try {
      if (!this.conversation) {
        return;
      }

      // Generate a title from the first user message (first 50 chars)
      const title =
        firstUserMessage.length > 50
          ? firstUserMessage.substring(0, 50) + "..."
          : firstUserMessage;

      this.conversation.title = title;
      await this.conversation.save();

      console.log(`✅ Updated conversation title: ${title}`);
    } catch (error) {
      console.error("❌ Error updating title:", error);
    }
  }
}

export default BufferWindowMemory;
