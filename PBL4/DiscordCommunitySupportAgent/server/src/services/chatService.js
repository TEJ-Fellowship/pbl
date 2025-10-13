import GeminiConfig from "../config/gemini.js";
import RAGService from "./RAGService.js";

class ChatService {
  constructor() {
    this.gemini = new GeminiConfig();
    this.RAGService = new RAGService();
    this.conversationHistory = [];
  }

  async initialize() {
    try {
      console.log("Initializing chat service...");

      this.gemini.initialize();

      await this.RAGService.initialize();

      console.log("Chat service initialized successfully...");
    } catch (error) {
      console.error("Failed to initialize chat service...");
      throw error;
    }
  }

  async processQuery(query) {
    try {
      console.log(query);

      const context = await this.RAGService.getContextForQuery(query);

      if (!context) {
        return {
          response:
            "I couldn't find relevant information in the Discord support documentation. Please try rephrasing your question or ask about a different topic.",
          sources: [],
          success: false,
        };
      }

      // get response from
      const response = await this.generateResponse(query, context);

      // get source from the response
      const sources = await this.getResponseSources(query);

      this.conversationHistory.push({
        query: query,
        response: response,
        sources: sources,
        timestamp: new Date().toISOString(),
      });

      return {
        response: response,
        sources: sources,
        success: true,
      };
    } catch (error) {
      console.error(`Failed to process query: ${error.message}`);
      return {
        response:
          "Sorry, I encountered an error while processing your question. Please try again.",
        sources: [],
        success: false,
      };
    }
  }

  async generateResponse(query, context) {
    try {
      const systemPrompt = this.getSystemPrompt();
      const fullPrompt = `${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

      try {
        const response = await this.gemini.generateResponse(fullPrompt);
        return this.postProcessResponse(response);
      } catch (error) {
        console.log("Gemini API unavailable, using fallback response");
        return this.generateFallbackResponse(query, context);
      }
    } catch (error) {
      console.error("Failed to generate response: ", error.message);
      throw error;
    }
  }
  generateFallbackResponse(query, context = "") {
    // Simple fallback response based on context
    if (
      context.includes("permission") ||
      query.toLowerCase().includes("permission")
    ) {
      return `Based on the Discord documentation, here's information about permissions:

${context.substring(0, 1000)}...

**Key Points about Discord Permissions:**
- Permissions control what users can do in your server
- You can assign permissions to roles or individual users
- There are different permission categories: General, Text, Voice, Advanced
- Always follow the principle of least privilege when setting permissions

For more detailed information, please refer to the Discord Support Center.`;
    }

    if (context.includes("role") || query.toLowerCase().includes("role")) {
      return `Based on the Discord documentation, here's information about roles:

${context.substring(0, 1000)}...

**Key Points about Discord Roles:**
- Roles help organize your server members
- You can assign different permissions to different roles
- Roles can be used to create hierarchies in your server
- Members can have multiple roles with combined permissions

For more detailed information, please refer to the Discord Support Center.`;
    }

    if (context.includes("oauth") || query.toLowerCase().includes("oauth")) {
      return `Based on the Discord documentation, here's information about OAuth:

${context.substring(0, 1000)}...

**Key Points about Discord OAuth:**
- OAuth2 is used for Discord bot authentication and user authorization
- It allows secure access to Discord APIs without sharing passwords
- There are different OAuth2 scopes for different permissions
- Bot tokens and user tokens work differently in the OAuth2 flow

For more detailed information, please refer to the Discord Developer Documentation.`;
    }

    // Generic fallback
    return `Based on the Discord documentation, here's what I found:

${context.substring(0, 1000)}...

This information comes from Discord's official support documentation. For more detailed guidance, please visit the Discord Support Center or check the specific documentation links provided above.`;
  }

  getSystemPrompt() {
    return `You are a helpful Discord support assistant. Your role is to help Discord server administrators and moderators with:

- Server setup and configuration
- Roles and permissions management
- Moderation tools and techniques
- Bot integration and development
- Community guidelines and safety
- Troubleshooting common issues

Guidelines:
1. Provide clear, step-by-step instructions when possible
2. Use Discord emojis appropriately (⚙️ for settings, 🔒 for permissions, ➕ for adding features)
3. Be friendly and professional
4. If you're unsure about something, say so and suggest checking Discord's official support
5. Focus on practical, actionable advice
6. Use Discord terminology correctly (channels, roles, permissions, etc.)

Format your responses clearly and include relevant Discord emojis where appropriate.`;
  }

  postProcessResponse(response) {
    return (
      response
        // Ensure proper Discord formatting
        .replace(/\*\*(.*?)\*\*/g, "**$1**")
        .replace(/\*(.*?)\*/g, "*$1*")
        .replace(/`(.*?)`/g, "`$1`")
        // Add Discord emojis for common actions
        .replace(/settings/gi, "⚙️ settings")
        .replace(/permissions/gi, "🔒 permissions")
        .replace(/add/gi, "➕ add")
        .replace(/create/gi, "➕ create")
        .replace(/success/gi, "✅ success")
        .replace(/error/gi, "❌ error")
        .replace(/warning/gi, "⚠️ warning")
        .trim()
    );
  }

  async getResponseSources(query) {
    try {
      const searchResults = await this.RAGService.search(query, 3);

      return searchResults.map((result) => ({
        title: result.metadata.title || "Discord Support Documentation",
        url: result.metadata.url || "",
        relevance: Math.round(result.relevanceScore * 100),
      }));
    } catch (error) {
      console.error(`Failed to get sources: ${error.message}`);
      return [];
    }
  }

  async getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
    console.log("Conversation history cleared");
  }

  async getStats() {
    try {
      const ragStats = await this.RAGService.getCollectionStats();
      return {
        totalDocuments: ragStats.totalDocuments,
        conversationLength: this.conversationHistory.length,
        lastQuery:
          this.conversationHistory[this.conversationHistory.length - 1]
            ?.timestamp || null,
      };
    } catch (error) {
      console.error(`Failed to get stats: ${error.message}`);
      return null;
    }
  }

  // Helper method for common Discord queries
  async handleCommonQuery(query) {
    const commonQueries = {
      "how to create channel":
        "To create a channel: ⚙️ Right-click your server → Create Channel → Choose type → Name it → Create Channel",
      "how to add roles":
        "To add roles: ⚙️ Server Settings → Roles → ➕ Create Role → Configure permissions → Save",
      "how to invite bot":
        "To invite a bot: Find bot's invite link → Authorize permissions → Select server → Authorize",
      "moderation commands":
        "Common moderation: /kick, /ban, /timeout, /warn. Use 🔒 proper permissions and ⚙️ moderation settings",
      "server permissions":
        "🔒 Server permissions control what users can do. Check Roles & Permissions in Server Settings",
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, response] of Object.entries(commonQueries)) {
      if (lowerQuery.includes(key)) {
        return {
          response: response,
          sources: [],
          success: true,
          isCommonQuery: true,
        };
      }
    }

    return null;
  }
}

export default ChatService;
