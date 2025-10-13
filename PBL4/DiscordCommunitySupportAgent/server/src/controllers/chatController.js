import ChatService from "../services/chatService.js";
import Validators from "../utils/validators.js";

class ChatController {
  constructor() {
    this.chatService = new ChatService();
  }

  async initialize() {
    try {
      await this.chatService.initialize();
      console.log("Chat controller initialized");
    } catch (error) {
      console.error(`Failed to initialize chat controller: ${error.message}`);
      throw error;
    }
  }

  async handleQuery(query) {
    try {
      // Sanitize input
      const sanitizedQuery = Validators.sanitizeInput(query);

      if (!sanitizedQuery) {
        return {
          success: false,
          response: "Please provide a valid question",
          sources: [],
        };
      }

      // Check for common queries first
      const commonResponse = await this.chatService.handleCommonQuery(
        sanitizedQuery
      );
      if (commonResponse) {
        return commonResponse;
      }

      // Process the query
      const result = await this.chatService.processQuery(sanitizedQuery);

      return result;
    } catch (error) {
      console.error(`Chat controller error: ${error.message}`);
      return {
        success: false,
        response: "An error occurred while processing your request",
        sources: [],
      };
    }
  }

  async getHistory() {
    try {
      const history = await this.chatService.getConversationHistory();
      return {
        success: true,
        history: history,
      };
    } catch (error) {
      console.error(`Failed to get history: ${error.message}`);
      return {
        success: false,
        history: [],
      };
    }
  }

  async clearHistory() {
    try {
      this.chatService.clearHistory();
      return {
        success: true,
        message: "Conversation history cleared successfully",
      };
    } catch (error) {
      console.error(`Failed to clear history: ${error.message}`);
      return {
        success: false,
        message: "Failed to clear conversation history",
      };
    }
  }

  async getStats() {
    try {
      const stats = await this.chatService.getStats();
      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      console.error(`Failed to get stats: ${error.message}`);
      return {
        success: false,
        stats: null,
      };
    }
  }
}

export default ChatController;
