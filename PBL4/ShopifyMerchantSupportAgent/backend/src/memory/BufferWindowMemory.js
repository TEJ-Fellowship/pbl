import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { v4 as uuidv4 } from "uuid";

class BufferWindowMemory {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 8; // Last 8 messages (4 turns)
    this.sessionId = options.sessionId || uuidv4();
    this.conversation = null;
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

      return {
        sessionId: this.sessionId,
        messageCount,
        windowSize: this.windowSize,
        conversationId: this.conversation._id,
        createdAt: this.conversation.createdAt,
        updatedAt: this.conversation.updatedAt,
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
