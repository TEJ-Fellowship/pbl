import { VectorStoreManager } from "../storage/vectorStore.js";

export class DocumentRetriever {
  constructor(vectorStoreManager) {
    this.vectorStore = vectorStoreManager;
  }

  async retrieveRelevantDocuments(query, k = 4) {
    const documents = await this.vectorStore.similaritySearch(query, k);

    // Format documents for chat context
    const formattedDocs = documents.map((doc, index) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      relevance: index + 1, // Simple relevance scoring
    }));

    return formattedDocs;
  }

  async retrieveWithContext(query, context = "") {
    const enhancedQuery = context ? `${context}\n\nQuery: ${query}` : query;
    return await this.retrieveRelevantDocuments(enhancedQuery);
  }

  async retrieveWithScore(query, k = 4) {
    const results = await this.vectorStore.similaritySearchWithScore(query, k);

    // Format documents with scores
    const formattedDocs = results.map(([doc, score], index) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: score,
      relevance: index + 1,
    }));

    return formattedDocs;
  }

  async retrieveFiltered(query, filters = {}, k = 4) {
    // Basic filtering implementation
    const documents = await this.retrieveRelevantDocuments(query, k * 2); // Get more to filter

    // Apply filters
    let filteredDocs = documents;

    if (filters.source) {
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.metadata.source && doc.metadata.source.includes(filters.source)
      );
    }

    if (filters.minRelevance) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.relevance <= filters.minRelevance
      );
    }

    return filteredDocs.slice(0, k);
  }
}
