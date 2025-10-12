import { v4 as uuidv4 } from "uuid";

/**
 * Simple in-memory buffer window memory for development/testing
 * Replaces MongoDBBufferWindowMemory when MongoDB is not available
 */
class InMemoryBufferWindowMemory {
  constructor(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.k = options.k || 8; // Last k messages
    this.maxTokens = options.maxTokens || 6000;
    this.messages = [];
    this.feedback = new Map();
  }

  /**
   * Load memory variables (conversation history)
   */
  async loadMemoryVariables({ input }) {
    const history = this.messages.slice(-this.k);
    return { history };
  }

  /**
   * Save context to memory
   */
  async saveContext({ input }, { output, sources }) {
    const timestamp = new Date();

    // Add user message
    this.messages.push({
      role: "user",
      content: input,
      timestamp,
      id: uuidv4(),
    });

    // Add assistant response
    this.messages.push({
      role: "assistant",
      content: output,
      timestamp: new Date(),
      id: uuidv4(),
      sources: sources || [],
    });

    // Keep only last k messages
    if (this.messages.length > this.k) {
      this.messages = this.messages.slice(-this.k);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory() {
    return this.messages;
  }

  /**
   * Update feedback for a message
   */
  async updateFeedback(messageIndex, feedback) {
    if (this.messages[messageIndex]) {
      this.messages[messageIndex].feedback = {
        ...feedback,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clear conversation
   */
  async clear() {
    this.messages = [];
    this.feedback.clear();
  }
}

export default InMemoryBufferWindowMemory;
