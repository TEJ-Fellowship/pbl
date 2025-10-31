import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";
import config from "./config/config.js";
import fs from "fs/promises";
import path from "path";

/**
 * 🔍 Twilio Hybrid Search System
 * Combines PostgreSQL BM25 keyword search + Pinecone semantic search
 * Optimized for Twilio docs, APIs, error codes, webhooks, and SDKs.
 */
class HybridSearch {
  constructor(vectorStore, embeddings, postgresBM25Service = null) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.postgresBM25Service =
      postgresBM25Service || new PostgreSQLBM25Service();
    this.isInitialized = false;
  }

  /** Initialize PostgreSQL + Vector store connections */
  async initialize() {
    try {
      console.log("🔧 Initializing Twilio Hybrid Search System...");

      console.log("   🗄️ Testing PostgreSQL BM25 service...");
      const stats = await this.postgresBM25Service.getStats();
      console.log(`      ✅ PostgreSQL connection OK`);
      console.log(
        `      📊 Database stats: ${stats.total_chunks} chunks, ${stats.categories} categories`
      );

      // Check Pinecone or other vector store
      if (this.vectorStore?.type === "pinecone") {
        console.log("   🌲 Testing Pinecone vector store...");
        try {
          const indexStats = await this.vectorStore.index.describeIndexStats();
          console.log("      ✅ Pinecone connection OK");
          console.log(
            `      📊 Total vectors: ${indexStats.totalVectorCount || 0}`
          );
          console.log(
            `      📏 Dimensions: ${indexStats.dimension || "Unknown"}`
          );
        } catch (error) {
          console.error(
            `      ❌ Pinecone connection failed: ${error.message}`
          );
        }
      }

      this.isInitialized = true;
      console.log("   ✅ Twilio Hybrid Search Initialized Successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize Twilio Hybrid Search:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Detect if a query looks like a Twilio error code, SID, or technical token
   */
  isErrorCode(query) {
    const errorPatterns = [
      // Twilio Error Codes (3-6 digits, e.g., 11200, 21614, 30007, 63001, 53405, etc.)
      /\b(1\d{4,5}|2\d{4,5}|3\d{4,5}|4\d{4,5}|5\d{4,5}|6\d{4,5}|7\d{4,5}|8\d{4,5}|9\d{4,5}|300\d{2})\b/,
      // Twilio Resource SIDs (e.g., AC..., SM..., PN..., etc.)
      /\b([A-Z]{2})[a-fA-F0-9]{32}\b/,
      // Webhook signatures
      /X-Twilio-Signature|twilio_signature/i,
      // API Keys and Tokens (SK, AC, RK, PK, EK, etc.)
      /\b([A-Z]{2})[a-fA-F0-9]{32}\b|TWILIO_AUTH_TOKEN/i,
      // Messaging/Phone identifiers (E.164 phone, SM SID)
      /\+\d{10,15}|\bSM[a-zA-Z0-9]{32}\b/i,
      // Common error words
      /invalid_number|invalid_phone_number|invalid_sid|invalid_auth_token|authentication_error|api_error|rate_limit|forbidden|unauthorized/i,
      // HTTP status codes
      /\b(4\d{2}|5\d{2})\b/,
    ];

    return errorPatterns.some((pattern) => pattern.test(query));
  }

  /** BM25 keyword search using PostgreSQL full-text search */
  async searchBM25(query, topK = 10, filters = {}) {
    try {
      console.log(`\n🔍 BM25 Search: "${query.substring(0, 50)}..."`);

      const results = await this.postgresBM25Service.searchBM25(
        query,
        topK,
        filters
      );

      console.log(`📊 PostgreSQL BM25 returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error("❌ BM25 search failed:", error.message);
      return [];
    }
  }

  /** Semantic search via Pinecone or local embeddings */
  async searchSemantic(query, topK = 10) {
    try {
      console.log(`\n🧠 Semantic Search: "${query.substring(0, 50)}..."`);

      const queryEmbedding = await this.embeddings.embedQuery(query);
      if (!queryEmbedding || !Array.isArray(queryEmbedding))
        throw new Error("Failed to generate query embedding");

      let semanticResults = [];

      if (this.vectorStore?.type === "pinecone") {
        const searchResponse = await this.vectorStore.index.query({
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
        });

        semanticResults = searchResponse.matches.map((match) => ({
          id: match.id,
          content: match.metadata.content,
          metadata: {
            source: match.metadata.source,
            title: match.metadata.title,
            category: match.metadata.category,
            apiSection: match.metadata.apiSection,
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

  /** Normalize scores to [0,1] range */
  normalizeScores(results, scoreField = "score") {
    if (results.length === 0) return results;

    const scores = results.map((r) => r[scoreField]);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1;

    return results.map((r) => ({
      ...r,
      normalizedScore: (r[scoreField] - min) / range,
    }));
  }

  /** Fuse BM25 + Semantic results with weighted blending */
  fuseResults(
    bm25Results,
    semanticResults,
    semanticWeight = 0.7,
    bm25Weight = 0.3
  ) {
    console.log(
      `🔄 Fusing ${bm25Results.length} BM25 + ${semanticResults.length} semantic results`
    );

    const normBM25 = this.normalizeScores(bm25Results, "bm25Score");
    const normSemantic = this.normalizeScores(semanticResults, "semanticScore");
    const combined = new Map();

    // BM25 first
    normBM25.forEach((r) => {
      const key = r.id || r.content.slice(0, 100);
      combined.set(key, {
        ...r,
        bm25Score: r.normalizedScore,
        semanticScore: 0,
        finalScore: bm25Weight * r.normalizedScore,
      });
    });

    // Merge semantic
    normSemantic.forEach((r) => {
      const key = r.id || r.content.slice(0, 100);
      const existing = combined.get(key);
      if (existing) {
        existing.semanticScore = r.normalizedScore;
        existing.finalScore =
          semanticWeight * r.normalizedScore + bm25Weight * existing.bm25Score;
      } else {
        combined.set(key, {
          ...r,
          bm25Score: 0,
          semanticScore: r.normalizedScore,
          finalScore: semanticWeight * r.normalizedScore,
        });
      }
    });

    const fused = Array.from(combined.values()).sort(
      (a, b) => b.finalScore - a.finalScore
    );

    console.log(`✅ Fused ${fused.length} total results`);
    return fused;
  }

  /** Perform hybrid search */
  async hybridSearch(query, topK = 5) {
    if (!this.isInitialized) await this.initialize();

    console.log(`\n🚀 Hybrid Search for: "${query}"`);
    console.log("=".repeat(60));

    const isErrorQuery = this.isErrorCode(query);
    const semanticWeight = isErrorQuery ? 0.4 : 0.7;
    const bm25Weight = isErrorQuery ? 0.6 : 0.3;

    console.log(
      `🎯 Query Type: ${isErrorQuery ? "Error/Technical" : "General Info"}`
    );
    console.log(`⚖️ Weights: Semantic=${semanticWeight}, BM25=${bm25Weight}`);

    try {
      const [bm25Results, semanticResults] = await Promise.all([
        this.searchBM25(query, topK * 2),
        this.searchSemantic(query, topK * 2),
      ]);

      const fusedResults = this.fuseResults(
        bm25Results,
        semanticResults,
        semanticWeight,
        bm25Weight
      );

      const topResults = fusedResults.slice(0, topK);

      console.log("\n📊 Top Results:");
      console.table(
        topResults.map((r, i) => ({
          Rank: i + 1,
          Source: r.source || r.metadata?.source || "Unknown",
          "Final Score": r.finalScore.toFixed(3),
          BM25: r.bm25Score.toFixed(3),
          Semantic: r.semanticScore.toFixed(3),
          "Match Type": r.searchType || "fused",
        }))
      );

      return topResults;
    } catch (error) {
      console.error("❌ Twilio hybrid search failed:", error.message);
      console.log("🔄 Falling back to semantic search...");
      return this.searchSemantic(query, topK);
    }
  }
}

export default HybridSearch;
