import EnhancedChatService from "../src/services/EnhancedChatService.js";

class ChatController {
  constructor() {
    this.chatService = new EnhancedChatService();
  }

  /**
   * POST /api/chat - Send message and get response
   */
  async sendMessage(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      // Generate session ID if not provided
      const currentSessionId =
        sessionId || this.chatService.generateSessionId();

      // Process message with memory and context windowing
      const result = await this.chatService.processMessage(
        currentSessionId,
        message
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Chat controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * GET /api/history/:sessionId - Get conversation history
   */
  async getHistory(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required",
        });
      }

      const history = await this.chatService.getConversationHistory(sessionId);

      res.json({
        success: true,
        data: {
          sessionId,
          messages: history,
        },
      });
    } catch (error) {
      console.error("History controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * POST /api/feedback - Update message feedback
   */
  async updateFeedback(req, res) {
    try {
      const { sessionId, messageIndex, feedback } = req.body;

      if (!sessionId || messageIndex === undefined || !feedback) {
        return res.status(400).json({
          success: false,
          error: "Session ID, message index, and feedback are required",
        });
      }

      await this.chatService.updateFeedback(sessionId, messageIndex, feedback);

      res.json({
        success: true,
        message: "Feedback updated successfully",
      });
    } catch (error) {
      console.error("Feedback controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * DELETE /api/chat/:sessionId - Clear conversation history
   */
  async clearConversation(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID is required",
        });
      }

      await this.chatService.clearConversation(sessionId);

      res.json({
        success: true,
        message: "Conversation cleared successfully",
      });
    } catch (error) {
      console.error("Clear conversation controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * POST /api/session - Generate new session
   */
  async createSession(req, res) {
    try {
      const sessionId = this.chatService.generateSessionId();

      res.json({
        success: true,
        data: {
          sessionId,
        },
      });
    } catch (error) {
      console.error("Create session controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export default ChatController;
