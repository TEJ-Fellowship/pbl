import GeminiConfig from "../config/gemini.js";
import TextSplitter from "../utils/textSplitter.js";

class EmbeddingService {
  constructor() {
    this.gemini = new GeminiConfig();
    this.textSplitter = new TextSplitter();
  }

  async initialize() {
    try {
      this.gemini.initialize();
      console.log("Embedding Service initialized!");
    } catch (error) {
      console.error("Failed to initialize embedding service", error.message);
      throw error;
    }
  }

  async processDocuments(documents) {
    try {
      console.log("Processing documents for langchain");
      const processedChunks = [];

      let totalChunks = 0;

      for (const doc of documents) {
        console.log(`Processing ${doc.title}`);

        const chunks = await this.textSplitter.splitText(doc.content, {
          title: doc.title,
          url: doc.url,
          type: doc.type,
          scrapedAt: doc.scrapedAt,
        });

        console.log(`Generated ${chunks.length} chunks from ${doc.title}`);

        for (const chunk of chunks) {
          processedChunks.push({
            pageContent: chunk.text,
            metadata: chunk.metadata,
          });
          totalChunks++;
        }

        console.log(`Processed ${chunks.length} chunks from ${doc.title}`);
      }

      console.log(`Total processed chunks ${totalChunks}`);
      return processedChunks;
    } catch (error) {
      console.error("Failed to processed documents", error.message);
      throw error;
    }
  }

  async generateQueryEmbedding(query) {
    try {
      console.log(`Generating query embedding`);

      const embeddings = await this.gemini.generateQueryEmbedding(query);

      console.log("Query embedding generated");
      return embeddings;
    } catch (error) {
      console.error("Failed to generate query embedding", error.message);
      throw error;
    }
  }

  async getEmbeddingStats(processedChunks) {
    const stats = {
      totalChunks: processedChunks.length,
      totalDocuments: new Set(
        processedChunks.map((chunk) => chunk.metadata.url).size
      ),
      averageChunkSize:
        processedChunks.reduce(
          (sum, check) => sum + check.pageContent.length,
          0
        ) / processedChunks.length,
      documentTypes: {},
    };

    processedChunks.forEach((chunk) => {
      const type = chunk.metadata.type || "unknown";
      stats.documentTypes[type] = (stats.documentTypes[type] || 0) + 1;
    });

    return stats;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default EmbeddingService;
