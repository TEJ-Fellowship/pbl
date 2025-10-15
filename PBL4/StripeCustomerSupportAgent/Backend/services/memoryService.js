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
      await this.memoryController.close();
      console.log(`✅ Session ${sessionId} deleted successfully`);
    } catch (error) {
      console.error("❌ Memory service - delete session error:", error);
      throw error;
    }
  }

  /**
   * Get session summary
   */
  async getSessionSummary(sessionId) {
    try {
      const summary = await this.memoryController.createConversationSummary();
      return {
        sessionId,
        summary: summary.summary,
        keyTopics: summary.keyTopics,
        createdAt: new Date().toISOString(),
      };
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
}

// Export singleton instance
export const memoryService = new MemoryService();
