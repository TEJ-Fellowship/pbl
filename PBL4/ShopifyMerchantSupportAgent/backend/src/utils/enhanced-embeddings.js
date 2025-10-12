let localPipeline = null;

async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  const { pipeline } = await import("@xenova/transformers");
  localPipeline = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );
  return localPipeline;
}

/**
 * Enhanced embeddings utility with query preprocessing and expansion
 */
export class EnhancedEmbeddings {
  constructor() {
    this.queryCache = new Map();
    this.embeddingCache = new Map();
  }

  /**
   * Enhanced text embedding with preprocessing
   */
  async embedTexts(texts, options = {}) {
    const provider = (process.env.EMBEDDINGS_PROVIDER || "local").toLowerCase();
    if (provider !== "local") {
      throw new Error(
        "Only local embeddings are configured. Set EMBEDDINGS_PROVIDER=local."
      );
    }

    const pipe = await getLocalPipeline();
    const outputs = [];

    for (const text of texts) {
      // Preprocess text for better embeddings
      const processedText = this.preprocessText(text, options);

      // Check cache first
      const cacheKey = this.getCacheKey(processedText);
      if (this.embeddingCache.has(cacheKey)) {
        outputs.push(this.embeddingCache.get(cacheKey));
        continue;
      }

      const res = await pipe(processedText, {
        normalize: true,
        pooling: "mean",
      });
      const embedding = Array.from(res.data);

      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      outputs.push(embedding);
    }

    return outputs;
  }

  /**
   * Enhanced single text embedding with query expansion
   */
  async embedSingle(text, options = {}) {
    const [e] = await this.embedTexts([text], options);
    return e;
  }

  /**
   * Enhanced query embedding with expansion and preprocessing
   */
  async embedQuery(query, options = {}) {
    // Check query cache first
    const cacheKey = this.getCacheKey(query);
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    // Expand query for better semantic matching
    const expandedQuery = this.expandQueryForEmbedding(query);

    // Process and embed
    const embedding = await this.embedSingle(expandedQuery, {
      ...options,
      isQuery: true,
    });

    // Cache the result
    this.queryCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Preprocess text for better embeddings
   */
  preprocessText(text, options = {}) {
    if (!text) return "";

    let processed = text;

    // For queries, apply special preprocessing
    if (options.isQuery) {
      processed = this.preprocessQuery(text);
    } else {
      processed = this.preprocessDocument(text);
    }

    // Common preprocessing
    processed = processed
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s\-\.]/g, " ") // Remove special chars except word chars, spaces, hyphens, dots
      .trim();

    return processed;
  }

  /**
   * Preprocess query text for better semantic matching
   */
  preprocessQuery(query) {
    let processed = query.toLowerCase();

    // Expand common abbreviations
    const expansions = {
      api: "application programming interface",
      rest: "representational state transfer",
      gql: "graphql",
      auth: "authentication",
      oauth: "oauth authentication",
      jwt: "json web token",
      pos: "point of sale",
      ui: "user interface",
      ux: "user experience",
    };

    for (const [abbr, expansion] of Object.entries(expansions)) {
      processed = processed.replace(
        new RegExp(`\\b${abbr}\\b`, "g"),
        expansion
      );
    }

    // Add context for better matching
    if (processed.includes("shopify")) {
      processed += " ecommerce platform online store";
    }

    if (processed.includes("api") || processed.includes("endpoint")) {
      processed += " developer integration programming";
    }

    if (processed.includes("product") || processed.includes("order")) {
      processed += " merchant business selling";
    }

    return processed;
  }

  /**
   * Preprocess document text for better indexing
   */
  preprocessDocument(text) {
    let processed = text;

    // Extract and emphasize technical terms
    const technicalTerms = [
      "api",
      "endpoint",
      "rest",
      "graphql",
      "webhook",
      "oauth",
      "authentication",
      "authorization",
      "token",
      "request",
      "response",
      "product",
      "order",
      "customer",
      "theme",
      "app",
      "shopify",
    ];

    // Add emphasis to technical terms by duplicating them
    technicalTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, "gi");
      processed = processed.replace(regex, `${term} ${term}`);
    });

    return processed;
  }

  /**
   * Expand query for better semantic matching
   */
  expandQueryForEmbedding(query) {
    let expanded = query.toLowerCase();

    // Add semantic context based on query content
    if (expanded.includes("how to") || expanded.includes("tutorial")) {
      expanded += " step by step guide instructions";
    }

    if (expanded.includes("what is") || expanded.includes("explain")) {
      expanded += " definition meaning overview introduction";
    }

    if (expanded.includes("error") || expanded.includes("problem")) {
      expanded += " troubleshooting fix solution debug";
    }

    if (expanded.includes("create") || expanded.includes("add")) {
      expanded += " build make generate new";
    }

    if (expanded.includes("update") || expanded.includes("modify")) {
      expanded += " change edit alter";
    }

    if (expanded.includes("delete") || expanded.includes("remove")) {
      expanded += " destroy eliminate";
    }

    // Add domain-specific context
    if (expanded.includes("shopify")) {
      expanded += " ecommerce platform online store business";
    }

    return expanded;
  }

  /**
   * Generate cache key for text
   */
  getCacheKey(text) {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.queryCache.clear();
    this.embeddingCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      queryCacheSize: this.queryCache.size,
      embeddingCacheSize: this.embeddingCache.size,
    };
  }
}

// Create singleton instance
const enhancedEmbeddings = new EnhancedEmbeddings();

// Export both class and singleton methods for backward compatibility
export async function embedTexts(texts, options = {}) {
  return enhancedEmbeddings.embedTexts(texts, options);
}

export async function embedSingle(text, options = {}) {
  return enhancedEmbeddings.embedSingle(text, options);
}

export async function embedQuery(query, options = {}) {
  return enhancedEmbeddings.embedQuery(query, options);
}

export { enhancedEmbeddings };
