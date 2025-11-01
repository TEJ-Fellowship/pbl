const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Manages multiple Gemini API keys with automatic rotation
 * to handle rate limits and quota exhaustion
 */
class GeminiClientManager {
  constructor() {
    // Load all available API keys from environment
    this.apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter(Boolean); // Remove undefined/null keys

    if (this.apiKeys.length === 0) {
      throw new Error("No Gemini API keys found in environment variables");
    }

    console.log(`🔑 Loaded ${this.apiKeys.length} Gemini API key(s)`);

    // Track which keys are exhausted (429 errors)
    this.exhaustedKeys = new Set();

    // Current key index (round-robin)
    this.currentKeyIndex = 0;

    // Key status tracking: { key: { exhausted: boolean, retryAfter: Date } }
    this.keyStatus = new Map();
    this.apiKeys.forEach((key, index) => {
      this.keyStatus.set(index, {
        exhausted: false,
        retryAfter: null,
      });
    });
  }

  /**
   * Get the next available API key
   * @returns {string|null} API key or null if all exhausted
   */
  getAvailableKey() {
    const startIndex = this.currentKeyIndex;
    let attempts = 0;

    while (attempts < this.apiKeys.length) {
      const index = (startIndex + attempts) % this.apiKeys.length;
      const status = this.keyStatus.get(index);
      const key = this.apiKeys[index];

      // Check if key is not exhausted or retry time has passed
      if (
        !status.exhausted ||
        (status.retryAfter && new Date() >= status.retryAfter)
      ) {
        // Reset if retry time passed
        if (
          status.exhausted &&
          status.retryAfter &&
          new Date() >= status.retryAfter
        ) {
          status.exhausted = false;
          status.retryAfter = null;
          console.log(
            `🔄 Key ${index + 1} retry time passed, marking as available`
          );
        }

        this.currentKeyIndex = (index + 1) % this.apiKeys.length;
        return key;
      }

      attempts++;
    }

    // All keys exhausted
    const nextRetry = Math.min(
      ...Array.from(this.keyStatus.values())
        .filter((s) => s.retryAfter)
        .map((s) => s.retryAfter.getTime())
    );

    if (nextRetry && nextRetry > Date.now()) {
      const waitSeconds = Math.ceil((nextRetry - Date.now()) / 1000);
      console.error(
        `⏳ All API keys exhausted. Next retry available in ${waitSeconds} seconds`
      );
    }

    return null;
  }

  /**
   * Mark a key as exhausted (429 error)
   * @param {string} apiKey - The API key that was exhausted
   * @param {number} retryDelaySeconds - Seconds to wait before retrying (from API response)
   */
  markKeyExhausted(apiKey, retryDelaySeconds = 60) {
    const index = this.apiKeys.indexOf(apiKey);
    if (index === -1) return;

    const status = this.keyStatus.get(index);
    status.exhausted = true;
    status.retryAfter = new Date(Date.now() + retryDelaySeconds * 1000);

    console.warn(
      `⚠️ API Key ${
        index + 1
      } exhausted. Will retry after ${retryDelaySeconds}s (at ${status.retryAfter.toLocaleTimeString()})`
    );
  }

  /**
   * Create a Gemini client with automatic key rotation
   * @returns {GoogleGenerativeAI} Gemini client instance
   */
  getClient() {
    const apiKey = this.getAvailableKey();

    if (!apiKey) {
      throw new Error(
        "All Gemini API keys are currently exhausted. Please wait or add more API keys."
      );
    }

    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Execute a function with automatic retry and key rotation on 429 errors
   * @param {Function} fn - Function that receives genAI client and returns a promise
   * @returns {Promise} Result of the function
   */
  async executeWithRetry(fn) {
    const maxRetries = this.apiKeys.length;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const genAI = this.getClient();
        const result = await fn(genAI);
        return result;
      } catch (error) {
        lastError = error;

        // Check if it's a 429 (quota exceeded) error
        if (
          error.status === 429 ||
          (error.message && error.message.includes("429"))
        ) {
          // Extract retry delay from error if available
          let retryDelay = 60; // Default 60 seconds

          if (error.errorDetails) {
            const retryInfo = error.errorDetails.find(
              (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
            );
            if (retryInfo && retryInfo.retryDelay) {
              retryDelay =
                parseInt(retryInfo.retryDelay.replace("s", "")) || 60;
            }
          }

          // Get the current key index to mark it
          const currentKey =
            this.apiKeys[this.currentKeyIndex - 1] || this.apiKeys[0];
          this.markKeyExhausted(currentKey, retryDelay);

          // Try next key
          console.log(
            `🔄 Retrying with next API key (attempt ${
              attempt + 1
            }/${maxRetries})...`
          );
          continue;
        }

        // For non-429 errors, throw immediately
        throw error;
      }
    }

    // All retries exhausted
    throw new Error(
      `All ${this.apiKeys.length} API keys exhausted. ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  /**
   * Get status of all API keys
   * @returns {Array} Status information for all keys
   */
  getStatus() {
    return this.apiKeys.map((key, index) => {
      const status = this.keyStatus.get(index);
      const maskedKey =
        key.substring(0, 8) + "..." + key.substring(key.length - 4);
      return {
        index: index + 1,
        key: maskedKey,
        exhausted: status.exhausted,
        retryAfter: status.retryAfter,
        available:
          !status.exhausted ||
          (status.retryAfter && new Date() >= status.retryAfter),
      };
    });
  }
}

// Singleton instance
let managerInstance = null;

/**
 * Get or create the singleton Gemini client manager
 * @returns {GeminiClientManager}
 */
function getGeminiClientManager() {
  if (!managerInstance) {
    managerInstance = new GeminiClientManager();
  }
  return managerInstance;
}

module.exports = {
  GeminiClientManager,
  getGeminiClientManager,
};
