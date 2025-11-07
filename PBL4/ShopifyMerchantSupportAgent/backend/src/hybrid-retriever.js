import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import FlexSearch from "flexsearch";
import { getPineconeIndex } from "../config/pinecone.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Hybrid Retriever combining semantic search (Pinecone) with keyword search (FlexSearch)
 * Implements fusion ranking algorithm with configurable weights
 */
export class HybridRetriever {
  constructor(options = {}) {
    this.semanticWeight = options.semanticWeight || 0.7; // Increased semantic weight for better context understanding
    this.keywordWeight = options.keywordWeight || 0.3;
    this.maxResults = options.maxResults || 20; // Get more results for better fusion
    this.finalK = options.finalK || 8; // Return more results for comprehensive answers
    this.diversityBoost = options.diversityBoost || 0.15; // Increased boost for category diversity
    this.minRelevanceScore = options.minRelevanceScore || 0.1; // Minimum relevance threshold
    this.queryExpansion = options.queryExpansion || true; // Enable query expansion

    // Initialize FlexSearch index for keyword search
    this.keywordIndex = new FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: "id",
        index: ["text", "title", "section", "category"],
        store: ["text", "metadata"],
      },
      cache: true,
      // Add more aggressive tokenization for better keyword matching
      charset: "latin:extra",
      threshold: 0,
      resolution: 3,
    });

    this.documents = []; // Store all documents for reference
    this.isInitialized = false;
  }

  /**
   * Load all chunk files and build keyword search index
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log("🔍 Initializing hybrid retriever...");

    try {
      // Load all chunk files
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
          // Add to FlexSearch index
          this.keywordIndex.add({
            id: chunk.id,
            text: chunk.text,
            title: chunk.metadata?.title || "",
            section: chunk.metadata?.section || "",
            category: chunk.metadata?.category || "",
            metadata: chunk.metadata,
          });

          // Store document for reference
          this.documents.push({
            id: chunk.id,
            text: chunk.text,
            metadata: chunk.metadata,
          });

          totalChunks++;
        }
      }

      console.log(
        `✅ Hybrid retriever initialized with ${totalChunks} documents`
      );
      console.log(`🔍 Keyword index built with FlexSearch`);
      console.log(`📊 Semantic search ready with Pinecone`);

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Error initializing hybrid retriever:", error);
      throw error;
    }
  }

  /**
   * Enhanced query preprocessing for better search results
   */
  preprocessQuery(query) {
    // Expand common Shopify terms
    const expansions = {
      shopify: "shopify ecommerce platform store",
      api: "api rest graphql endpoint",
      product: "product inventory item",
      order: "order fulfillment shipping",
      theme: "theme template design",
      app: "app integration development",
      webhook: "webhook notification event",
      liquid: "liquid template language",
      checkout: "checkout payment cart",
      customer: "customer user account",
    };

    let expandedQuery = query.toLowerCase();

    // Apply expansions
    for (const [term, expansion] of Object.entries(expansions)) {
      if (expandedQuery.includes(term)) {
        expandedQuery = expandedQuery.replace(new RegExp(term, "g"), expansion);
      }
    }

    // Extract key terms
    const keyTerms = expandedQuery
      .split(/\s+/)
      .filter((term) => term.length > 2);

    return {
      original: query,
      expanded: expandedQuery,
      keyTerms: keyTerms,
      hasShopifyTerms: keyTerms.some((term) =>
        ["shopify", "ecommerce", "platform", "store"].includes(term)
      ),
      isApiQuery: keyTerms.some((term) =>
        ["api", "rest", "graphql", "endpoint", "webhook"].includes(term)
      ),
      isProductQuery: keyTerms.some((term) =>
        ["product", "inventory", "item", "variant"].includes(term)
      ),
    };
  }

  /**
   * Perform hybrid search combining semantic and keyword search
   */
  async search({ query, queryEmbedding, k = 6 }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Preprocess query for better results
      const processedQuery = this.preprocessQuery(query);
      console.log(`🔍 Processed query: "${processedQuery.expanded}"`);

      // Get Pinecone index
      const index = await getPineconeIndex();

      // OPTIMIZATION: Perform semantic and keyword search in parallel
      // This saves ~50ms by running both searches simultaneously
      console.log("🔍 Performing parallel semantic and keyword search...");
      const keywordQueries = this.buildKeywordQueries(processedQuery);
      
      const [semanticResults, keywordResults] = await Promise.all([
        // 1. Enhanced semantic search using Pinecone
        index.query({
          vector: queryEmbedding,
          topK: this.maxResults,
          includeMetadata: true,
          includeValues: false,
          filter: this.buildSemanticFilter(processedQuery),
        }),
        // 2. Enhanced keyword search using FlexSearch
        this.performMultiKeywordSearch(keywordQueries),
      ]);

      // Debug keyword search results
      console.log(`📊 Keyword search found ${keywordResults.length} results`);
      if (keywordResults.length > 0) {
        console.log(`🔍 Top keyword result: ${keywordResults[0].id}`);
      }

      // 3. Fusion ranking
      console.log("🔄 Applying fusion ranking...");
      const fusedResults = this.fuseResults(
        semanticResults.matches,
        keywordResults,
        this.semanticWeight,
        this.keywordWeight
      );

      // 4. Apply diversity boost and return top k results
      const diversifiedResults = this.applyDiversityBoost(fusedResults);
      const finalResults = diversifiedResults
        .slice(0, k)
        .filter((result) => result.document !== null) // Filter out null documents
        .map((result) => ({
          doc: result.document.text,
          metadata: result.document.metadata,
          score: result.finalScore,
          searchType: result.searchType,
        }));

      console.log(`✅ Hybrid search completed: ${finalResults.length} results`);
      console.log(
        `📊 Semantic weight: ${this.semanticWeight}, Keyword weight: ${this.keywordWeight}`
      );

      return finalResults;
    } catch (error) {
      console.error("❌ Error in hybrid search:", error);
      throw error;
    }
  }

  /**
   * Apply diversity boost to ensure results from different categories
   */
  applyDiversityBoost(results) {
    const categoryCount = new Map();
    const diversifiedResults = [];
    const remainingResults = [...results];

    // First pass: select best result from each category
    for (const result of results) {
      const category = result.document?.metadata?.category || "unknown";
      if (!categoryCount.has(category)) {
        categoryCount.set(category, 0);
        diversifiedResults.push({
          ...result,
          finalScore: result.finalScore + this.diversityBoost, // Boost for diversity
        });
        remainingResults.splice(remainingResults.indexOf(result), 1);
      }
    }

    // Second pass: add remaining high-scoring results
    const sortedRemaining = remainingResults.sort(
      (a, b) => b.finalScore - a.finalScore
    );
    diversifiedResults.push(...sortedRemaining);

    return diversifiedResults.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Enhanced fusion ranking algorithm combining semantic and keyword search results
   */
  fuseResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
    const scoreMap = new Map();

    // Process semantic results with enhanced score normalization
    semanticResults.forEach((result, index) => {
      const docId = result.id;
      const document = this.findDocumentById(docId);

      // Skip if document not found
      if (!document) return;

      // Enhanced score calculation with rank consideration
      const semanticScore = result.score || 0;
      const rankPenalty = 1 / (index + 1); // Penalty for lower rank
      const normalizedSemanticScore = semanticScore * rankPenalty;
      const weightedSemanticScore = semanticWeight * normalizedSemanticScore;

      if (!scoreMap.has(docId)) {
        scoreMap.set(docId, {
          document: document,
          semanticScore: weightedSemanticScore,
          keywordScore: 0,
          semanticRank: index + 1,
          keywordRank: null,
          searchType: "semantic",
          originalSemanticScore: semanticScore,
        });
      } else {
        const existing = scoreMap.get(docId);
        existing.semanticScore = weightedSemanticScore;
        existing.semanticRank = index + 1;
        existing.originalSemanticScore = semanticScore;
        if (existing.keywordRank === null) {
          existing.searchType = "semantic";
        } else {
          existing.searchType = "hybrid";
        }
      }
    });

    // Process keyword results with enhanced score normalization
    if (keywordResults && keywordResults.length > 0) {
      keywordResults.forEach((result, index) => {
        const docId = result.id;
        const document = this.findDocumentById(docId);

        // Skip if document not found
        if (!document) return;

        // Enhanced keyword score calculation
        const keywordScore = result.score || 1 / (index + 1);
        const rankPenalty = 1 / (index + 1); // Penalty for lower rank
        const normalizedKeywordScore = keywordScore * rankPenalty;
        const weightedKeywordScore = keywordWeight * normalizedKeywordScore;

        if (!scoreMap.has(docId)) {
          scoreMap.set(docId, {
            document: document,
            semanticScore: 0,
            keywordScore: weightedKeywordScore,
            semanticRank: null,
            keywordRank: index + 1,
            searchType: "keyword",
            originalKeywordScore: keywordScore,
          });
        } else {
          const existing = scoreMap.get(docId);
          existing.keywordScore = weightedKeywordScore;
          existing.keywordRank = index + 1;
          existing.originalKeywordScore = keywordScore;
          if (existing.semanticRank === null) {
            existing.searchType = "keyword";
          } else {
            existing.searchType = "hybrid";
          }
        }
      });
    }

    // Calculate final scores and sort
    const fusedResults = Array.from(scoreMap.values())
      .map((result) => ({
        ...result,
        finalScore: result.semanticScore + result.keywordScore,
      }))
      .sort((a, b) => b.finalScore - a.finalScore);

    return fusedResults;
  }

  /**
   * Build semantic filter based on query type
   */
  buildSemanticFilter(processedQuery) {
    const filters = {};

    // Add category filters based on query type
    if (processedQuery.isApiQuery) {
      filters.category = {
        $in: [
          "api",
          "api_admin_graphql",
          "api_admin_rest",
          "api_storefront",
          "api_products",
          "api_orders",
        ],
      };
    } else if (processedQuery.isProductQuery) {
      filters.category = {
        $in: ["products", "api_products", "manual_products"],
      };
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  /**
   * Build multiple keyword queries for better coverage
   */
  buildKeywordQueries(processedQuery) {
    const queries = [];

    // Original query
    queries.push({
      query: processedQuery.original,
      weight: 1.0,
      type: "original",
    });

    // Expanded query
    if (processedQuery.expanded !== processedQuery.original) {
      queries.push({
        query: processedQuery.expanded,
        weight: 0.8,
        type: "expanded",
      });
    }

    // Key terms query
    if (processedQuery.keyTerms.length > 0) {
      queries.push({
        query: processedQuery.keyTerms.join(" "),
        weight: 0.6,
        type: "keyterms",
      });
    }

    return queries;
  }

  /**
   * Perform multi-query keyword search
   */
  async performMultiKeywordSearch(keywordQueries) {
    const allResults = new Map();

    for (const queryObj of keywordQueries) {
      try {
        const searchResults = this.keywordIndex.search(queryObj.query, {
          limit: this.maxResults,
          suggest: true,
        });

        if (searchResults && searchResults.length > 0) {
          searchResults.forEach((fieldResult) => {
            if (fieldResult.result && fieldResult.result.length > 0) {
              fieldResult.result.forEach((docId, index) => {
                const document = this.findDocumentById(docId);
                if (document) {
                  const score = queryObj.weight * (1 / (index + 1)); // Rank-based scoring

                  if (!allResults.has(docId)) {
                    allResults.set(docId, {
                      id: docId,
                      score: score,
                      document: document,
                      searchTypes: [queryObj.type],
                    });
                  } else {
                    const existing = allResults.get(docId);
                    existing.score += score;
                    existing.searchTypes.push(queryObj.type);
                  }
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn(
          `⚠️ Keyword search failed for query "${queryObj.query}":`,
          error.message
        );
      }
    }

    return Array.from(allResults.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Find document by ID
   */
  findDocumentById(id) {
    return this.documents.find((doc) => doc.id === id) || null;
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      semanticWeight: this.semanticWeight,
      keywordWeight: this.keywordWeight,
      maxResults: this.maxResults,
      finalK: this.finalK,
      isInitialized: this.isInitialized,
    };
  }
}

/**
 * Create a hybrid retriever instance
 */
export async function createHybridRetriever(options = {}) {
  const retriever = new HybridRetriever(options);
  await retriever.initialize();
  return retriever;
}
