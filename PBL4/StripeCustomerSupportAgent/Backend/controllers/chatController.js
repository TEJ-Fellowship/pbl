import { chatService } from "../services/chatService.js";
import { memoryService } from "../services/memoryService.js";

export const chatController = {
  /**
   * Send a message and get AI response
   */
  async sendMessage(req, res) {
    try {
      const { message, sessionId, userId = "anonymous" } = req.body;

      console.log("💬 New chat request received:");
      console.log(
        `   📝 Message: ${message.substring(0, 100)}${
          message.length > 100 ? "..." : ""
        }`
      );
      console.log(`   👤 User: ${userId}`);
      console.log(`   🆔 Session: ${sessionId || "New session"}`);
      console.log(`   ⏰ Timestamp: ${new Date().toISOString()}`);

      // Process the message through the chat service
      const response = await chatService.processMessage({
        message,
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
      });

      console.log("✅ Chat response generated:");
      console.log(
        `   📊 Response length: ${response.answer.length} characters`
      );
      console.log(`   📚 Sources found: ${response.sources?.length || 0}`);
      console.log(
        `   🎯 Confidence: ${(response.confidence * 100).toFixed(1)}%`
      );
      console.log(`   🆔 Session ID: ${response.sessionId}`);

      res.json({
        success: true,
        data: {
          message: response.answer,
          sources: response.sources,
          confidence: response.confidence,
          sessionId: response.sessionId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Chat controller error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process message",
        message: error.message,
      });
    }
  },

  /**
   * Get conversation history for a session
   */
  async getHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      console.log(`📚 Getting history for session: ${sessionId}`);
      console.log(`📋 Request params: limit=${limit}, offset=${offset}`);

      const history = await memoryService.getConversationHistory(
        sessionId,
        parseInt(limit),
        parseInt(offset)
      );

      console.log(`📊 History result:`, {
        messageCount: history.messages?.length || 0,
        totalCount: history.totalCount,
        hasMore: history.hasMore,
        sessionId: history.sessionId,
      });

      res.json({
        success: true,
        data: {
          sessionId,
          messages: history.messages,
          totalCount: history.totalCount,
          hasMore: history.hasMore,
        },
      });
    } catch (error) {
      console.error("❌ History controller error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve conversation history",
        message: error.message,
      });
    }
  },

  /**
   * Create a new chat session
   */
  async createSession(req, res) {
    try {
      const { userId = "anonymous", context = {} } = req.body;

      console.log(`🆕 Creating new session for user: ${userId}`);

      const session = await memoryService.createSession(userId, {
        project: "stripe_support",
        context: "customer_support",
        ...context,
      });

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          userId: session.userId,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      console.error("❌ Create session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create session",
        message: error.message,
      });
    }
  },

  /**
   * Delete a chat session
   */
  async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      console.log(`🗑️ Deleting session: ${sessionId}`);

      await memoryService.deleteSession(sessionId);

      res.json({
        success: true,
        message: "Session deleted successfully",
      });
    } catch (error) {
      console.error("❌ Delete session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete session",
        message: error.message,
      });
    }
  },
};
