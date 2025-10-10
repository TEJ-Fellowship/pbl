import FlexSearch from "flexsearch";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import config from "../config/config.js";
import fs from "fs/promises";
import path from "path";

/**
 * Hybrid Search System combining BM25 keyword search with semantic search
 * Implements proper BM25 with TF, IDF, document length normalization
 * Runs BM25 on full corpus and combines with semantic scores using weighted fusion
 */
class HybridSearch {
  constructor(vectorStore, embeddings) {
    this.vectorStore = vectorStore;
    this.embeddings = embeddings;
    this.bm25Index = null;
    this.documents = [];
    this.isInitialized = false;
    this.corpusStats = {
      totalDocs: 0,
      avgLength: 0,
      docFreq: {}, // term -> number of docs containing it
      termFreq: {}, // term -> total frequency across corpus
    };
    this.useOnDemandBM25 = false;
  }

  /**
   * Initialize the hybrid search system with full corpus BM25
   */
  async initialize() {
    try {
      console.log("🔧 Initializing TRUE hybrid search system...");

      // Load all documents from data folder
      await this.loadAllDocuments();

      // Calculate corpus statistics for proper BM25
      this.calculateCorpusStats();

      // Initialize FlexSearch for BM25 keyword search
      this.bm25Index = new FlexSearch.Document({
        tokenize: "forward",
        document: {
          id: "id",
          index: ["content", "title", "category"],
          store: ["content", "metadata", "source"],
        },
      });

      // Index all documents for BM25 search
      this.indexAllDocuments();

      this.isInitialized = true;
      console.log(
        `✅ TRUE hybrid search initialized with ${this.documents.length} documents`
      );
      console.log(
        `📊 Corpus stats: ${
          this.corpusStats.totalDocs
        } docs, avg length: ${this.corpusStats.avgLength.toFixed(0)}`
      );
    } catch (error) {
      console.error(
        "❌ Failed to initialize TRUE hybrid search:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Load all documents from the data folder
   */
  async loadAllDocuments() {
    try {
      console.log("📚 Loading all documents from data folder...");

      const dataPath = path.join(process.cwd(), "data", "vector_store.json");
      const data = JSON.parse(await fs.readFile(dataPath, "utf8"));

      if (data.chunks && Array.isArray(data.chunks)) {
        this.documents = data.chunks.map((chunk, index) => ({
          id: chunk.id || `doc_${index}`,
          content: chunk.content || "",
          title: chunk.metadata?.title || chunk.metadata?.doc_title || "",
          category: chunk.metadata?.category || "documentation",
          metadata: chunk.metadata || {},
          source: chunk.metadata?.source || chunk.metadata?.source_url || "",
          wordCount:
            chunk.metadata?.wordCount || this.countWords(chunk.content || ""),
        }));

        console.log(
          `✅ Loaded ${this.documents.length} documents from data folder`
        );
      } else {
        throw new Error("Invalid data structure in vector_store.json");
      }
    } catch (error) {
      console.error("❌ Failed to load documents:", error.message);
      throw error;
    }
  }

  /**
   * Calculate corpus statistics for proper BM25
   */
  calculateCorpusStats() {
    console.log("📊 Calculating corpus statistics...");

    this.corpusStats.totalDocs = this.documents.length;

    // Calculate average document length
    const totalLength = this.documents.reduce(
      (sum, doc) => sum + doc.wordCount,
      0
    );
    this.corpusStats.avgLength = totalLength / this.documents.length;

    // Calculate document frequency for each term
    this.corpusStats.docFreq = {};
    this.corpusStats.termFreq = {};

    this.documents.forEach((doc) => {
      const terms = this.tokenize(doc.content);
      const uniqueTerms = new Set(terms);

      uniqueTerms.forEach((term) => {
        this.corpusStats.docFreq[term] =
          (this.corpusStats.docFreq[term] || 0) + 1;
      });

      terms.forEach((term) => {
        this.corpusStats.termFreq[term] =
          (this.corpusStats.termFreq[term] || 0) + 1;
      });
    });

    console.log(
      `📊 Corpus stats calculated: ${
        Object.keys(this.corpusStats.docFreq).length
      } unique terms`
    );
  }

  /**
   * Index all documents for BM25 search
   */
  indexAllDocuments() {
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
   * Tokenize text into terms
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 0);
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return this.tokenize(text).length;
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
   * Calculate proper BM25 score for a document
   */
  calculateBM25Score(doc, queryTerms) {
    const k1 = 1.2; // BM25 parameter
    const b = 0.75; // BM25 parameter

    let score = 0;
    const docTerms = this.tokenize(doc.content);
    const docLength = doc.wordCount;

    queryTerms.forEach((term) => {
      const termFreq = docTerms.filter((t) => t === term).length;

      if (termFreq > 0) {
        // Calculate IDF
        const docFreq = this.corpusStats.docFreq[term] || 0;
        const idf = Math.log((this.corpusStats.totalDocs + 1) / (docFreq + 1));

        // Calculate BM25 score
        const numerator = termFreq * (k1 + 1);
        const denominator =
          termFreq +
          k1 * (1 - b + b * (docLength / this.corpusStats.avgLength));

        score += (numerator / denominator) * idf;
      }
    });

    return score;
  }

  /**
   * Perform BM25 search on full corpus
   */
  async searchBM25(query, topK = 10) {
    try {
      console.log(`🔍 BM25 search for: "${query}"`);

      if (!this.bm25Index || this.documents.length === 0) {
        console.log("⚠️ BM25 search not available - no documents indexed");
        return [];
      }

      const queryTerms = this.tokenize(query);

      // Calculate BM25 scores for all documents
      const scoredDocs = this.documents.map((doc) => ({
        ...doc,
        bm25Score: this.calculateBM25Score(doc, queryTerms),
        searchType: "bm25",
      }));

      // Sort by BM25 score and return top results
      const results = scoredDocs
        .filter((doc) => doc.bm25Score > 0)
        .sort((a, b) => b.bm25Score - a.bm25Score)
        .slice(0, topK);

      console.log(`📊 BM25 found ${results.length} results`);
      return results;
    } catch (error) {
      console.error("❌ BM25 search failed:", error.message);
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
      } else {
        // Local vector store search
        const similarities = this.documents.map((doc) => {
          if (!doc.embedding || !Array.isArray(doc.embedding)) {
            return { doc, similarity: 0 };
          }
          return {
            doc,
            similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
          };
        });

        semanticResults = similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, topK)
          .map((item, index) => ({
            id: item.doc.id,
            content: item.doc.content,
            metadata: item.doc.metadata,
            source: item.doc.source,
            semanticScore: item.similarity,
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
   * Main hybrid search function with proper BM25 + semantic fusion
   */
  async hybridSearch(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n🔍 TRUE Hybrid Search: "${query}"`);
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
      console.error("❌ TRUE hybrid search failed:", error.message);

      // Fallback to semantic search only
      console.log("🔄 Falling back to semantic search only...");
      return await this.searchSemantic(query, topK);
    }
  }
}

export default HybridSearch;
