import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export class VectorStore {
  constructor(apiKey) {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: "text-embedding-004",
    });
    this.vectorStore = null;
  }

  async addDocuments(documents) {
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );
    return this.vectorStore;
  }

  async search(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }
    return await this.vectorStore.similaritySearch(query, k);
  }

  async searchWithScores(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }
    return await this.vectorStore.similaritySearchWithScore(query, k);
  }
}
