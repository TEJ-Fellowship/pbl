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

      // Check token usage before processing (if session exists)
      if (sessionId) {
        const tokenUsage = await memoryService.getSessionTokenUsage(sessionId);
        if (tokenUsage && tokenUsage.token_usage_percentage >= 95) {
          console.log("⚠️ Token limit reached, creating new session...");
          // Create new session
          const newSession = await memoryService.createSession(userId, {
            project: "stripe_support",
            context: "customer_support",
            startTime: new Date().toISOString(),
          });
          sessionId = newSession.sessionId;
          console.log(`   🆕 New session created: ${sessionId}`);
        }
      }

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

      // Send response without creating any files
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

  /**
   * Get session token usage
   */
  async getTokenUsage(req, res) {
    try {
      const { sessionId } = req.params;

      console.log(`📊 Getting token usage for session: ${sessionId}`);

      const tokenUsage = await memoryService.getSessionTokenUsage(sessionId);

      if (!tokenUsage) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: tokenUsage.session_id,
          currentTokens: tokenUsage.total_tokens || 0,
          maxTokens: tokenUsage.max_tokens || 4000,
          usagePercentage: tokenUsage.token_usage_percentage || 0,
          isNearLimit: (tokenUsage.token_usage_percentage || 0) >= 80,
          isAtLimit: (tokenUsage.token_usage_percentage || 0) >= 95,
        },
      });
    } catch (error) {
      console.error("❌ Get token usage error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get token usage",
        message: error.message,
      });
    }
  },

  /**
   * Update session token limit
   */
  async updateTokenLimit(req, res) {
    try {
      const { sessionId } = req.params;
      const { maxTokens } = req.body;

      console.log(
        `📊 Updating token limit for session: ${sessionId} to ${maxTokens}`
      );

      await memoryService.updateSessionTokenLimit(sessionId, maxTokens);

      res.json({
        success: true,
        message: "Token limit updated successfully",
        data: {
          sessionId,
          maxTokens,
        },
      });
    } catch (error) {
      console.error("❌ Update token limit error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update token limit",
        message: error.message,
      });
    }
  },

  /**
   * Get all conversation sessions for a user
   */
  async getAllSessions(req, res) {
    try {
      const { userId = "web_user", limit = 50, offset = 0 } = req.query;

      console.log(`📚 Getting all sessions for user: ${userId}`);
      console.log(`📋 Request params: limit=${limit}, offset=${offset}`);

      const sessions = await memoryService.getAllSessions(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      console.log(`📊 Sessions result:`, {
        sessionCount: sessions.length,
        userId,
      });

      res.json({
        success: true,
        data: {
          sessions,
          userId,
          totalCount: sessions.length,
        },
      });
    } catch (error) {
      console.error("❌ Get all sessions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve sessions",
        message: error.message,
      });
    }
  },

  /**
   * Get detailed information about a specific session
   */
  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      console.log(`📋 Getting session details for: ${sessionId}`);

      const sessionDetails = await memoryService.getSessionDetails(sessionId);

      if (!sessionDetails) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }

      console.log(`📊 Session details:`, {
        sessionId: sessionDetails.sessionId,
        messageCount: sessionDetails.messageCount,
        hasSummary: !!sessionDetails.conversationSummary,
      });

      res.json({
        success: true,
        data: sessionDetails,
      });
    } catch (error) {
      console.error("❌ Get session details error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve session details",
        message: error.message,
      });
    }
  },

  /**
   * Transfer a specific session to a different user
   */
  async transferSession(req, res) {
    try {
      const { sessionId, newUserId } = req.body;

      if (!sessionId || !newUserId) {
        return res.status(400).json({
          success: false,
          error: "Session ID and new user ID are required",
        });
      }

      console.log(`🔄 Transferring session ${sessionId} to user ${newUserId}`);

      const result = await memoryService.transferSessionToUser(
        sessionId,
        newUserId
      );

      res.json({
        success: true,
        data: {
          sessionId: result.session.session_id,
          userId: result.session.user_id,
          message: "Session transferred successfully",
        },
      });
    } catch (error) {
      console.error("❌ Transfer session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to transfer session",
        message: error?.message || String(error) || "Unknown error",
      });
    }
  },
};
