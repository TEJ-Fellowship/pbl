import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import fs from "fs";

/**
 * Simple Vector Store - Demonstrates embeddings and vector storage
 * This is the core of semantic search and retrieval
 */
export class VectorStore {
  constructor(apiKey) {
    // Initialize Gemini embeddings
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: "text-embedding-004", // Latest Gemini embedding model
    });

    this.vectorStore = null;
    this.documents = [];
  }

  /**
   * Create embeddings and store documents in vector store
   * This is where the magic happens - text becomes searchable vectors
   */
  async addDocuments(documents) {
    console.log("\n🔮 CREATING EMBEDDINGS");
    console.log("=".repeat(50));
    console.log(`📄 Processing ${documents.length} document chunks...`);

    try {
      // Create vector store from documents
      console.log("🔄 Generating embeddings with Gemini...");
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );

      this.documents = documents;
      console.log(
        `✅ Vector store created with ${documents.length} document chunks`
      );
      console.log(
        `🧠 Each chunk is now represented as a high-dimensional vector`
      );

      return this.vectorStore;
    } catch (error) {
      console.error("❌ Error creating vector store:", error.message);
      throw error;
    }
  }

  /**
   * Search for similar documents using semantic similarity
   * This demonstrates how embeddings enable semantic search
   */
  async search(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized. Add documents first.");
    }

    console.log(`\n🔍 SEMANTIC SEARCH`);
    console.log("=".repeat(50));
    console.log(`🔎 Query: "${query}"`);
    console.log(`📊 Searching for top ${k} similar chunks...`);

    try {
      // Perform similarity search
      const results = await this.vectorStore.similaritySearch(query, k);

      console.log(`✅ Found ${results.length} similar chunks:`);

      results.forEach((result, index) => {
        console.log(`\n📄 Result ${index + 1}:`);
        console.log(`📏 Similarity Score: ${result.metadata?.score || "N/A"}`);
        console.log(
          `📝 Content Preview: ${result.pageContent.substring(0, 150)}...`
        );
        console.log(`🏷️ Source: ${result.metadata?.source || "Unknown"}`);
      });

      return results;
    } catch (error) {
      console.error("❌ Error during search:", error.message);
      throw error;
    }
  }

  /**
   * Search with scores to see similarity values
   */
  async searchWithScores(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized. Add documents first.");
    }

    console.log(`\n🔍 SEMANTIC SEARCH WITH SCORES`);
    console.log("=".repeat(50));
    console.log(`🔎 Query: "${query}"`);

    try {
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k
      );

      console.log(`✅ Found ${results.length} similar chunks with scores:`);

      results.forEach(([document, score], index) => {
        console.log(`\n📄 Result ${index + 1}:`);
        console.log(`🎯 Similarity Score: ${score.toFixed(4)}`);
        console.log(`📝 Content: ${document.pageContent.substring(0, 100)}...`);
        console.log(`🏷️ Source: ${document.metadata?.source || "Unknown"}`);
      });

      return results;
    } catch (error) {
      console.error("❌ Error during search with scores:", error.message);
      throw error;
    }
  }

  /**
   * Demonstrate how embeddings work
   */
  async demonstrateEmbeddings() {
    console.log("\n🧠 EMBEDDINGS DEMONSTRATION");
    console.log("=".repeat(50));

    const sampleTexts = [
      "The quick brown fox jumps over the lazy dog",
      "A fast brown fox leaps over a sleepy dog",
      "Machine learning is a subset of artificial intelligence",
    ];

    console.log("📝 Sample texts:");
    sampleTexts.forEach((text, index) => {
      console.log(`${index + 1}. "${text}"`);
    });

    console.log("\n🔄 Generating embeddings...");

    try {
      const embeddings = await this.embeddings.embedDocuments(sampleTexts);

      console.log(`✅ Generated ${embeddings.length} embeddings`);
      console.log(`📊 Each embedding has ${embeddings[0].length} dimensions`);

      // Show similarity between first two texts (should be high)
      const similarity = this.calculateCosineSimilarity(
        embeddings[0],
        embeddings[1]
      );
      console.log(
        `🎯 Similarity between texts 1 & 2: ${similarity.toFixed(
          4
        )} (high = similar)`
      );

      // Show similarity between first and third texts (should be low)
      const dissimilarity = this.calculateCosineSimilarity(
        embeddings[0],
        embeddings[2]
      );
      console.log(
        `🎯 Similarity between texts 1 & 3: ${dissimilarity.toFixed(
          4
        )} (low = different)`
      );
    } catch (error) {
      console.error("❌ Error generating embeddings:", error.message);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get statistics about the vector store
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      isInitialized: this.vectorStore !== null,
      embeddingModel: "text-embedding-004",
    };
  }
}
