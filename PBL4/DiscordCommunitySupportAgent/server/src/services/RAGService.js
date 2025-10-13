import DatabaseConfig from "../config/database.js";
import EmbeddingService from "./embeddingService.js";

class RAGService {
  constructor() {
    this.db = new DatabaseConfig();
    this.embeddingService = new EmbeddingService();
    this.vectorStore = null;
  }

  async initialize() {
    try {
      console.log("Initializing RAG Service");

      // initialize embedding service
      await this.embeddingService.initialize();

      // initialize database
      this.vectorStore = await this.db.initialize();

      console.log("RAG Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize RAG", error.message);
      throw error;
    }
  }

  async storeDocuments(documents) {
    try {
      console.log("Storing documents into vector database");

      const processedChunks = await this.embeddingService.processDocuments(
        documents
      );

      if (processedChunks.length === 0) {
        throw new Error("No valid chunks to store");
      }

      const langchainDocuments = processedChunks.map((chunk) => ({
        pageContent: chunk.pageContent,
        metadata: chunk.metadata,
      }));

      await this.db.addDocuments(langchainDocuments);

      const stats = await this.db.getCollectionStats();

      console.log(`Stored ${processedChunks.length} chunks in database`);
      console.log(`Total documents in collection: ${stats.totalDocuments}`);

      return {
        storedChunks: processedChunks.length,
        totalDocuments: stats.totalDocuments,
      };
    } catch (error) {
      console.error(`Failed to store documents: ${error.message}`);
      throw error;
    }
  }

  async search(query, nResults = 5) {
    try {
      console.log(`Searching: ${query}`);

      const results = await this.db.queryDocuments(query, nResults);

      if (!results || results.length === 0) {
        console.log("No relevant documents found");
        return [];
      }

      // Format results
      const formattedResults = this.formatSearchResults(results);
      console.log(`Found ${formattedResults.length} relevant results`);
      return formattedResults;
    } catch (error) {
      console.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  async formatSearchResults(results) {
    const formattedResults = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      const textContent =
        typeof result.pageContent === "string"
          ? result.pageContent
          : JSON.stringify(result.pageContent);

      formattedResults.push({
        id: `result_${i}`,
        text: textContent,
        metadata: result.metadata,
        similarity: 1.0, // LangChain doesn't provide scores by default
        relevanceScore: this.calculateRelevanceScore(
          textContent,
          result.metadata,
          0
        ),
      });
    }
    return formattedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevanceScore(document, metadata, distance) {
    let score = 1 - distance; // Base similarity score

    // Boost score for step-by-step guides
    if (metadata.isStepByStep) {
      score += 0.1;
    }

    // Boost score for official Discord content
    if (metadata.type === "support" || metadata.type === "developer") {
      score += 0.05;
    }

    // Boost score for recent content
    if (metadata.scrapedAt) {
      const daysSinceScraped =
        (new Date() - new Date(metadata.scrapedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceScraped < 30) {
        score += 0.02;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  async getContextForQuery(query, maxContentLength = 2000) {
    try {
      const searchResult = await this.search(query, 10);

      if (searchResult.length === 0) {
        return "";
      }

      let context = "";
      let currentLength = 0;

      for (const result of searchResult) {
        const chunkText = result.text;

        if (currentLength + chunkText.length <= maxContentLength) {
          context = `\n\n---Source: ${result.metadata.title} ---\n${chunkText}`;
          currentLength += chunkText.length;
        } else {
          const remainingSpace = maxContentLength - currentLength;
          if (remainingSpace > 100) {
            context += `\n\n--- Source: ${
              result.metadata.title
            } ---\n${chunkText.substring(0, remainingSpace)}...`;
          }
          break;
        }
      }
      return context.trim();
    } catch (error) {
      console.error("Failed to get context", error.message);
      return "";
    }
  }

  async getCollectionStats() {
    try {
      const stats = await this.db.getCollectionStats();
      return stats;
    } catch (error) {
      console.error(`Failed to get collection stats: ${error.message}`);
      throw error;
    }
  }

  async clearCollection() {
    try {
      console.log("Clearing collection...");
      // Note: ChromaDB doesn't have a direct clear method in the current API
      // This would require recreating the collection
      console.log(
        "Collection clear not implemented - recreate collection if needed"
      );
    } catch (error) {
      console.error(`Failed to clear collection: ${error.message}`);
      throw error;
    }
  }
}

export default RAGService;
