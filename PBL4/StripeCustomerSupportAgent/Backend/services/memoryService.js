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
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 50, offset = 0) {
    try {
      // Get recent context (last 8 messages)
      const recentContext = await this.memoryController.getRecentContext();

      // Get long-term context (relevant Q&As)
      const longTermContext = await this.memoryController.getLongTermContext();

      // Combine and format messages
      const messages = [];

      // Add recent messages
      if (recentContext && recentContext.messages) {
        recentContext.messages.forEach((msg, index) => {
          messages.push({
            id: `recent_${index}`,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp,
            metadata: msg.metadata,
          });
        });
      }

      // Add relevant Q&As from long-term memory
      if (longTermContext && longTermContext.relevantQAs) {
        longTermContext.relevantQAs.forEach((qa, index) => {
          messages.push({
            id: `qa_${index}`,
            type: "qa",
            question: qa.question,
            answer: qa.answer,
            timestamp: qa.timestamp,
            relevance: qa.relevance,
          });
        });
      }

      // Apply pagination
      const paginatedMessages = messages.slice(offset, offset + limit);
      const hasMore = messages.length > offset + limit;

      return {
        messages: paginatedMessages,
        totalCount: messages.length,
        hasMore,
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
