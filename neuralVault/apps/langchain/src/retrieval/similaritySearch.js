export class SimilaritySearch {
  constructor(vectorStore) {
    this.vectorStore = vectorStore;
  }

  async search(query, options = {}) {
    const {
      k = 4,
      includeScores = false,
      filters = {},
      threshold = 0.0,
    } = options;

    try {
      let results;

      if (includeScores) {
        results = await this.vectorStore.similaritySearchWithScore(query, k);
      } else {
        results = await this.vectorStore.similaritySearch(query, k);
      }

      // Apply threshold filtering if scores are available
      if (includeScores && threshold > 0) {
        results = results.filter(([doc, score]) => score >= threshold);
      }

      // Apply additional filters
      if (Object.keys(filters).length > 0) {
        results = this.applyFilters(results, filters);
      }

      return this.formatResults(results, includeScores);
    } catch (error) {
      console.error("❌ Similarity search failed:", error.message);
      throw error;
    }
  }

  applyFilters(results, filters) {
    return results.filter(([doc, score]) => {
      // Source filter
      if (filters.source && doc.metadata.source) {
        if (!doc.metadata.source.includes(filters.source)) {
          return false;
        }
      }

      // Date filter
      if (filters.dateRange) {
        const docDate = new Date(doc.metadata.processedAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);

        if (docDate < startDate || docDate > endDate) {
          return false;
        }
      }

      // Content length filter
      if (filters.minContentLength) {
        if (doc.pageContent.length < filters.minContentLength) {
          return false;
        }
      }

      return true;
    });
  }

  formatResults(results, includeScores) {
    if (includeScores) {
      return results.map(([doc, score], index) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: score,
        rank: index + 1,
        confidence: this.calculateConfidence(score),
      }));
    } else {
      return results.map((doc, index) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        rank: index + 1,
      }));
    }
  }

  calculateConfidence(score) {
    // Convert similarity score to confidence percentage
    // Assuming score is between 0 and 1
    return Math.round(score * 100);
  }

  async batchSearch(queries, options = {}) {
    const results = [];

    for (const query of queries) {
      try {
        const result = await this.search(query, options);
        results.push({
          query,
          results: result,
          success: true,
        });
      } catch (error) {
        results.push({
          query,
          results: [],
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
