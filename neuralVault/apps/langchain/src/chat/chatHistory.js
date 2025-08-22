export class ChatHistory {
  constructor() {
    this.history = [];
    this.maxHistory = 100; // Maximum number of messages to keep
  }

  addMessage(message, response, metadata = {}) {
    const chatEntry = {
      id: this.generateId(),
      message,
      response,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        messageLength: message.length,
        responseLength: response.length,
      },
    };

    this.history.push(chatEntry);

    // Keep only the last maxHistory messages
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    return chatEntry;
  }

  getHistory(limit = null) {
    if (limit) {
      return this.history.slice(-limit);
    }
    return this.history;
  }

  getRecentMessages(count = 5) {
    return this.history.slice(-count);
  }

  getMessageById(id) {
    return this.history.find((entry) => entry.id === id);
  }

  updateMessage(id, updates) {
    const index = this.history.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.history[index] = { ...this.history[index], ...updates };
      return this.history[index];
    }
    return null;
  }

  deleteMessage(id) {
    const index = this.history.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      return this.history.splice(index, 1)[0];
    }
    return null;
  }

  clearHistory() {
    this.history = [];
  }

  getHistoryStats() {
    const totalMessages = this.history.length;
    const totalCharacters = this.history.reduce(
      (sum, entry) => sum + entry.message.length + entry.response.length,
      0
    );
    const averageMessageLength =
      totalMessages > 0 ? Math.round(totalCharacters / (totalMessages * 2)) : 0;

    return {
      totalMessages,
      totalCharacters,
      averageMessageLength,
      oldestMessage: this.history[0]?.timestamp,
      newestMessage: this.history[this.history.length - 1]?.timestamp,
    };
  }

  exportHistory(format = "json") {
    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(this.history, null, 2);
      case "csv":
        return this.exportToCSV();
      case "text":
        return this.exportToText();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV() {
    const headers = ["id", "timestamp", "message", "response"];
    const csvContent = [
      headers.join(","),
      ...this.history.map((entry) =>
        [
          entry.id,
          entry.timestamp,
          `"${entry.message}"`,
          `"${entry.response}"`,
        ].join(",")
      ),
    ].join("\n");

    return csvContent;
  }

  exportToText() {
    return this.history
      .map(
        (entry) =>
          `[${entry.timestamp}] User: ${entry.message}\nAI: ${entry.response}\n`
      )
      .join("\n");
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  searchHistory(query) {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(
      (entry) =>
        entry.message.toLowerCase().includes(lowerQuery) ||
        entry.response.toLowerCase().includes(lowerQuery)
    );
  }
}
