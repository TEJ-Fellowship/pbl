import FlexSearch from "flexsearch";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "../config/config.js";

/**
 * Hybrid Search System combining BM25 keyword search with Pinecone semantic search
 * Implements fusion ranking with dynamic weight adjustment for error codes
 */
class HybridSearch {
  constructor(vectorStore, embeddings) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.bm25Index = null;
    this.documents = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the BM25 index with documents from vector store
   */
  async initialize() {
    try {
      console.log("🔧 Initializing hybrid search system...");

      // Initialize FlexSearch for BM25 keyword search
      this.bm25Index = new FlexSearch.Document({
        tokenize: "forward",
        document: {
          id: "id",
          index: ["content", "title", "category"],
          store: ["content", "metadata", "source"],
        },
      });

      // Load documents for BM25 indexing
      await this.loadDocuments();

      // Index documents for BM25 search
      this.indexDocuments();

      this.isInitialized = true;
      console.log(
        `✅ Hybrid search initialized with ${this.documents.length} documents`
      );
    } catch (error) {
      console.error("❌ Failed to initialize hybrid search:", error.message);
      throw error;
    }
  }

  /**
   * Load documents from vector store for BM25 indexing
   */
  async loadDocuments() {
    if (this.vectorStore.type === "pinecone") {
      // For Pinecone, we'll use a different approach:
      // We'll build BM25 index on-demand during search rather than pre-indexing
      console.log("🔧 Pinecone detected - using on-demand BM25 indexing");
      this.documents = [];
      this.useOnDemandBM25 = true;
    } else {
      // Load from local vector store
      if (this.vectorStore.data && this.vectorStore.data.chunks) {
        this.documents = this.vectorStore.data.chunks.map((chunk, index) => ({
          id: index,
          content: chunk.content,
          title: chunk.metadata?.title || chunk.metadata?.doc_title || "",
          category: chunk.metadata?.category || "documentation",
          metadata: chunk.metadata,
          source: chunk.metadata?.source || chunk.metadata?.source_url || "",
        }));
        this.useOnDemandBM25 = false;
      }
    }
  }

  /**
   * Index documents for BM25 search
   */
  indexDocuments() {
    if (this.useOnDemandBM25) {
      console.log("🔧 Using on-demand BM25 indexing for Pinecone");
      return;
    }

    if (!this.bm25Index || this.documents.length === 0) {
      console.log("⚠️ No documents to index for BM25 search");
      return;
    }

    console.log(
      `📚 Indexing ${this.documents.length} documents for BM25 search...`
    );

    this.documents.forEach((doc) => {
      this.bm25Index.add(doc);
    });

    console.log("✅ BM25 index created successfully");
  }

  /**
   * Detect if query contains error codes or technical tokens
   */
  isErrorCode(query) {
    const errorPatterns = [
      // // Stripe error codes
      // /card_declined|card_expired|insufficient_funds|invalid_cvc|processing_error/i,
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
   * Perform BM25 keyword search
   */
  async searchBM25(query, topK = 10) {
    try {
      console.log(`🔍 BM25 search for: "${query}"`);

      if (this.useOnDemandBM25) {
        // For Pinecone, we'll use semantic search results and apply BM25 scoring
        return await this.searchBM25OnDemand(query, topK);
      }

      if (!this.bm25Index || this.documents.length === 0) {
        console.log("⚠️ BM25 search not available - no documents indexed");
        return [];
      }

      const results = this.bm25Index.search(query, {
        limit: topK,
        suggest: true,
      });

      // Convert results to standardized format
      const bm25Results = results.map((result, index) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        source: result.source,
        score: 1 / (index + 1), // Reciprocal rank normalization
        searchType: "bm25",
      }));

      console.log(`📊 BM25 found ${bm25Results.length} results`);
      return bm25Results;
    } catch (error) {
      console.error("❌ BM25 search failed:", error.message);
      return [];
    }
  }

  /**
   * On-demand BM25 search for Pinecone (uses semantic results + BM25 scoring)
   */
  async searchBM25OnDemand(query, topK = 10) {
    try {
      // First get semantic results to work with
      const semanticResults = await this.searchSemantic(query, topK * 2);

      if (semanticResults.length === 0) {
        return [];
      }

      // Apply BM25-style scoring to semantic results
      const bm25Results = semanticResults.map((result, index) => {
        const content = result.content.toLowerCase();
        const queryTerms = query.toLowerCase().split(/\s+/);

        // Simple BM25-style scoring based on term frequency
        let score = 0;
        queryTerms.forEach((term) => {
          const termCount = (content.match(new RegExp(term, "g")) || []).length;
          if (termCount > 0) {
            // Simple TF-IDF-like scoring
            score += termCount / (1 + Math.log(content.length / 100));
          }
        });

        return {
          id: result.id,
          content: result.content,
          metadata: result.metadata,
          source: result.source,
          score: score > 0 ? score : 1 / (index + 1), // Fallback to reciprocal rank
          searchType: "bm25",
        };
      });

      // Sort by BM25 score and return top results
      const sortedResults = bm25Results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      console.log(`📊 BM25 (on-demand) found ${sortedResults.length} results`);
      return sortedResults;
    } catch (error) {
      console.error("❌ On-demand BM25 search failed:", error.message);
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
          score: match.score,
          searchType: "semantic",
        }));
      } else {
        // Local vector store search
        const similarities = this.vectorStore.data.chunks.map((chunk) => {
          if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
            return { chunk, similarity: 0 };
          }
          return {
            chunk,
            similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
          };
        });

        semanticResults = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)
          .map((item, index) => ({
            id: index,
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
  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Normalize scores to 0-1 range using min-max normalization
   */
  normalizeScores(results) {
    if (results.length === 0) return results;

    const scores = results.map((r) => r.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;

    if (range === 0) {
      // All scores are the same, set to 0.5
      return results.map((r) => ({ ...r, normalizedScore: 0.5 }));
    }

    return results.map((r) => ({
      ...r,
      normalizedScore: (r.score - minScore) / range,
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
    const normalizedBM25 = this.normalizeScores(bm25Results);
    const normalizedSemantic = this.normalizeScores(semanticResults);

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
   * Main hybrid search function
   */
  async hybridSearch(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n🔍 Hybrid Search: "${query}"`);
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
        this.searchBM25(query, topK * 2), // Get more results for better fusion
        this.searchSemantic(query, topK * 2),
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
      console.error("❌ Hybrid search failed:", error.message);

      // Fallback to semantic search only
      console.log("🔄 Falling back to semantic search only...");
      return await this.searchSemantic(query, topK);
    }
  }
}

export default HybridSearch;