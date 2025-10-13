import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";
import config from "./config/config.js";
import fs from "fs/promises";
import path from "path";

/**
 * Hybrid Search System combining PostgreSQL BM25 keyword search with semantic search
 * Uses PostgreSQL full-text search for BM25 and Pinecone for semantic search
 * Combines results using weighted fusion
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
   * Detect if query contains error codes or technical tokens
   */
  isErrorCode(query) {
    const errorPatterns = [
      // Stripe error codes
      /card_declined|card_expired|insufficient_funds|invalid_cvc|processing_error/i,
      // API error patterns
      /err_\d+|error_\d+|api_error|validation_error/i,
      // HTTP status codes
      /\b(4\d{2}|5\d{2})\b/,
      // Technical tokens
      /sk_(live|test)_[a-zA-Z0-9]+|pk_(live|test)_[a-zA-Z0-9]+/i,
      // Webhook signatures
      /whsec_[a-zA-Z0-9]+/i,
    ];

    return errorPatterns.some((pattern) => pattern.test(query));
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
          content: match.metadata.content,
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

    const scores = results.map((r) => r[scoreField]);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;

    if (range === 0) {
      // All scores are the same, set to 0.5
      return results.map((r) => ({ ...r, normalizedScore: 0.5 }));
    }

    return results.map((r) => ({
      ...r,
      normalizedScore: (r[scoreField] - minScore) / range,
    }));
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
   * Main hybrid search function with PostgreSQL BM25 + semantic fusion
   */
  async hybridSearch(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

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

    try {
      // Perform both searches in parallel
      const [bm25Results, semanticResults] = await Promise.all([
        this.searchBM25(query, topK * 2), // PostgreSQL BM25 search
        this.searchSemantic(query, topK * 2), // Pinecone semantic search
      ]);

      // Fuse results
      const fusedResults = this.fuseResults(
        bm25Results,
        semanticResults,
        semanticWeight,
        bm25Weight
      );

      // Return top results
      const topResults = fusedResults.slice(0, topK);

      // Log results
      console.log("\n📊 Top Results:");
      console.table(
        topResults.map((result, index) => ({
          Rank: index + 1,
          Source: result.source || result.metadata?.source || "Unknown",
          "Final Score": result.finalScore.toFixed(3),
          "BM25 Score": result.bm25Score.toFixed(3),
          "Semantic Score": result.semanticScore.toFixed(3),
          "Match Type": result.searchType || "fused",
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
