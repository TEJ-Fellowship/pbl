import { getEncoding } from "js-tiktoken";

/**
 * TokenCounter utility class for accurate token measurement
 * Uses js-tiktoken to count tokens for different models
 */
class TokenCounter {
  constructor(modelName = "gpt-3.5-turbo") {
    this.modelName = modelName;
    this.encoding = null;
    this.initializeEncoding();
  }

  /**
   * Initialize the encoding for the specified model
   */
  initializeEncoding() {
    try {
      // Use cl100k_base encoding which works well for most models
      this.encoding = getEncoding("cl100k_base");

      console.log(
        `✅ TokenCounter initialized for model: ${this.modelName} (cl100k_base)`
      );
    } catch (error) {
      console.error("❌ Failed to initialize token encoding:", error);
      throw new Error("Unable to initialize token encoding");
    }
  }

  /**
   * Count tokens in a text string
   * @param {string} text - The text to count tokens for
   * @returns {number} - Number of tokens
   */
  countTokens(text) {
    if (!text || typeof text !== "string") {
      return 0;
    }

    try {
      const tokens = this.encoding.encode(text);
      return tokens.length;
    } catch (error) {
      console.error("❌ Error counting tokens:", error);
      // Fallback: rough estimation (1 token ≈ 4 characters for English)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Count tokens in multiple text strings
   * @param {string[]} texts - Array of text strings
   * @returns {number} - Total number of tokens
   */
  countTokensMultiple(texts) {
    if (!Array.isArray(texts)) {
      return 0;
    }

    return texts.reduce((total, text) => total + this.countTokens(text), 0);
  }

  /**
   * Count tokens in a message object
   * @param {Object} message - Message object with role and content
   * @returns {number} - Number of tokens
   */
  countMessageTokens(message) {
    if (!message || typeof message !== "object") {
      return 0;
    }

    const roleTokens = this.countTokens(message.role || "");
    const contentTokens = this.countTokens(message.content || "");

    // Add overhead for message formatting (role: content\n)
    const formattingOverhead = 3; // ": " + "\n"

    return roleTokens + contentTokens + formattingOverhead;
  }

  /**
   * Count tokens in an array of messages
   * @param {Array} messages - Array of message objects
   * @returns {number} - Total number of tokens
   */
  countMessagesTokens(messages) {
    if (!Array.isArray(messages)) {
      return 0;
    }

    return messages.reduce(
      (total, message) => total + this.countMessageTokens(message),
      0
    );
  }

  /**
   * Count tokens in retrieved documents
   * @param {Array} documents - Array of document objects
   * @returns {number} - Total number of tokens
   */
  countDocumentsTokens(documents) {
    if (!Array.isArray(documents)) {
      return 0;
    }

    return documents.reduce((total, doc) => {
      const titleTokens = this.countTokens(doc.title || "");
      const contentTokens = this.countTokens(doc.content || "");
      const metadataTokens = this.countTokens(
        JSON.stringify(doc.metadata || {})
      );

      // Add overhead for document formatting
      const formattingOverhead = 10; // "Title: " + "\nContent: " + "\nMetadata: " + "\n\n"

      return (
        total +
        titleTokens +
        contentTokens +
        metadataTokens +
        formattingOverhead
      );
    }, 0);
  }

  /**
   * Estimate total context size including conversation and retrieved docs
   * @param {Array} messages - Conversation messages
   * @param {Array} documents - Retrieved documents
   * @param {string} systemPrompt - System prompt text
   * @returns {Object} - Token counts breakdown
   */
  estimateContextSize(messages = [], documents = [], systemPrompt = "") {
    const messageTokens = this.countMessagesTokens(messages);
    const documentTokens = this.countDocumentsTokens(documents);
    const systemTokens = this.countTokens(systemPrompt);

    const totalTokens = messageTokens + documentTokens + systemTokens;

    return {
      messageTokens,
      documentTokens,
      systemTokens,
      totalTokens,
      breakdown: {
        messages: `${messageTokens} tokens`,
        documents: `${documentTokens} tokens`,
        systemPrompt: `${systemTokens} tokens`,
        total: `${totalTokens} tokens`,
      },
    };
  }

  /**
   * Check if context exceeds token limit
   * @param {number} totalTokens - Total token count
   * @param {number} maxTokens - Maximum allowed tokens (default: 6000)
   * @returns {Object} - Exceed status and recommendations
   */
  checkTokenLimit(totalTokens, maxTokens = 6000) {
    const exceeds = totalTokens > maxTokens;
    const percentage = (totalTokens / maxTokens) * 100;

    return {
      exceeds,
      totalTokens,
      maxTokens,
      percentage: Math.round(percentage * 100) / 100,
      recommendation: exceeds
        ? `Context exceeds limit by ${
            totalTokens - maxTokens
          } tokens (${percentage.toFixed(
            1
          )}%). Consider truncating conversation history or reducing retrieved documents.`
        : `Context is within limits (${percentage.toFixed(
            1
          )}% of ${maxTokens} tokens).`,
    };
  }

  /**
   * Get token usage statistics
   * @returns {Object} - Usage statistics
   */
  getStats() {
    return {
      modelName: this.modelName,
      encodingName: this.encoding?.name || "unknown",
      initialized: !!this.encoding,
    };
  }
}

export default TokenCounter;
