class Validators {
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateApiKey(apiKey) {
    return apiKey && apiKey.length > 10;
  }

  static validateText(text) {
    return text && typeof text === "string" && text.trim().length > 0;
  }

  static validateChunkSize(size) {
    return size && size > 0 && size <= 2000;
  }

  static validateEmbedding(embedding) {
    return Array.isArray(embedding) && embedding.length > 0;
  }

  static validateQuery(query) {
    if (!this.validateText(query)) {
      return { valid: false, error: "Query must be a non-empty string" };
    }

    if (query.length < 3) {
      return {
        valid: false,
        error: "Query must be at least 3 characters long",
      };
    }

    if (query.length > 500) {
      return { valid: false, error: "Query must be less than 500 characters" };
    }

    return { valid: true };
  }

  static validateDocument(document) {
    if (!this.validateText(document.content || document.text)) {
      return { valid: false, error: "Document content is required" };
    }

    if (!document.url) {
      return { valid: false, error: "Document URL is required" };
    }

    if (!this.validateUrl(document.url)) {
      return { valid: false, error: "Invalid document URL" };
    }

    return { valid: true };
  }

  static sanitizeInput(input) {
    if (typeof input !== "string") {
      return "";
    }

    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  static validateConfig(config) {
    const errors = [];

    if (!config.gemini?.apiKey) {
      errors.push("Gemini API key is required");
    }

    if (!config.chroma?.dbPath) {
      errors.push("ChromaDB path is required");
    }

    if (!config.textProcessing?.maxChunkSize) {
      errors.push("Max chunk size is required");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}

export default Validators;
