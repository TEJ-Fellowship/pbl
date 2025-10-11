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
    this.semanticWeight = options.semanticWeight || 0.6; // Balanced weights for better diversity
    this.keywordWeight = options.keywordWeight || 0.4;
    this.maxResults = options.maxResults || 15; // Get more results for better fusion
    this.finalK = options.finalK || 6; // Return more results for comprehensive answers
    this.diversityBoost = options.diversityBoost || 0.1; // Boost for category diversity

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
   * Perform hybrid search combining semantic and keyword search
   */
  async search({ query, queryEmbedding, k = 4 }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get Pinecone index
      const index = await getPineconeIndex();

      // 1. Semantic search using Pinecone
      console.log("🔍 Performing semantic search...");
      const semanticResults = await index.query({
        vector: queryEmbedding,
        topK: this.maxResults,
        includeMetadata: true,
        includeValues: false,
      });

      // 2. Keyword search using FlexSearch
      console.log("🔍 Performing keyword search...");
      const keywordSearchResults = this.keywordIndex.search(query, {
        limit: this.maxResults,
        suggest: true,
      });

      // Process FlexSearch results format
      const keywordResults = [];
      if (keywordSearchResults && keywordSearchResults.length > 0) {
        keywordSearchResults.forEach((fieldResult) => {
          if (fieldResult.result && fieldResult.result.length > 0) {
            fieldResult.result.forEach((docId) => {
              const document = this.findDocumentById(docId);
              if (document) {
                keywordResults.push({
                  id: docId,
                  score: 1.0, // FlexSearch doesn't provide scores, use 1.0
                  document: document,
                });
              }
            });
          }
        });
      }

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
