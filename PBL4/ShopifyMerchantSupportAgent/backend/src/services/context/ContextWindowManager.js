import { encodingForModel } from "js-tiktoken";

class ContextWindowManager {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 6000;
    this.model = options.model || "gpt-3.5-turbo";
    this.encoding = encodingForModel(this.model);
  }

  /**
   * Count tokens in text
   */
  countTokens(text) {
    if (typeof text !== "string") {
      return 0;
    }
    return this.encoding.encode(text).length;
  }

  /**
   * Count tokens in messages array
   */
  countMessageTokens(messages) {
    let totalTokens = 0;

    for (const message of messages) {
      // Count content tokens
      totalTokens += this.countTokens(message.content);

      // Add overhead for message structure (role, etc.)
      totalTokens += 4; // Approximate overhead per message

      // Count source tokens if present
      if (message.sources && Array.isArray(message.sources)) {
        for (const source of message.sources) {
          totalTokens += this.countTokens(source.title || "");
          totalTokens += this.countTokens(source.chunk || "");
        }
      }
    }

    return totalTokens;
  }

  /**
   * Count tokens in retrieved documents
   */
  countDocumentTokens(documents) {
    let totalTokens = 0;

    for (const doc of documents) {
      totalTokens += this.countTokens(doc.pageContent || "");
      totalTokens += this.countTokens(doc.metadata?.title || "");
      totalTokens += this.countTokens(doc.metadata?.source || "");
    }

    return totalTokens;
  }

  /**
   * Truncate conversation history to fit within token limit
   */
  truncateConversation(messages, retrievedDocs = []) {
    const retrievedTokens = this.countDocumentTokens(retrievedDocs);
    const availableTokens = this.maxTokens - retrievedTokens - 1000; // Reserve 1000 tokens for response

    if (availableTokens <= 0) {
      return [];
    }

    // Start with most recent messages and work backwards
    const truncatedMessages = [];
    let currentTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const messageTokens = this.countMessageTokens([messages[i]]);

      if (currentTokens + messageTokens <= availableTokens) {
        truncatedMessages.unshift(messages[i]);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    return truncatedMessages;
  }

  /**
   * Prioritize and truncate retrieved documents
   */
  prioritizeDocuments(documents, maxDocs = 6) {
    // Sort by relevance score (highest first)
    const sortedDocs = documents
      .filter((doc) => doc.metadata && doc.metadata.score !== undefined)
      .sort((a, b) => (b.metadata.score || 0) - (a.metadata.score || 0))
      .slice(0, maxDocs);

    return sortedDocs;
  }

  /**
   * Format context for LLM with token management
   */
  formatContext(messages, retrievedDocs) {
    // Truncate conversation history
    const truncatedMessages = this.truncateConversation(
      messages,
      retrievedDocs
    );

    // Prioritize documents
    const prioritizedDocs = this.prioritizeDocuments(retrievedDocs);

    // Build context string
    let context = "";

    // Add conversation history
    if (truncatedMessages.length > 0) {
      context += "Previous conversation:\n";
      for (const message of truncatedMessages) {
        context += `${message.role}: ${message.content}\n`;
      }
      context += "\n";
    }

    // Add retrieved documents
    if (prioritizedDocs.length > 0) {
      context += "Relevant documentation:\n";
      for (let i = 0; i < prioritizedDocs.length; i++) {
        const doc = prioritizedDocs[i];
        context += `[${i + 1}] ${doc.metadata?.title || "Document"}\n`;
        context += `${doc.pageContent}\n\n`;
      }
    }

    return {
      context,
      messages: truncatedMessages,
      documents: prioritizedDocs,
      tokenCount: this.countTokens(context),
    };
  }

  /**
   * Get context statistics
   */
  getContextStats(messages, retrievedDocs) {
    const messageTokens = this.countMessageTokens(messages);
    const docTokens = this.countDocumentTokens(retrievedDocs);
    const totalTokens = messageTokens + docTokens;

    return {
      messageTokens,
      docTokens,
      totalTokens,
      maxTokens: this.maxTokens,
      utilizationPercent: (totalTokens / this.maxTokens) * 100,
      truncated: totalTokens > this.maxTokens,
    };
  }
}

export default ContextWindowManager;
