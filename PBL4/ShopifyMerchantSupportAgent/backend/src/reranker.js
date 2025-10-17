import { pipeline } from "@xenova/transformers";

/**
 * Cross-Encoder Re-ranker for improving search result relevance
 * Uses cross-encoder/ms-marco-MiniLM-L-6-v2 model for semantic similarity scoring
 * Implements fallback mechanism when model is unavailable
 */
export class CrossEncoderReranker {
  constructor(options = {}) {
    this.topK = options.topK || 10; // Number of results to re-rank
    this.finalK = options.finalK || 4; // Number of final results to return
    this.batchSize = options.batchSize || 5; // Batch size for processing
    this.cacheSize = options.cacheSize || 100; // Cache size for query results
    this.modelName = "cross-encoder/ms-marco-MiniLM-L-6-v2";

    // Cache for query results
    this.cache = new Map();
    this.cacheOrder = [];

    // Model pipeline (will be initialized when needed)
    this.pipeline = null;
    this.isInitialized = false;
    this.useFallback = false;

    console.log(
      `🔄 CrossEncoderReranker initialized with topK=${this.topK}, finalK=${this.finalK}`
    );
  }

  /**
   * Initialize the cross-encoder model
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("🔄 Initializing cross-encoder model...");

      // Initialize the cross-encoder pipeline
      this.pipeline = await pipeline("text-classification", this.modelName, {
        device: "cpu",
        cache_dir: "./.cache/transformers",
      });

      this.isInitialized = true;
      this.useFallback = false;
      console.log("✅ Cross-encoder model initialized successfully");
    } catch (error) {
      console.warn(
        "⚠️ Failed to initialize cross-encoder model, using fallback:",
        error.message
      );
      this.isInitialized = true;
      this.useFallback = true;
    }
  }

  /**
   * Re-rank search results using cross-encoder or fallback method
   */
  async rerank(query, searchResults) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check cache first
    const cacheKey = this.getCacheKey(query, searchResults);
    if (this.cache.has(cacheKey)) {
      console.log("🔄 Using cached re-ranking results");
      return this.cache.get(cacheKey);
    }

    // Limit results to topK for re-ranking
    const resultsToRerank = searchResults.slice(0, this.topK);

    if (resultsToRerank.length === 0) {
      return [];
    }

    console.log(
      `🔄 Re-ranking ${resultsToRerank.length} results using ${
        this.useFallback ? "fallback" : "cross-encoder"
      } method`
    );

    let rerankedResults;

    if (this.useFallback) {
      rerankedResults = await this.fallbackRerank(query, resultsToRerank);
    } else {
      rerankedResults = await this.crossEncoderRerank(query, resultsToRerank);
    }

    // Cache the results
    this.cacheResult(cacheKey, rerankedResults);

    // Return top finalK results
    return rerankedResults.slice(0, this.finalK);
  }

  /**
   * Re-rank using cross-encoder model
   */
  async crossEncoderRerank(query, results) {
    const rerankedResults = [];

    try {
      // Process results in batches
      for (let i = 0; i < results.length; i += this.batchSize) {
        const batch = results.slice(i, i + this.batchSize);

        // Prepare batch for cross-encoder
        const inputs = batch.map((result) => [query, result.doc]);

        // Get cross-encoder scores
        const outputs = await this.pipeline(inputs);

        // Process batch results
        batch.forEach((result, index) => {
          const score = outputs[index]?.score || 0;
          rerankedResults.push({
            ...result,
            rerankScore: score,
            originalScore: result.score || 0,
          });
        });
      }

      // Sort by cross-encoder score
      rerankedResults.sort((a, b) => b.rerankScore - a.rerankScore);

      console.log(
        `✅ Cross-encoder re-ranking completed: ${rerankedResults.length} results`
      );
    } catch (error) {
      console.warn(
        "⚠️ Cross-encoder re-ranking failed, falling back to semantic similarity:",
        error.message
      );
      return await this.fallbackRerank(query, results);
    }

    return rerankedResults;
  }

  /**
   * Fallback re-ranking using semantic similarity
   */
  async fallbackRerank(query, results) {
    const rerankedResults = [];

    for (const result of results) {
      const similarityScore = this.calculateSemanticSimilarity(
        query,
        result.doc
      );
      rerankedResults.push({
        ...result,
        rerankScore: similarityScore,
        originalScore: result.score || 0,
      });
    }

    // Sort by similarity score
    rerankedResults.sort((a, b) => b.rerankScore - a.rerankScore);

    console.log(
      `✅ Fallback re-ranking completed: ${rerankedResults.length} results`
    );

    return rerankedResults;
  }

  /**
   * Calculate semantic similarity between query and document
   * Uses Jaccard similarity and term frequency for fallback scoring
   */
  calculateSemanticSimilarity(query, document) {
    const queryTokens = this.tokenize(query.toLowerCase());
    const docTokens = this.tokenize(document.toLowerCase());

    // Jaccard similarity
    const querySet = new Set(queryTokens);
    const docSet = new Set(docTokens);
    const intersection = new Set([...querySet].filter((x) => docSet.has(x)));
    const union = new Set([...querySet, ...docSet]);
    const jaccardSimilarity = intersection.size / union.size;

    // Term frequency similarity
    const queryFreq = this.calculateTermFrequency(queryTokens);
    const docFreq = this.calculateTermFrequency(docTokens);

    let tfSimilarity = 0;
    for (const [term, freq] of queryFreq) {
      if (docFreq.has(term)) {
        tfSimilarity +=
          Math.min(freq, docFreq.get(term)) / Math.max(freq, docFreq.get(term));
      }
    }
    tfSimilarity = tfSimilarity / queryFreq.size;

    // Combine similarities with weights
    const combinedScore = 0.6 * jaccardSimilarity + 0.4 * tfSimilarity;

    return Math.min(combinedScore, 1.0);
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  /**
   * Calculate term frequency for tokens
   */
  calculateTermFrequency(tokens) {
    const freq = new Map();
    for (const token of tokens) {
      freq.set(token, (freq.get(token) || 0) + 1);
    }
    return freq;
  }

  /**
   * Generate cache key for query and results
   */
  getCacheKey(query, results) {
    const queryHash = this.simpleHash(query);
    const resultsHash = this.simpleHash(
      results.map((r) => r.id || r.doc?.substring(0, 100)).join("|")
    );
    return `${queryHash}_${resultsHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache result and manage cache size
   */
  cacheResult(key, result) {
    // Remove oldest entries if cache is full
    while (this.cache.size >= this.cacheSize) {
      const oldestKey = this.cacheOrder.shift();
      this.cache.delete(oldestKey);
    }

    // Add new result
    this.cache.set(key, result);
    this.cacheOrder.push(key);
  }

  /**
   * Get re-ranking statistics
   */
  getStats() {
    return {
      modelName: this.modelName,
      topK: this.topK,
      finalK: this.finalK,
      batchSize: this.batchSize,
      cacheSize: this.cacheSize,
      cacheEntries: this.cache.size,
      isInitialized: this.isInitialized,
      useFallback: this.useFallback,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheOrder = [];
    console.log("🔄 Re-ranking cache cleared");
  }
}

/**
 * Create a cross-encoder re-ranker instance
 */
export async function createCrossEncoderReranker(options = {}) {
  const reranker = new CrossEncoderReranker(options);
  await reranker.initialize();
  return reranker;
}
