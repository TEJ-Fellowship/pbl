import { BufferWindowMemory } from "langchain/memory";
import Conversation from "../../models/Conversation.js";

class MongoDBBufferWindowMemory extends BufferWindowMemory {
  constructor(sessionId, options = {}) {
    super({
      k: options.k || 8, // Last 8 messages (4 turns)
      returnMessages: true,
      inputKey: "input",
      outputKey: "output",
      memoryKey: "history",
      ...options,
    });

    this.sessionId = sessionId;
    this.maxTokens = options.maxTokens || 6000;
  }

  async loadMemoryVariables(inputs) {
    try {
      // Load conversation from MongoDB
      const conversation = await Conversation.findOne({
        sessionId: this.sessionId,
      }).sort({ "messages.timestamp": -1 });

      if (!conversation || !conversation.messages.length) {
        return { [this.memoryKey]: [] };
      }

      // Convert MongoDB messages to LangChain format
      const messages = conversation.messages
        .slice(-this.k) // Get last k messages
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          sources: msg.sources || [],
        }));

      return { [this.memoryKey]: messages };
    } catch (error) {
      console.error("Error loading memory variables:", error);
      return { [this.memoryKey]: [] };
    }
  }

  async saveContext(inputs, outputs) {
    try {
      const input = inputs[this.inputKey];
      const output = outputs[this.outputKey];

      if (!input || !output) {
        return;
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        sessionId: this.sessionId,
      });

      if (!conversation) {
        conversation = new Conversation({
          sessionId: this.sessionId,
          messages: [],
        });
      }

      // Add user message
      conversation.messages.push({
        role: "user",
        content: input,
        timestamp: new Date(),
      });

      // Add assistant message
      conversation.messages.push({
        role: "assistant",
        content: output,
        timestamp: new Date(),
        sources: outputs.sources || [],
      });

      // Keep only last k messages
      if (conversation.messages.length > this.k) {
        conversation.messages = conversation.messages.slice(-this.k);
      }

      await conversation.save();
    } catch (error) {
      console.error("Error saving context:", error);
    }
  }

  async clear() {
    try {
      await Conversation.deleteOne({ sessionId: this.sessionId });
    } catch (error) {
      console.error("Error clearing memory:", error);
    }
  }

  async getConversationHistory() {
    try {
      const conversation = await Conversation.findOne({
        sessionId: this.sessionId,
      }).sort({ "messages.timestamp": 1 });

      return conversation ? conversation.messages : [];
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return [];
    }
  }

  async updateFeedback(messageIndex, feedback) {
    try {
      const conversation = await Conversation.findOne({
        sessionId: this.sessionId,
      });

      if (conversation && conversation.messages[messageIndex]) {
        conversation.messages[messageIndex].feedback = {
          helpful: feedback.helpful,
          timestamp: new Date(),
        };
        await conversation.save();
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  }
}

export default MongoDBBufferWindowMemory;
