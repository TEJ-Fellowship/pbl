import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";
import config from "../config/config.js";
import fs from "fs/promises";
import path from "path";

/**
 * Hybrid Search System for Email Marketing Support
 *
 * Features:
 * 1. PostgreSQL BM25 - Fast keyword/exact match search
 * 2. Semantic Search - Understands meaning and context
 * 3. Recency Boost - Prioritizes recent articles (email marketing trends change fast!)
 *
 * How it works:
 * - Searches using both BM25 (keywords) and semantic (meaning) in parallel
 * - Combines results using weighted fusion
 * - Applies recency boost to favor newer content
 * - Returns the most relevant, up-to-date results
 *
 * Recency Boost Logic:
 *   < 30 days old   → 1.5x boost (very recent)
 *   30-90 days old  → 1.3x boost (recent)
 *   90-180 days old → 1.1x boost (moderately recent)
 *   180-365 days   → 1.0x boost (neutral)
 *   > 365 days old → 0.5-0.7x penalty (older content)
 */
class HybridSearch {
  constructor(vectorStore, embeddings, postgresBM25Service = null) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.postgresBM25Service =
      postgresBM25Service || new PostgreSQLBM25Service();
    this.isInitialized = false;
  }

  /**
   * Initialize the hybrid search system
   */
  async initialize() {
    try {
      console.log("🔧 Initializing PostgreSQL-based hybrid search system...");

      // Test PostgreSQL connection
      const stats = await this.postgresBM25Service.getStats();
      console.log(`✅ PostgreSQL connection established`);
      console.log("------------------------------------------");
      console.log(
        `📊 Database stats: ${stats.total_chunks} chunks, ${stats.categories} categories`
      );

      this.isInitialized = true;
      console.log("✅ PostgreSQL-based hybrid search initialized");
    } catch (error) {
      console.error(
        "❌ Failed to initialize PostgreSQL hybrid search:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Perform BM25 search using PostgreSQL full-text search
   */
  async searchBM25(query, topK = 10, filters = {}) {
    try {
      console.log(`🔍 PostgreSQL BM25 search for: "${query}"`);

      const results = await this.postgresBM25Service.searchBM25(
        query,
        topK,
        filters
      );

      console.log(`📊 PostgreSQL BM25 found ${results.length} results`);
      return results;
    } catch (error) {
      console.error("❌ PostgreSQL BM25 search failed:", error.message);
      return [];
    }
  }

  /**
   * Perform semantic search using Pinecone or local embeddings
   */
  async searchSemantic(query, topK = 10) {
    try {
      console.log(`🔍 Semantic search for: "${query}"`);

      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      if (
        !queryEmbedding ||
        !Array.isArray(queryEmbedding) ||
        queryEmbedding.length === 0
      ) {
        throw new Error("Failed to generate query embedding");
      }

      let semanticResults = [];

      if (this.vectorStore.type === "pinecone") {
        // Pinecone search
        const searchResponse = await this.vectorStore.index.query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
        });

        semanticResults = searchResponse.matches.map((match, index) => ({
          id: match.id,
          content: match.metadata.content || match.metadata.pageContent,
          metadata: {
            source: match.metadata.source,
            title: match.metadata.title,
            category: match.metadata.category,
            docType: match.metadata.docType,
            chunk_index: match.metadata.chunk_index,
            total_chunks: match.metadata.total_chunks,
          },
          source: match.metadata.source,
          semanticScore: match.score,
          searchType: "semantic",
        }));
      }

      console.log(`📊 Semantic search found ${semanticResults.length} results`);
      return semanticResults;
    } catch (error) {
      console.error("❌ Semantic search failed:", error.message);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  // cosineSimilarity(a, b) {
  //   const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  //   const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  //   const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  //   return dotProduct / (magnitudeA * magnitudeB);
  // }

  /**
   * Normalize scores to 0-1 range using min-max normalization
   */
  normalizeScores(results, scoreField = "score") {
    if (results.length === 0) return results;

    const scores = results.map((r) => r[scoreField] || 0);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 1;

    return results.map((r) => ({
      ...r,
      normalizedScore: (r[scoreField] - minScore) / range,
    }));
  }

  /**
   * Calculate recency boost for an article based on its date
   * Recent articles get higher boost (email marketing trends change fast!)
   */
  calculateRecencyBoost(articleDate) {
    if (!articleDate) {
      // No date info - use neutral boost
      return 1.0;
    }

    try {
      // Convert to Date object if it's a string
      const date =
        typeof articleDate === "string" ? new Date(articleDate) : articleDate;
      const now = new Date();

      // Calculate age in days
      const ageInDays = (now - date) / (1000 * 60 * 60 * 24);

      // Boost calculation:
      // - Articles < 30 days: 1.5x boost (very recent)
      // - Articles 30-90 days: 1.3x boost (recent)
      // - Articles 90-180 days: 1.1x boost (moderately recent)
      // - Articles 180-365 days: 1.0x boost (neutral)
      // - Articles > 365 days: 0.7x penalty (older content)

      if (ageInDays < 30) {
        return 1.5; // Very recent articles
      } else if (ageInDays < 90) {
        return 1.3; // Recent articles
      } else if (ageInDays < 180) {
        return 1.1; // Moderately recent
      } else if (ageInDays < 365) {
        return 1.0; // Neutral
      } else {
        // Gradually decrease for older articles
        // After 2 years, minimum boost is 0.5
        const yearsOld = ageInDays / 365;
        return Math.max(0.5, 1.0 - (yearsOld - 1) * 0.25);
      }
    } catch (error) {
      console.warn("Failed to calculate recency boost:", error.message);
      return 1.0; // Default neutral boost on error
    }
  }

  /**
   * Detect if query contains error codes or technical issues
   * Error queries benefit more from keyword matching (BM25)
   */
  isErrorCode(query) {
    const errorPatterns = [
      /error/i,
      /\d{3,4}/, // HTTP codes, error numbers
      /failed?/i,
      /not working/i,
      /broken/i,
      /issue/i,
      /problem/i,
      /troubleshoot/i,
      /fix/i,
      /debug/i,
    ];

    return errorPatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Apply recency boost to search results
   */
  applyRecencyBoost(results) {
    console.log("📅 Applying recency boost to results...");

    return results.map((result) => {
      // Get date from metadata (check multiple possible fields)
      const articleDate =
        result.metadata?.publishedDate ||
        result.metadata?.date ||
        result.metadata?.created_at ||
        result.metadata?.updatedAt;

      // Calculate boost multiplier
      const recencyBoost = this.calculateRecencyBoost(articleDate);

      // Store original score for debugging
      const originalScore = result.finalScore || result.normalizedScore || 0;

      // Apply boost to the score
      const boostedScore = originalScore * recencyBoost;

      console.log(
        `  📄 "${(
          result.metadata?.title ||
          result.content?.substring(0, 40) ||
          "Unknown"
        ).substring(0, 50)}"` +
          ` | Age: ${
            articleDate
              ? Math.floor(
                  (new Date() - new Date(articleDate)) / (1000 * 60 * 60 * 24)
                ) + " days"
              : "unknown"
          }` +
          ` | Boost: ${recencyBoost.toFixed(2)}x` +
          ` | Score: ${originalScore.toFixed(3)} → ${boostedScore.toFixed(3)}`
      );

      return {
        ...result,
        originalScore, // Keep original for reference
        recencyBoost,
        finalScore: boostedScore, // Update with boosted score
        articleDate,
      };
    });
  }

  /**
   * Fuse BM25 and semantic results using weighted combination
   */
  fuseResults(
    bm25Results,
    semanticResults,
    semanticWeight = 0.7,
    bm25Weight = 0.3
  ) {
    console.log(
      `🔄 Fusing results: ${bm25Results.length} BM25 + ${semanticResults.length} semantic`
    );

    // Normalize scores
    const normalizedBM25 = this.normalizeScores(bm25Results, "bm25Score");
    const normalizedSemantic = this.normalizeScores(
      semanticResults,
      "semanticScore"
    );

    // Create a map to track combined results
    const combinedResults = new Map();

    // Add BM25 results
    normalizedBM25.forEach((result) => {
      const key = result.id || result.content.substring(0, 100);
      combinedResults.set(key, {
        ...result,
        bm25Score: result.normalizedScore,
        semanticScore: 0,
        finalScore: bm25Weight * result.normalizedScore,
      });
    });

    // Add/update with semantic results
    normalizedSemantic.forEach((result) => {
      const key = result.id || result.content.substring(0, 100);
      const existing = combinedResults.get(key);

      if (existing) {
        // Update existing result
        existing.semanticScore = result.normalizedScore;
        existing.finalScore =
          semanticWeight * result.normalizedScore +
          bm25Weight * existing.bm25Score;
      } else {
        // Add new result
        combinedResults.set(key, {
          ...result,
          bm25Score: 0,
          semanticScore: result.normalizedScore,
          finalScore: semanticWeight * result.normalizedScore,
        });
      }
    });

    // Convert to array and sort by final score
    const fusedResults = Array.from(combinedResults.values()).sort(
      (a, b) => b.finalScore - a.finalScore
    );

    console.log(`✅ Fused ${fusedResults.length} unique results`);
    return fusedResults;
  }

  /**
   * Main hybrid search function with PostgreSQL BM25 + semantic fusion + recency boost
   * Combines keyword search, semantic search, and prioritizes recent articles
   */
  async hybridSearch(query, topK = 5, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Options: allow disabling recency boost if needed
    const { enableRecencyBoost = true } = options;

    console.log(`\n🔍 PostgreSQL Hybrid Search: "${query}"`);
    console.log("=".repeat(50));

    // Detect if query contains error codes
    const isErrorQuery = this.isErrorCode(query);
    const semanticWeight = isErrorQuery ? 0.4 : 0.7;
    const bm25Weight = isErrorQuery ? 0.6 : 0.3;

    console.log(
      `🎯 Query type: ${isErrorQuery ? "Error Code/Technical" : "General"}`
    );
    console.log(`⚖️ Weights: Semantic=${semanticWeight}, BM25=${bm25Weight}`);
    console.log(
      `📅 Recency boost: ${enableRecencyBoost ? "ENABLED" : "DISABLED"}`
    );

    try {
      // Perform both searches in parallel
      const [bm25Results, semanticResults] = await Promise.all([
        this.searchBM25(query, topK * 2), // PostgreSQL BM25 search
        this.searchSemantic(query, topK * 2), // Pinecone semantic search
      ]);

      // Fuse results using weighted combination
      let fusedResults = this.fuseResults(
        bm25Results,
        semanticResults,
        semanticWeight,
        bm25Weight
      );

      // Apply recency boost to prioritize recent articles
      // Email marketing trends change fast - recent content is more valuable!
      if (enableRecencyBoost) {
        fusedResults = this.applyRecencyBoost(fusedResults);

        // Re-sort after applying recency boost
        fusedResults.sort((a, b) => b.finalScore - a.finalScore);
      }

      // Return top results
      const topResults = fusedResults.slice(0, topK);

      // Log results with recency info
      console.log("\n📊 Top Results (with Recency Boost):");
      console.table(
        topResults.map((result, index) => ({
          Rank: index + 1,
          Source: result.source || result.metadata?.source || "Unknown",
          "Final Score": result.finalScore.toFixed(3),
          "BM25 Score": result.bm25Score.toFixed(3),
          "Semantic Score": result.semanticScore.toFixed(3),
          "Recency Boost": result.recencyBoost
            ? result.recencyBoost.toFixed(2) + "x"
            : "N/A",
          Age: result.articleDate
            ? Math.floor(
                (new Date() - new Date(result.articleDate)) /
                  (1000 * 60 * 60 * 24)
              ) + "d"
            : "N/A",
        }))
      );

      return topResults;
    } catch (error) {
      console.error("❌ PostgreSQL hybrid search failed:", error.message);

      // Fallback to semantic search only
      console.log("🔄 Falling back to semantic search only...");
      return await this.searchSemantic(query, topK);
    }
  }
}

export default HybridSearch;
