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
    this.semanticWeight = options.semanticWeight || 0.7; // Default 70% semantic, 30% keyword
    this.keywordWeight = options.keywordWeight || 0.3;
    this.maxResults = options.maxResults || 10; // Get more results for fusion
    this.finalK = options.finalK || 4; // Final number of results to return

    // Initialize FlexSearch index for keyword search
    this.keywordIndex = new FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: "id",
        index: ["text", "title", "section", "category"],
        store: ["text", "metadata"],
      },
      cache: true,
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
      const keywordResults = this.keywordIndex.search(query, {
        limit: this.maxResults,
        suggest: true,
      });

      // 3. Fusion ranking
      console.log("🔄 Applying fusion ranking...");
      const fusedResults = this.fuseResults(
        semanticResults.matches,
        keywordResults,
        this.semanticWeight,
        this.keywordWeight
      );

      // 4. Return top k results
      const finalResults = fusedResults
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
   * Fusion ranking algorithm combining semantic and keyword search results
   */
  fuseResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
    const scoreMap = new Map();

    // Process semantic results
    semanticResults.forEach((result, index) => {
      const docId = result.id;
      const document = this.findDocumentById(docId);

      // Skip if document not found
      if (!document) return;

      const normalizedScore = 1 / (index + 1); // Reciprocal rank normalization
      const weightedScore = semanticWeight * normalizedScore;

      if (!scoreMap.has(docId)) {
        scoreMap.set(docId, {
          document: document,
          semanticScore: weightedScore,
          keywordScore: 0,
          semanticRank: index + 1,
          keywordRank: null,
          searchType: "semantic",
        });
      } else {
        const existing = scoreMap.get(docId);
        existing.semanticScore = weightedScore;
        existing.semanticRank = index + 1;
        if (existing.keywordRank === null) {
          existing.searchType = "semantic";
        } else {
          existing.searchType = "hybrid";
        }
      }
    });

    // Process keyword results
    keywordResults.forEach((result, index) => {
      const docId = result.id;
      const document = this.findDocumentById(docId);

      // Skip if document not found
      if (!document) return;

      const normalizedScore = 1 / (index + 1); // Reciprocal rank normalization
      const weightedScore = keywordWeight * normalizedScore;

      if (!scoreMap.has(docId)) {
        scoreMap.set(docId, {
          document: document,
          semanticScore: 0,
          keywordScore: weightedScore,
          semanticRank: null,
          keywordRank: index + 1,
          searchType: "keyword",
        });
      } else {
        const existing = scoreMap.get(docId);
        existing.keywordScore = weightedScore;
        existing.keywordRank = index + 1;
        if (existing.semanticRank === null) {
          existing.searchType = "keyword";
        } else {
          existing.searchType = "hybrid";
        }
      }
    });

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
