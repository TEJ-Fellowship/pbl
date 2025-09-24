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
  //Add documents to the vector store
  async addDocuments(documents) {
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );
    return this.vectorStore;
  }

  //Search the vector store for the most similar documents to the query
  async search(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }
    return await this.vectorStore.similaritySearch(query, k);
  }

  //Search the vector store for the most similar documents to the query with scores
  async searchWithScores(query, k = 3) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }
    return await this.vectorStore.similaritySearchWithScore(query, k);
  }
}
