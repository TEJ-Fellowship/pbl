/**
 * BufferWindowMemory Service
 * Implements sliding window memory for recent conversation context
 * Maintains last 8 messages (4 turns) for conversational flow
 */

class BufferWindowMemory {
  constructor(maxMessages = 8) {
    this.maxMessages = maxMessages;
    this.messages = [];
    this.sessionId = null;
  }

  /**
   * Initialize memory with session ID
   */
  initialize(sessionId) {
    this.sessionId = sessionId;
    this.messages = [];
    console.log(`🧠 BufferWindowMemory initialized for session: ${sessionId}`);
  }

  /**
   * Add a message to the buffer
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role, // 'user', 'assistant', 'system'
      content,
      timestamp: new Date(),
      metadata,
    };

    this.messages.push(message);

    // Maintain sliding window
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    console.log(
      `📝 Added ${role} message to buffer (${this.messages.length}/${this.maxMessages})`
    );
    return message;
  }

  /**
   * Get recent messages (last 8 messages or 4 turns)
   */
  getRecentMessages() {
    return [...this.messages];
  }

  /**
   * Get messages by role
   */
  getMessagesByRole(role) {
    return this.messages.filter((msg) => msg.role === role);
  }

  /**
   * Get conversation context as formatted string
   */
  getContextString() {
    if (this.messages.length === 0) {
      return "No recent conversation context.";
    }

    return this.messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");
  }

  /**
   * Get last user message
   */
  getLastUserMessage() {
    const userMessages = this.getMessagesByRole("user");
    return userMessages.length > 0
      ? userMessages[userMessages.length - 1]
      : null;
  }

  /**
   * Get last assistant message
   */
  getLastAssistantMessage() {
    const assistantMessages = this.getMessagesByRole("assistant");
    return assistantMessages.length > 0
      ? assistantMessages[assistantMessages.length - 1]
      : null;
  }

  /**
   * Check if buffer has recent context
   */
  hasRecentContext() {
    return this.messages.length > 0;
  }

  /**
   * Get conversation summary for context
   */
  getConversationSummary() {
    if (this.messages.length === 0) {
      return "No conversation history.";
    }

    const userMessages = this.getMessagesByRole("user");
    const assistantMessages = this.getMessagesByRole("assistant");

    return {
      totalMessages: this.messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      lastUserMessage: this.getLastUserMessage()?.content || null,
      lastAssistantMessage: this.getLastAssistantMessage()?.content || null,
      conversationFlow: this.messages.map((msg) => ({
        role: msg.role,
        content:
          msg.content.substring(0, 100) +
          (msg.content.length > 100 ? "..." : ""),
        timestamp: msg.timestamp,
      })),
    };
  }

  /**
   * Clear the buffer
   */
  clear() {
    this.messages = [];
    console.log(`🧹 BufferWindowMemory cleared for session: ${this.sessionId}`);
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messages.length,
      maxMessages: this.maxMessages,
      hasContext: this.hasRecentContext(),
      lastMessageTime:
        this.messages.length > 0
          ? this.messages[this.messages.length - 1].timestamp
          : null,
    };
  }

  /**
   * Export messages for persistence
   */
  exportMessages() {
    return {
      sessionId: this.sessionId,
      messages: this.messages,
      exportedAt: new Date(),
    };
  }

  /**
   * Import messages from persistence
   */
  importMessages(data) {
    if (data.sessionId) {
      this.sessionId = data.sessionId;
    }

    if (data.messages && Array.isArray(data.messages)) {
      this.messages = data.messages.slice(-this.maxMessages);
      console.log(`📥 Imported ${this.messages.length} messages to buffer`);
    }
  }
}

export default BufferWindowMemory;