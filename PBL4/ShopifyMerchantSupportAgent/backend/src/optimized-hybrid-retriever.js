import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import FlexSearch from "flexsearch";
import { getPineconeIndex } from "../config/pinecone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Optimized Hybrid Retriever with advanced search capabilities
 * Features:
 * - Smart query processing and expansion
 * - Enhanced keyword search with BM25-like scoring
 * - Improved semantic search with query rewriting
 * - Advanced fusion ranking with relevance boosting
 * - Context-aware search strategies
 */
export class OptimizedHybridRetriever {
  constructor(options = {}) {
    this.semanticWeight = options.semanticWeight || 0.6; // Adjusted weights
    this.keywordWeight = options.keywordWeight || 0.4;
    this.maxResults = options.maxResults || 15; // Increased for better fusion
    this.finalK = options.finalK || 4;

    // Query processing options
    this.enableQueryExpansion = options.enableQueryExpansion !== false;
    this.enableIntentDetection = options.enableIntentDetection !== false;

    // Initialize enhanced FlexSearch index
    this.keywordIndex = new FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: "id",
        index: [
          "text",
          "title",
          "section",
          "category",
          "keywords", // New field for extracted keywords
          "api_endpoints", // New field for API-specific terms
        ],
        store: ["text", "metadata", "keywords", "api_endpoints"],
      },
      cache: true,
    });

    this.documents = [];
    this.isInitialized = false;

    // Technical terms and synonyms for better matching
    this.technicalTerms = new Map([
      // API-related terms
      ["api", ["endpoint", "interface", "service", "rest", "graphql"]],
      ["rest", ["restful", "http", "endpoint", "api"]],
      ["graphql", ["gql", "query", "mutation", "subscription"]],
      ["webhook", ["callback", "notification", "event"]],
      ["oauth", ["authentication", "auth", "token", "authorization"]],

      // Shopify-specific terms
      ["product", ["item", "goods", "inventory", "catalog"]],
      ["order", ["purchase", "transaction", "sale", "checkout"]],
      ["customer", ["buyer", "user", "client", "shopper"]],
      ["theme", ["template", "design", "layout", "customization"]],
      ["app", ["application", "extension", "integration", "plugin"]],

      // Technical concepts
      ["create", ["add", "insert", "post", "build", "make"]],
      ["update", ["modify", "edit", "change", "put", "patch"]],
      ["delete", ["remove", "destroy", "eliminate"]],
      ["get", ["fetch", "retrieve", "find", "search"]],
    ]);
  }

  /**
   * Enhanced initialization with better document processing
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log("🔍 Initializing optimized hybrid retriever...");

    try {
      const chunksDir = path.join(__dirname, "../data/chunks");
      const files = await fs.readdir(chunksDir);
      const chunkFiles = files.filter(
        (file) => file.startsWith("chunks_") && file.endsWith(".json")
      );

      console.log(`📁 Found ${chunkFiles.length} chunk files to process`);

      let totalChunks = 0;

      for (const file of chunkFiles) {
        const filePath = path.join(chunksDir, file);
        const chunks = JSON.parse(await fs.readFile(filePath, "utf-8"));

        console.log(`📄 Processing ${file}: ${chunks.length} chunks`);

        for (const chunk of chunks) {
          // Enhanced document processing
          const enhancedChunk = this.enhanceDocument(chunk);

          // Add to FlexSearch index with enhanced fields
          this.keywordIndex.add({
            id: enhancedChunk.id,
            text: enhancedChunk.text,
            title: enhancedChunk.metadata?.title || "",
            section: enhancedChunk.metadata?.section || "",
            category: enhancedChunk.metadata?.category || "",
            keywords: enhancedChunk.keywords.join(" "),
            api_endpoints: enhancedChunk.api_endpoints.join(" "),
            metadata: enhancedChunk.metadata,
          });

          // Store enhanced document
          this.documents.push(enhancedChunk);
          totalChunks++;
        }
      }

      console.log(
        `✅ Optimized hybrid retriever initialized with ${totalChunks} documents`
      );
      console.log(`🔍 Enhanced keyword index built with FlexSearch`);
      console.log(`📊 Semantic search ready with Pinecone`);
      console.log(`🧠 Query processing and expansion enabled`);

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Error initializing optimized hybrid retriever:", error);
      throw error;
    }
  }

  /**
   * Enhance document with extracted keywords and API endpoints
   */
  enhanceDocument(chunk) {
    const text = chunk.text || "";
    const metadata = chunk.metadata || {};

    // Extract keywords using multiple strategies
    const keywords = this.extractKeywords(text, metadata);

    // Extract API endpoints and technical terms
    const api_endpoints = this.extractApiEndpoints(text);

    return {
      ...chunk,
      keywords,
      api_endpoints,
      // Add relevance score for different query types
      relevance_scores: this.calculateRelevanceScores(
        text,
        metadata,
        keywords,
        api_endpoints
      ),
    };
  }

  /**
   * Extract relevant keywords from text
   */
  extractKeywords(text, metadata) {
    const keywords = new Set();

    // Add metadata-based keywords
    if (metadata.title) keywords.add(metadata.title.toLowerCase());
    if (metadata.section) keywords.add(metadata.section.toLowerCase());
    if (metadata.category) keywords.add(metadata.category.toLowerCase());

    // Extract technical terms
    const techPatterns = [
      /\b(api|rest|graphql|webhook|oauth|jwt)\b/gi,
      /\b(create|update|delete|get|post|put|patch)\b/gi,
      /\b(product|order|customer|theme|app|shop)\b/gi,
      /\b(endpoint|url|request|response|header|body)\b/gi,
      /\b(authentication|authorization|token|key|secret)\b/gi,
    ];

    techPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => keywords.add(match.toLowerCase()));
      }
    });

    // Extract Shopify-specific terms
    const shopifyPatterns = [
      /\bshopify\w*\b/gi,
      /\b(admin|storefront|pos|checkout)\b/gi,
      /\b(merchant|partner|developer)\b/gi,
      /\b(store|shop|business)\b/gi,
    ];

    shopifyPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => keywords.add(match.toLowerCase()));
      }
    });

    return Array.from(keywords);
  }

  /**
   * Extract API endpoints and technical identifiers
   */
  extractApiEndpoints(text) {
    const endpoints = new Set();

    // Common API endpoint patterns
    const patterns = [
      /\/api\/[a-zA-Z0-9\/\-_]+/g,
      /\/admin\/api\/[a-zA-Z0-9\/\-_]+/g,
      /\/storefront\/api\/[a-zA-Z0-9\/\-_]+/g,
      /\b[A-Z_]+_API\b/g,
      /\b[A-Z_]+_ENDPOINT\b/g,
      /\b[a-z]+\.shopify\.com\b/g,
    ];

    patterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => endpoints.add(match.toLowerCase()));
      }
    });

    return Array.from(endpoints);
  }

  /**
   * Calculate relevance scores for different query types
   */
  calculateRelevanceScores(text, metadata, keywords, api_endpoints) {
    const scores = {
      general: 1.0,
      api_related: 0.0,
      technical: 0.0,
      beginner: 0.0,
    };

    // Boost API-related content
    if (
      api_endpoints.length > 0 ||
      keywords.some((k) => ["api", "rest", "graphql"].includes(k))
    ) {
      scores.api_related = 1.5;
    }

    // Boost technical content
    if (
      keywords.some((k) => ["webhook", "oauth", "authentication"].includes(k))
    ) {
      scores.technical = 1.3;
    }

    // Boost beginner content
    if (
      metadata.merchant_level === "beginner" ||
      keywords.some((k) => ["getting", "started", "intro"].includes(k))
    ) {
      scores.beginner = 1.2;
    }

    return scores;
  }

  /**
   * Process and expand query for better search results
   */
  processQuery(query) {
    const processed = {
      original: query,
      expanded: query,
      intent: "general",
      keywords: [],
      technical_terms: [],
    };

    if (!this.enableQueryExpansion) {
      return processed;
    }

    const lowerQuery = query.toLowerCase();

    // Detect query intent
    if (this.enableIntentDetection) {
      processed.intent = this.detectIntent(lowerQuery);
    }

    // Extract keywords
    processed.keywords = this.extractQueryKeywords(query);

    // Extract technical terms
    processed.technical_terms = this.extractTechnicalTerms(query);

    // Expand query with synonyms
    processed.expanded = this.expandQuery(query);

    return processed;
  }

  /**
   * Detect query intent
   */
  detectIntent(query) {
    const intents = {
      api: ["api", "endpoint", "rest", "graphql", "webhook"],
      technical: ["how to", "tutorial", "guide", "implement", "code"],
      general: ["what is", "explain", "tell me about"],
      troubleshooting: ["error", "problem", "issue", "fix", "debug"],
      beginner: ["getting started", "beginner", "new to", "first time"],
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        return intent;
      }
    }

    return "general";
  }

  /**
   * Extract keywords from query
   */
  extractQueryKeywords(query) {
    const keywords = [];
    const words = query.toLowerCase().split(/\s+/);

    words.forEach((word) => {
      if (
        word.length > 2 &&
        !["the", "and", "or", "but", "for", "with"].includes(word)
      ) {
        keywords.push(word);
      }
    });

    return keywords;
  }

  /**
   * Extract technical terms from query
   */
  extractTechnicalTerms(query) {
    const terms = [];
    const lowerQuery = query.toLowerCase();

    for (const [term, synonyms] of this.technicalTerms) {
      if (lowerQuery.includes(term)) {
        terms.push(term);
      }
      synonyms.forEach((synonym) => {
        if (lowerQuery.includes(synonym)) {
          terms.push(synonym);
        }
      });
    }

    return terms;
  }

  /**
   * Expand query with synonyms and related terms
   */
  expandQuery(query) {
    let expanded = query;
    const lowerQuery = query.toLowerCase();

    // Add synonyms for technical terms
    for (const [term, synonyms] of this.technicalTerms) {
      if (lowerQuery.includes(term)) {
        // Add first synonym to expand the query
        expanded += ` ${synonyms[0]}`;
      }
    }

    return expanded;
  }

  /**
   * Enhanced hybrid search with improved algorithms
   */
  async search({ query, queryEmbedding, k = 4 }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Process query
      const processedQuery = this.processQuery(query);

      // Get Pinecone index
      const index = await getPineconeIndex();

      // 1. Enhanced semantic search
      console.log("🔍 Performing enhanced semantic search...");
      const semanticResults = await index.query({
        vector: queryEmbedding,
        topK: this.maxResults,
        includeMetadata: true,
        includeValues: false,
      });

      // 2. Enhanced keyword search with multiple strategies
      console.log("🔍 Performing enhanced keyword search...");
      const keywordResults = await this.performEnhancedKeywordSearch(
        processedQuery
      );

      // 3. Advanced fusion ranking
      console.log("🔄 Applying advanced fusion ranking...");
      const fusedResults = this.advancedFuseResults(
        semanticResults.matches,
        keywordResults,
        processedQuery,
        this.semanticWeight,
        this.keywordWeight
      );

      // 4. Return top k results
      const finalResults = fusedResults
        .slice(0, k)
        .filter((result) => result.document !== null)
        .map((result) => ({
          doc: result.document.text,
          metadata: result.document.metadata,
          score: result.finalScore,
          searchType: result.searchType,
          relevanceBoost: result.relevanceBoost,
        }));

      console.log(
        `✅ Enhanced hybrid search completed: ${finalResults.length} results`
      );
      console.log(`📊 Query intent: ${processedQuery.intent}`);
      console.log(
        `📊 Semantic weight: ${this.semanticWeight}, Keyword weight: ${this.keywordWeight}`
      );

      return finalResults;
    } catch (error) {
      console.error("❌ Error in enhanced hybrid search:", error);
      throw error;
    }
  }

  /**
   * Enhanced keyword search with multiple strategies
   */
  async performEnhancedKeywordSearch(processedQuery) {
    const results = [];

    // Strategy 1: Original query search
    const originalResults = this.keywordIndex.search(processedQuery.original, {
      limit: this.maxResults,
      suggest: true,
    });
    results.push(
      ...originalResults.map((r) => ({ ...r, strategy: "original" }))
    );

    // Strategy 2: Expanded query search
    if (processedQuery.expanded !== processedQuery.original) {
      const expandedResults = this.keywordIndex.search(
        processedQuery.expanded,
        {
          limit: this.maxResults,
          suggest: true,
        }
      );
      results.push(
        ...expandedResults.map((r) => ({ ...r, strategy: "expanded" }))
      );
    }

    // Strategy 3: Technical terms search
    if (processedQuery.technical_terms.length > 0) {
      for (const term of processedQuery.technical_terms) {
        const termResults = this.keywordIndex.search(term, {
          limit: Math.ceil(
            this.maxResults / processedQuery.technical_terms.length
          ),
          suggest: true,
        });
        results.push(
          ...termResults.map((r) => ({ ...r, strategy: "technical" }))
        );
      }
    }

    // Strategy 4: API endpoints search
    const apiResults = this.keywordIndex.search(processedQuery.original, {
      limit: this.maxResults,
      suggest: true,
      field: "api_endpoints",
    });
    results.push(...apiResults.map((r) => ({ ...r, strategy: "api" })));

    // Deduplicate and score results
    const uniqueResults = this.deduplicateAndScore(results);

    return uniqueResults.slice(0, this.maxResults);
  }

  /**
   * Deduplicate results and calculate BM25-like scores
   */
  deduplicateAndScore(results) {
    const scoreMap = new Map();

    results.forEach((result, index) => {
      const docId = result.id;

      if (!scoreMap.has(docId)) {
        // Calculate BM25-like score
        const score = this.calculateBM25Score(result, index);
        scoreMap.set(docId, {
          ...result,
          bm25Score: score,
          rank: index + 1,
        });
      } else {
        // Update with better score
        const existing = scoreMap.get(docId);
        const newScore = this.calculateBM25Score(result, index);
        if (newScore > existing.bm25Score) {
          existing.bm25Score = newScore;
          existing.rank = index + 1;
        }
      }
    });

    return Array.from(scoreMap.values()).sort(
      (a, b) => b.bm25Score - a.bm25Score
    );
  }

  /**
   * Calculate BM25-like score for keyword search results
   */
  calculateBM25Score(result, rank) {
    // Base score from rank (higher rank = lower score)
    const rankScore = 1 / (rank + 1);

    // Strategy bonus
    const strategyBonus =
      {
        original: 1.0,
        expanded: 0.8,
        technical: 1.2,
        api: 1.3,
      }[result.strategy] || 1.0;

    // Document length normalization (shorter docs get slight boost)
    const docLength = result.text?.length || 1000;
    const lengthNorm = Math.min(1.2, 1000 / docLength);

    return rankScore * strategyBonus * lengthNorm;
  }

  /**
   * Advanced fusion ranking with relevance boosting
   */
  advancedFuseResults(
    semanticResults,
    keywordResults,
    processedQuery,
    semanticWeight,
    keywordWeight
  ) {
    const scoreMap = new Map();

    // Process semantic results with intent-based boosting
    semanticResults.forEach((result, index) => {
      const docId = result.id;
      const document = this.findDocumentById(docId);

      if (!document) return;

      const normalizedScore = 1 / (index + 1);
      const weightedScore = semanticWeight * normalizedScore;

      // Apply relevance boosting based on query intent
      const relevanceBoost = this.calculateRelevanceBoost(
        document,
        processedQuery
      );
      const boostedScore = weightedScore * relevanceBoost;

      scoreMap.set(docId, {
        document: document,
        semanticScore: boostedScore,
        keywordScore: 0,
        semanticRank: index + 1,
        keywordRank: null,
        searchType: "semantic",
        relevanceBoost: relevanceBoost,
      });
    });

    // Process keyword results with BM25 scoring
    keywordResults.forEach((result, index) => {
      const docId = result.id;
      const document = this.findDocumentById(docId);

      if (!document) return;

      const bm25Score = result.bm25Score || 1 / (index + 1);
      const weightedScore = keywordWeight * bm25Score;

      // Apply relevance boosting
      const relevanceBoost = this.calculateRelevanceBoost(
        document,
        processedQuery
      );
      const boostedScore = weightedScore * relevanceBoost;

      if (!scoreMap.has(docId)) {
        scoreMap.set(docId, {
          document: document,
          semanticScore: 0,
          keywordScore: boostedScore,
          semanticRank: null,
          keywordRank: index + 1,
          searchType: "keyword",
          relevanceBoost: relevanceBoost,
        });
      } else {
        const existing = scoreMap.get(docId);
        existing.keywordScore = boostedScore;
        existing.keywordRank = index + 1;
        existing.relevanceBoost = Math.max(
          existing.relevanceBoost,
          relevanceBoost
        );

        if (existing.semanticRank === null) {
          existing.searchType = "keyword";
        } else {
          existing.searchType = "hybrid";
        }
      }
    });

    // Calculate final scores with advanced weighting
    const fusedResults = Array.from(scoreMap.values())
      .map((result) => {
        // Advanced scoring formula
        const baseScore = result.semanticScore + result.keywordScore;
        const hybridBonus = result.searchType === "hybrid" ? 1.2 : 1.0;
        const finalScore = baseScore * hybridBonus * result.relevanceBoost;

        return {
          ...result,
          finalScore: finalScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    return fusedResults;
  }

  /**
   * Calculate relevance boost based on query intent and document content
   */
  calculateRelevanceBoost(document, processedQuery) {
    let boost = 1.0;

    // Intent-based boosting
    const intent = processedQuery.intent;
    const relevanceScores = document.relevance_scores || {};

    switch (intent) {
      case "api":
        boost *= relevanceScores.api_related || 1.0;
        break;
      case "technical":
        boost *= relevanceScores.technical || 1.0;
        break;
      case "beginner":
        boost *= relevanceScores.beginner || 1.0;
        break;
      default:
        boost *= relevanceScores.general || 1.0;
    }

    // Keyword match boosting
    const queryKeywords = processedQuery.keywords || [];
    const docKeywords = document.keywords || [];
    const keywordMatches = queryKeywords.filter((kw) =>
      docKeywords.some((dk) => dk.includes(kw) || kw.includes(dk))
    ).length;

    if (keywordMatches > 0) {
      boost *= 1 + keywordMatches * 0.1;
    }

    // Technical term boosting
    const technicalMatches = processedQuery.technical_terms.filter(
      (term) =>
        document.api_endpoints?.some((ep) => ep.includes(term)) ||
        document.keywords?.some((kw) => kw.includes(term))
    ).length;

    if (technicalMatches > 0) {
      boost *= 1 + technicalMatches * 0.15;
    }

    return Math.min(boost, 2.0); // Cap at 2x boost
  }

  /**
   * Find document by ID
   */
  findDocumentById(id) {
    return this.documents.find((doc) => doc.id === id) || null;
  }

  /**
   * Get enhanced search statistics
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      semanticWeight: this.semanticWeight,
      keywordWeight: this.keywordWeight,
      maxResults: this.maxResults,
      finalK: this.finalK,
      isInitialized: this.isInitialized,
      queryExpansionEnabled: this.enableQueryExpansion,
      intentDetectionEnabled: this.enableIntentDetection,
      technicalTermsCount: this.technicalTerms.size,
    };
  }
}

/**
 * Create an optimized hybrid retriever instance
 */
export async function createOptimizedHybridRetriever(options = {}) {
  const retriever = new OptimizedHybridRetriever(options);
  await retriever.initialize();
  return retriever;
}
