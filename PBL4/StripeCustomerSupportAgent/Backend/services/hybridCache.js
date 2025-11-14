import stringSimilarity from "string-similarity";

/**
 * Hybrid Cache with Multiple Matching Strategies
 * Supports exact match, fuzzy match, and semantic match for intelligent caching
 * Can be used for caching any type of data (classifications, responses, tool selections, etc.)
 */
class HybridCache {
  constructor(options = {}) {
    // Cache storage
    this.cache = new Map();
    this.queryEmbeddings = new Map(); // Cache query embeddings for semantic search

    // Configuration
    this.cacheTTL = options.cacheTTL || 7 * 60 * 1000; // Default: 7 minutes
    this.fuzzyThreshold = options.fuzzyThreshold || 0.9; // Default: 90% similarity
    this.semanticThreshold = options.semanticThreshold || 0.85; // Default: 85% similarity
    this.embeddings = options.embeddings || null; // Optional embeddings for semantic matching
    this.cleanupThreshold = options.cleanupThreshold || 100; // Cleanup when cache exceeds this size

    // Statistics
    this.stats = {
      exactHits: 0,
      fuzzyHits: 0,
      semanticHits: 0,
      misses: 0,
      totalRequests: 0,
    };
  }

  /**
   * Normalize query/key for cache key generation
   * @param {string} key - Original key
   * @returns {string} - Normalized key
   */
  normalizeKey(key) {
    return key
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s]/g, ""); // Remove special characters
  }

  /**
   * Generate cache key from key and optional context
   * @param {string} key - Main key
   * @param {string|Array} context - Optional context (e.g., enabled tools, user ID)
   * @returns {string} - Cache key
   */
  generateCacheKey(key, context = null) {
    const normalizedKey = this.normalizeKey(key);
    const contextKey =
      context === null
        ? "all"
        : Array.isArray(context)
        ? context.sort().join(",")
        : String(context);
    return `${normalizedKey}::${contextKey}`;
  }

  /**
   * Get cached value if available and not expired (exact match)
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} - Cached value with metadata or null
   */
  getCached(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      // Cache expired, remove it
      this.cache.delete(cacheKey);
      this.queryEmbeddings.delete(cacheKey);
      return null;
    }

    this.stats.exactHits++;
    this.stats.totalRequests++;
    return cached;
  }

  /**
   * Store value in cache
   * @param {string} cacheKey - Cache key
   * @param {*} value - Value to cache
   * @param {Object} metadata - Optional metadata (latency, originalKey, etc.)
   */
  setCached(cacheKey, value, metadata = {}) {
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ...metadata,
    });

    // Optional: Log cache size periodically
    if (this.cache.size % 10 === 0) {
      console.log(`📊 Hybrid cache size: ${this.cache.size} entries`);
    }
  }

  /**
   * Find similar cached value using fuzzy matching
   * @param {string} normalizedKey - Normalized key to find
   * @param {string|Array} context - Optional context
   * @returns {Object|null} - Cached value with metadata if similar key found
   */
  findFuzzyMatch(normalizedKey, context = null) {
    let bestMatch = null;
    let bestScore = 0;

    const contextKey =
      context === null
        ? "all"
        : Array.isArray(context)
        ? context.sort().join(",")
        : String(context);

    for (const [cachedKey, cachedValue] of this.cache.entries()) {
      // Check if context matches
      const cachedContextKey = cachedKey.split("::")[1];
      if (cachedContextKey !== contextKey) {
        continue;
      }

      // Extract key part from cache key (before "::")
      const cachedKeyPart = cachedKey.split("::")[0];

      // Check if expired
      const now = Date.now();
      if (now - cachedValue.timestamp > this.cacheTTL) {
        continue;
      }

      // Calculate similarity (0-1, where 1 = identical)
      const similarity = stringSimilarity.compareTwoStrings(
        normalizedKey,
        cachedKeyPart
      );

      if (similarity > bestScore) {
        bestScore = similarity;
        if (similarity >= this.fuzzyThreshold) {
          bestMatch = {
            key: cachedKey,
            value: cachedValue,
            similarity: similarity,
          };
        }
      }
    }

    if (bestMatch) {
      this.stats.fuzzyHits++;
      this.stats.totalRequests++;
      return bestMatch;
    }

    // Debug: Log if we found something close but below threshold
    if (bestScore > 0 && bestScore < this.fuzzyThreshold) {
      console.log(
        `🔍 Fuzzy match found but below threshold: ${(bestScore * 100).toFixed(
          1
        )}% (need ${(this.fuzzyThreshold * 100).toFixed(0)}%)`
      );
    }

    return null;
  }

  /**
   * Find semantically similar cached value using embeddings
   * @param {string} key - Original key
   * @param {string|Array} context - Optional context
   * @returns {Object|null} - Cached value with metadata if similar key found
   */
  async findSemanticMatch(key, context = null) {
    if (!this.embeddings) {
      return null; // Can't do semantic search without embeddings
    }

    try {
      // Get embedding for current key
      const keyEmbedding = await this.embeddings.embedQuery(key);

      if (
        !keyEmbedding ||
        !Array.isArray(keyEmbedding) ||
        keyEmbedding.length === 0
      ) {
        return null;
      }

      const contextKey =
        context === null
          ? "all"
          : Array.isArray(context)
          ? context.sort().join(",")
          : String(context);

      let bestMatch = null;
      let bestSimilarity = 0;

      // Check all cached values
      for (const [cachedKey, cachedValue] of this.cache.entries()) {
        // Check if context matches
        const cachedContextKey = cachedKey.split("::")[1];
        if (cachedContextKey !== contextKey) {
          continue;
        }

        // Check if expired
        const now = Date.now();
        if (now - cachedValue.timestamp > this.cacheTTL) {
          continue;
        }

        // Get or create embedding for cached key
        let cachedEmbedding = this.queryEmbeddings.get(cachedKey);

        if (!cachedEmbedding) {
          // Use original key if stored, otherwise use normalized
          const cachedKeyPart = cachedKey.split("::")[0];
          const cachedOriginalKey = cachedValue.originalKey || cachedKeyPart;
          try {
            cachedEmbedding = await this.embeddings.embedQuery(
              cachedOriginalKey
            );
            this.queryEmbeddings.set(cachedKey, cachedEmbedding);
          } catch (error) {
            console.warn(
              `⚠️ Failed to generate embedding for cached key: ${error.message}`
            );
            continue;
          }
        }

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(keyEmbedding, cachedEmbedding);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          if (similarity >= this.semanticThreshold) {
            bestMatch = {
              key: cachedKey,
              value: cachedValue,
              similarity: similarity,
            };
          }
        }
      }

      if (bestMatch) {
        this.stats.semanticHits++;
        this.stats.totalRequests++;
        return bestMatch;
      }

      // Debug: Log if we found something close but below threshold
      if (bestSimilarity > 0 && bestSimilarity < this.semanticThreshold) {
        console.log(
          `🔍 Semantic match found but below threshold: ${(
            bestSimilarity * 100
          ).toFixed(1)}% (need ${(this.semanticThreshold * 100).toFixed(0)}%)`
        );
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Semantic cache search failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} a - First vector
   * @param {Array} b - Second vector
   * @returns {number} - Similarity score (0-1)
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Get value from cache using hybrid matching (exact → fuzzy → semantic)
   * @param {string} key - Key to look up
   * @param {string|Array} context - Optional context
   * @param {Object} options - Options for matching
   * @returns {Object|null} - Cached value with match type and metadata
   */
  async get(key, context = null, options = {}) {
    const normalizedKey = this.normalizeKey(key);
    const cacheKey = this.generateCacheKey(key, context);

    // Periodically clear expired cache
    if (this.cache.size > this.cleanupThreshold) {
      this.clearExpired();
    }

    // Step 1: Check exact match (fastest - 0ms)
    const exactMatch = this.getCached(cacheKey);
    if (exactMatch) {
      return {
        value: exactMatch.value,
        matchType: "exact",
        metadata: exactMatch,
      };
    }

    // Step 2: Check fuzzy match (fast - ~1ms)
    if (options.enableFuzzy !== false) {
      const fuzzyMatch = this.findFuzzyMatch(normalizedKey, context);
      if (fuzzyMatch) {
        return {
          value: fuzzyMatch.value.value,
          matchType: "fuzzy",
          similarity: fuzzyMatch.similarity,
          metadata: fuzzyMatch.value,
        };
      }
    }

    // Step 3: Check semantic match (slower - ~50ms, but understands meaning)
    if (options.enableSemantic !== false && this.embeddings) {
      const semanticMatch = await this.findSemanticMatch(key, context);
      if (semanticMatch) {
        return {
          value: semanticMatch.value.value,
          matchType: "semantic",
          similarity: semanticMatch.similarity,
          metadata: semanticMatch.value,
        };
      }
    }

    // Cache miss
    this.stats.misses++;
    this.stats.totalRequests++;
    return null;
  }

  /**
   * Store value in cache
   * @param {string} key - Key to store
   * @param {*} value - Value to cache
   * @param {string|Array} context - Optional context
   * @param {Object} metadata - Optional metadata (latency, originalKey, etc.)
   */
  set(key, value, context = null, metadata = {}) {
    const cacheKey = this.generateCacheKey(key, context);
    this.setCached(cacheKey, value, {
      ...metadata,
      originalKey: key, // Store original key for better semantic matching
    });
  }

  /**
   * Clear expired cache entries
   * @returns {number} - Number of entries cleared
   */
  clearExpired() {
    const now = Date.now();
    let cleared = 0;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
        this.queryEmbeddings.delete(key);
        cleared++;
      }
    }
    if (cleared > 0) {
      console.log(`🧹 Hybrid cache: Cleared ${cleared} expired entries`);
    }
    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.queryEmbeddings.clear();
    console.log("🗑️ Hybrid cache: Cleared all entries");
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.totalRequests > 0
        ? ((this.stats.exactHits +
            this.stats.fuzzyHits +
            this.stats.semanticHits) /
            this.stats.totalRequests) *
          100
        : 0;

    return {
      size: this.cache.size,
      ttlMinutes: this.cacheTTL / (60 * 1000),
      fuzzyThreshold: this.fuzzyThreshold,
      semanticThreshold: this.semanticThreshold,
      semanticEnabled: !!this.embeddings,
      stats: {
        ...this.stats,
        hitRate: hitRate.toFixed(2) + "%",
      },
    };
  }
}

export default HybridCache;
