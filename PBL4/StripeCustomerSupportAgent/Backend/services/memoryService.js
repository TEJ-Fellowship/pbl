import MemoryController from "../controllers/memoryController.js";

class MemoryService {
  constructor() {
    this.memoryController = new MemoryController();
  }

  /**
   * Create a new chat session
   */
  async createSession(userId, context = {}) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      await this.memoryController.initializeSession(sessionId, userId, {
        project: "stripe_support",
        context: "customer_support",
        startTime: new Date().toISOString(),
        ...context,
      });

      return {
        sessionId,
        userId,
        createdAt: new Date().toISOString(),
        context,
      };
    } catch (error) {
      console.error("❌ Memory service - create session error:", error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session - FIXED VERSION
   */
  async getConversationHistory(sessionId, limit = 50, offset = 0) {
    try {
      console.log(
        `📚 Retrieving conversation history for session: ${sessionId}`
      );

      // CRITICAL FIX: Initialize the session in memory controller first
      console.log(`🔄 Initializing session in memory controller: ${sessionId}`);
      await this.memoryController.initializeSession(sessionId, "web_user", {
        project: "stripe_support",
        context: "customer_support",
      });

      // Get messages directly from PostgreSQL database
      const messages =
        await this.memoryController.postgresMemory.getConversationHistory(
          sessionId,
          limit
        );

      console.log(`📊 Found ${messages.length} messages in database`);
      console.log(`📋 Raw messages:`, messages.slice(0, 2)); // Log first 2 messages for debugging

      // Format messages for frontend
      const formattedMessages = messages.map((msg) => ({
        id: msg.message_id,
        type: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        metadata: msg.metadata,
      }));

      console.log(`🔄 Formatted messages:`, formattedMessages.slice(0, 2)); // Log first 2 formatted messages

      return {
        messages: formattedMessages,
        totalCount: formattedMessages.length,
        hasMore: formattedMessages.length >= limit,
        sessionId,
      };
    } catch (error) {
      console.error("❌ Memory service - get history error:", error);
      throw error;
    }
  }

  /**
   * Delete a session and its memory
   */
  async deleteSession(sessionId) {
    try {
      console.log(`🗑️ Deleting session: ${sessionId}`);

      // Delete from PostgreSQL database
      const result = await this.memoryController.postgresMemory.deleteSession(
        sessionId
      );

      console.log(`✅ Session deleted successfully: ${sessionId}`);
      return result;
    } catch (error) {
      console.error("❌ Memory service - delete session error:", error);
      throw error;
    }
  }

  /**
   * Get session summary
   * Retrieves existing summary, or creates one if it doesn't exist
   */
  async getSessionSummary(sessionId, createIfMissing = false) {
    try {
      // Initialize session in memory controller to ensure it's set up
      await this.memoryController.initializeSession(sessionId, "web_user", {
        project: "stripe_support",
        context: "customer_support",
      });

      // Try to get existing summary
      const existingSummary =
        await this.memoryController.postgresMemory.getConversationSummary(
          sessionId
        );

      if (existingSummary) {
        console.log(`📝 Retrieved existing summary for session: ${sessionId}`);
        return {
          sessionId,
          summary: existingSummary.summary_text,
          keyTopics: existingSummary.key_topics || [],
          createdAt: existingSummary.created_at,
        };
      }

      // If no summary exists and createIfMissing is true, create one
      if (createIfMissing) {
        console.log(
          `📝 No summary found, creating new summary for session: ${sessionId}`
        );
        const newSummary =
          await this.memoryController.createConversationSummary();
        return {
          sessionId,
          summary: newSummary.summary_text,
          keyTopics: newSummary.key_topics || [],
          createdAt: newSummary.created_at,
        };
      }

      // Return null if no summary exists and we're not creating one
      return null;
    } catch (error) {
      console.error("❌ Memory service - get summary error:", error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    try {
      const recentContext = await this.memoryController.getRecentContext();
      const longTermContext = await this.memoryController.getLongTermContext();

      return {
        recentMessages: recentContext?.messageCount || 0,
        relevantQAs: longTermContext?.relevantQAs?.length || 0,
        hasContext: recentContext?.hasContext || false,
        hasLongTermContext: longTermContext?.hasLongTermContext || false,
      };
    } catch (error) {
      console.error("❌ Memory service - get stats error:", error);
      throw error;
    }
  }

  /**
   * Get session token usage
   */
  async getSessionTokenUsage(sessionId) {
    try {
      // Try database first
      return await this.memoryController.postgresMemory.getSessionTokenUsage(
        sessionId
      );
    } catch (error) {
      console.error("❌ Memory service - get token usage error:", error);

      // Fallback to chat service in-memory counting
      try {
        const { chatService } = await import("./chatService.js");
        return chatService.getSessionTokenUsage(sessionId);
      } catch (fallbackError) {
        console.error("❌ Fallback token counting failed:", fallbackError);
        // Final fallback to default values
        return {
          sessionId,
          currentTokens: 0,
          maxTokens: 4000,
          usagePercentage: 0,
          isNearLimit: false,
          isAtLimit: false,
        };
      }
    }
  }

  /**
   * Update session token limit
   */
  async updateSessionTokenLimit(sessionId, maxTokens) {
    try {
      return await this.memoryController.postgresMemory.updateSessionTokenLimit(
        sessionId,
        maxTokens
      );
    } catch (error) {
      console.error("❌ Memory service - update token limit error:", error);
      throw error;
    }
  }

  /**
   * Get sessions approaching token limit
   */
  async getSessionsNearTokenLimit(threshold = 80) {
    try {
      return await this.memoryController.postgresMemory.getSessionsNearTokenLimit(
        threshold
      );
    } catch (error) {
      console.error(
        "❌ Memory service - get sessions near limit error:",
        error
      );
      throw error;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getAllSessions(userId, limit = 50, offset = 0) {
    try {
      console.log(`📚 Getting all sessions for user: ${userId}`);

      // Get sessions from PostgreSQL through memory controller
      const sessions =
        await this.memoryController.postgresMemory.getAllSessions(
          userId,
          limit,
          offset
        );

      // Format sessions for frontend
      const formattedSessions = sessions.map((session, index) => {
        // Generate a better title from the first user message
        let title = "New Conversation";
        if (session.first_user_message) {
          // Clean and truncate the first user message for title
          const cleanMessage = session.first_user_message
            .replace(/[^\w\s]/g, "") // Remove special characters
            .trim();

          if (cleanMessage.length > 0) {
            title =
              cleanMessage.length > 50
                ? cleanMessage.substring(0, 50) + "..."
                : cleanMessage;
          }
        }

        // Fallback to timestamp-based title if no user message
        if (title === "New Conversation" && session.created_at) {
          const date = new Date(session.created_at);
          title = `Chat ${date.toLocaleDateString()} ${date.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )}`;
        }

        return {
          id: session.id || index + 1,
          sessionId: session.session_id,
          title: title,
          lastMessage: session.last_message || "No messages yet",
          timestamp: new Date(session.updated_at || session.created_at),
          messageCount: session.message_count || 0,
          type: "integrated",
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at || session.created_at),
          isActive: session.is_active,
          hasSummary: !!session.conversation_summary,
        };
      });

      console.log(
        `📊 Found ${formattedSessions.length} sessions for user: ${userId}`
      );
      return formattedSessions;
    } catch (error) {
      console.error("❌ Memory service - get all sessions error:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific session
   */
  async getSessionDetails(sessionId) {
    try {
      console.log(`📋 Getting session details for: ${sessionId}`);

      // Initialize session in memory controller
      await this.memoryController.initializeSession(sessionId, "web_user", {
        project: "stripe_support",
        context: "customer_support_with_mcp",
      });

      // Get session context and stats
      const sessionContext = await this.memoryController.getSessionContext();
      const sessionStats = await this.memoryController.getSessionStats();

      // Get conversation history
      const history = await this.getConversationHistory(sessionId, 50, 0);

      return {
        sessionId,
        userId: "web_user",
        messageCount: history.totalCount || 0,
        messages: history.messages || [],
        conversationSummary: sessionContext?.conversationSummary,
        stats: sessionStats,
        isActive: sessionContext?.isActive || true,
        createdAt:
          sessionContext?.metadata?.startTime || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Memory service - get session details error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
