import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "../config/config.js";
import pkg from "pg";
const { Pool } = pkg;

/**
 * Hybrid Search System
 * Combines PostgreSQL full-text BM25 search + semantic vector search
 */
class HybridSearch {
  constructor(vectorStore, embeddings) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.isInitialized = false;

    // Initialize PostgreSQL pool
    this.pool = new Pool({
      host: config.pg_host,
      // user: config.pg_user,
      password: config.pg_password,
      database: config.pg_database,
      port: config.pg_port || 5432,
    });
  }

  /**
   * Initialize PostgreSQL full-text search table
   */
  async initialize() {
    try {
      console.log("🔧 Initializing PostgreSQL-based hybrid search...");

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          title TEXT,
          content TEXT,
          category TEXT,
          metadata JSONB,
          source TEXT,
          tsv tsvector
        );
      `;

      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_documents_tsv
        ON documents
        USING gin(tsv);
      `;

      await this.pool.query(createTableQuery);
      await this.pool.query(createIndexQuery);

      this.isInitialized = true;
      console.log("✅ PostgreSQL full-text index ready.");
    } catch (error) {
      console.error("❌ Failed to initialize PostgreSQL search:", error.message);
      throw error;
    }
  }

  /**
   * Insert or update documents into PostgreSQL
   */
  async upsertDocuments(documents) {
    if (!documents || documents.length === 0) return;

    const client = await this.pool.connect();
    try {
      console.log(`📥 Upserting ${documents.length} documents into PostgreSQL...`);

      for (const doc of documents) {
        await client.query(
          `
          INSERT INTO documents (title, content, category, metadata, source, tsv)
          VALUES ($1, $2, $3, $4, $5, to_tsvector('english', $1 || ' ' || $2))
          ON CONFLICT (id) DO UPDATE
          SET title = EXCLUDED.title,
              content = EXCLUDED.content,
              category = EXCLUDED.category,
              metadata = EXCLUDED.metadata,
              source = EXCLUDED.source,
              tsv = EXCLUDED.tsv;
          `,
          [
            doc.title || "",
            doc.content || "",
            doc.category || "documentation",
            JSON.stringify(doc.metadata || {}),
            doc.source || "",
          ]
        );
      }

      console.log("✅ Documents indexed in PostgreSQL.");
    } finally {
      client.release();
    }
  }

  /**
   * Detect if query contains error codes
   */
  isErrorCode(query) {
    const errorPatterns = [
      /card_declined|invalid_cvc|insufficient_funds|processing_error/i,
      /err_\d+|error_\d+|api_error|validation_error/i,
      /\b(4\d{2}|5\d{2})\b/,
      /sk_(live|test)_[a-zA-Z0-9]+|pk_(live|test)_[a-zA-Z0-9]+/i,
      /whsec_[a-zA-Z0-9]+/i,
    ];
    return errorPatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Perform PostgreSQL BM25 full-text search
   */
  async searchBM25(query, topK = 10) {
    try {
      console.log(`🔍 PostgreSQL BM25 search for: "${query}"`);

      const searchQuery = `
        SELECT id, title, content, category, metadata, source,
               ts_rank_cd(tsv, plainto_tsquery('english', $1)) AS score
        FROM documents
        WHERE tsv @@ plainto_tsquery('english', $1)
        ORDER BY score DESC
        LIMIT $2;
      `;

      const { rows } = await this.pool.query(searchQuery, [query, topK]);

      const results = rows.map((row) => ({
        id: row.id,
        content: row.content,
        title: row.title,
        category: row.category,
        metadata: row.metadata,
        source: row.source,
        score: row.score,
        searchType: "bm25",
      }));

      console.log(`📊 PostgreSQL BM25 returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error("❌ PostgreSQL BM25 search failed:", error.message);
      return [];
    }
  }

  /**
   * Perform semantic search (Pinecone or local)
   */
  async searchSemantic(query, topK = 10) {
    try {
      console.log(`🔍 Semantic search for: "${query}"`);

      const queryEmbedding = await this.embeddings.embedQuery(query);
      if (!queryEmbedding || !Array.isArray(queryEmbedding))
        throw new Error("Invalid embedding");

      let semanticResults = [];

      if (this.vectorStore.type === "pinecone") {
        const response = await this.vectorStore.index.query({
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
        });

        semanticResults = response.matches.map((match) => ({
          id: match.id,
          content: match.metadata.content,
          metadata: match.metadata,
          source: match.metadata.source,
          score: match.score,
          searchType: "semantic",
        }));
      } else {
        // Local similarity search
        const sims = this.vectorStore.data.chunks.map((chunk) => ({
          chunk,
          similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
        }));

        semanticResults = sims
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)
          .map((item, i) => ({
            id: i,
            content: item.chunk.content,
            metadata: item.chunk.metadata,
            source:
              item.chunk.metadata?.source ||
              item.chunk.metadata?.source_url ||
              "",
            score: item.similarity,
            searchType: "semantic",
          }));
      }

      return semanticResults;
    } catch (error) {
      console.error("❌ Semantic search failed:", error.message);
      return [];
    }
  }

  cosineSimilarity(a, b) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
    return dot / (magA * magB);
  }

  normalizeScores(results) {
    if (results.length === 0) return results;
    const scores = results.map((r) => r.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1;
    return results.map((r) => ({
      ...r,
      normalizedScore: (r.score - min) / range,
    }));
  }

  fuseResults(bm25Results, semanticResults, semanticWeight, bm25Weight) {
    const normBM25 = this.normalizeScores(bm25Results);
    const normSemantic = this.normalizeScores(semanticResults);
    const combined = new Map();

    normBM25.forEach((r) => {
      combined.set(r.id, {
        ...r,
        bm25Score: r.normalizedScore,
        semanticScore: 0,
        finalScore: bm25Weight * r.normalizedScore,
      });
    });

    normSemantic.forEach((r) => {
      if (combined.has(r.id)) {
        const existing = combined.get(r.id);
        existing.semanticScore = r.normalizedScore;
        existing.finalScore =
          semanticWeight * r.normalizedScore +
          bm25Weight * existing.bm25Score;
      } else {
        combined.set(r.id, {
          ...r,
          bm25Score: 0,
          semanticScore: r.normalizedScore,
          finalScore: semanticWeight * r.normalizedScore,
        });
      }
    });

    return Array.from(combined.values()).sort(
      (a, b) => b.finalScore - a.finalScore
    );
  }

  /**
   * Run hybrid search (BM25 + semantic)
   */
  async hybridSearch(query, topK = 5) {
    if (!this.isInitialized) await this.initialize();

    const isErrorQuery = this.isErrorCode(query);
    const semanticWeight = isErrorQuery ? 0.4 : 0.7;
    const bm25Weight = isErrorQuery ? 0.6 : 0.3;

    console.log(
      `🎯 Query type: ${isErrorQuery ? "Error" : "General"} | Weights → Semantic:${semanticWeight}, BM25:${bm25Weight}`
    );

    try {
      const [bm25Results, semanticResults] = await Promise.all([
        this.searchBM25(query, topK * 2),
        this.searchSemantic(query, topK * 2),
      ]);

      const fused = this.fuseResults(
        bm25Results,
        semanticResults,
        semanticWeight,
        bm25Weight
      );

      return fused.slice(0, topK);
    } catch (err) {
      console.error("❌ Hybrid search failed:", err.message);
      return this.searchSemantic(query, topK);
    }
  }
}

export default HybridSearch;
