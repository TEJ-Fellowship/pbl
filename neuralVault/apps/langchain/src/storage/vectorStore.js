import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createEmbeddings } from "../config/embeddings.js";

export class VectorStoreManager {
  constructor() {
    this.vectorStore = null;
    this.embeddings = createEmbeddings();
  }

  async initializeFromDocuments(documents) {
    console.log("🔄 Initializing vector store...");
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );
    console.log("✅ Vector store initialized");
    return this.vectorStore;
  }

  async similaritySearch(query, k = 4) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }

    console.log(`🔍 Searching for: "${query}"`);
    const results = await this.vectorStore.similaritySearch(query, k);
    console.log(`✅ Found ${results.length} relevant documents`);
    return results;
  }

  async addDocuments(documents) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }

    await this.vectorStore.addDocuments(documents);
    console.log(`✅ Added ${documents.length} documents to vector store`);
  }

  async similaritySearchWithScore(query, k = 4) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }

    console.log(`🔍 Searching with scores for: "${query}"`);
    const results = await this.vectorStore.similaritySearchWithScore(query, k);
    console.log(`✅ Found ${results.length} relevant documents with scores`);
    return results;
  }

  getVectorStore() {
    return this.vectorStore;
  }

  isInitialized() {
    return this.vectorStore !== null;
  }
}
