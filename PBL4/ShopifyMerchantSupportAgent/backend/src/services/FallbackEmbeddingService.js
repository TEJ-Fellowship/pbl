import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Fallback Embedding Service
 * Provides multiple embedding strategies with graceful degradation
 */
export class FallbackEmbeddingService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isGeminiAvailable = false;
    this.fallbackEmbeddings = new Map(); // Cache for fallback embeddings

    this.initializeGemini();
  }

  /**
   * Initialize Gemini AI with error handling
   */
  initializeGemini() {
    try {
      if (
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
      ) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.isGeminiAvailable = true;
        console.log("✅ Gemini AI initialized successfully");
      } else {
        console.log(
          "⚠️  Gemini API key not configured - using fallback embeddings"
        );
      }
    } catch (error) {
      console.error("❌ Error initializing Gemini AI:", error.message);
      this.isGeminiAvailable = false;
    }
  }

  /**
   * Get embedding with fallback strategies
   */
  async getEmbedding(text, options = {}) {
    const { dimension = 768, useCache = true } = options;

    // Try Gemini first
    if (this.isGeminiAvailable) {
      try {
        const embedding = await this.getGeminiEmbedding(text);
        if (embedding && embedding.length === dimension) {
          return embedding;
        }
      } catch (error) {
        console.error("❌ Gemini embedding failed:", error.message);
        this.isGeminiAvailable = false; // Disable Gemini for future requests
      }
    }

    // Fallback to cached or generated embedding
    return this.getFallbackEmbedding(text, dimension, useCache);
  }

  /**
   * Get embedding from Gemini AI
   */
  async getGeminiEmbedding(text) {
    if (!this.model) {
      throw new Error("Gemini model not initialized");
    }

    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Generate fallback embedding using simple text hashing
   */
  getFallbackEmbedding(text, dimension = 768, useCache = true) {
    const cacheKey = `${text}_${dimension}`;

    if (useCache && this.fallbackEmbeddings.has(cacheKey)) {
      return this.fallbackEmbeddings.get(cacheKey);
    }

    // Generate deterministic embedding based on text hash
    const embedding = this.generateDeterministicEmbedding(text, dimension);

    if (useCache) {
      this.fallbackEmbeddings.set(cacheKey, embedding);
    }

    return embedding;
  }

  /**
   * Generate deterministic embedding using text hashing
   */
  generateDeterministicEmbedding(text, dimension) {
    const embedding = new Array(dimension).fill(0);

    // Simple hash-based embedding generation
    let hash = this.simpleHash(text);

    for (let i = 0; i < dimension; i++) {
      // Use hash to generate pseudo-random values
      hash = this.nextHash(hash);
      embedding[i] = ((hash % 2000) - 1000) / 1000; // Normalize to [-1, 1]
    }

    return embedding;
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate next hash value
   */
  nextHash(hash) {
    return (hash * 1664525 + 1013904223) % 2147483647;
  }

  /**
   * Check if Gemini is available
   */
  isGeminiReady() {
    return this.isGeminiAvailable && this.model !== null;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      geminiAvailable: this.isGeminiAvailable,
      fallbackCacheSize: this.fallbackEmbeddings.size,
      serviceReady: true,
    };
  }

  /**
   * Clear fallback cache
   */
  clearCache() {
    this.fallbackEmbeddings.clear();
  }
}

// Export singleton instance
export const embeddingService = new FallbackEmbeddingService();
export default embeddingService;
