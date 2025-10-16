import { searchSimilarDocuments } from '../repositories/vectorRepository.js';
import { searchDocuments } from '../search/keywordSearch.js';
import { hybridSearch, initializeHybridSearch } from '../search/hybridSearch.js';
import { rerankResults } from '../search/reranker.js';

/**
 * Main Search Service - Orchestrates all search functionality
 * Provides a unified interface for different search methods
 */
class SearchService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Search Service...');
      
      // Initialize hybrid search
      await initializeHybridSearch();
      
      this.isInitialized = true;
      console.log('✅ Search Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Search Service initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Perform semantic search using vector similarity
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Search results
   */
  async semanticSearch(query, limit = 5) {
    try {
      const results = await searchSimilarDocuments(query, limit);
      
      return results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: 1 - results.distances[0][index],
        searchMethod: 'semantic',
        semanticScore: 1 - results.distances[0][index],
        keywordScore: 0,
        crossEncoderScore: 0
      }));
    } catch (error) {
      console.error('❌ Semantic search failed:', error.message);
      return [];
    }
  }

  /**
   * Perform keyword search using BM25/FlexSearch
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Array} Search results
   */
  keywordSearch(query, limit = 5) {
    try {
      const results = searchDocuments(query, [], limit);
      
      return results.map(result => ({
        content: result.content,
        metadata: result.metadata,
        similarity: result.score,
        searchMethod: 'keyword',
        semanticScore: 0,
        keywordScore: result.score,
        crossEncoderScore: 0
      }));
    } catch (error) {
      console.error('❌ Keyword search failed:', error.message);
      return [];
    }
  }

  /**
   * Perform hybrid search combining semantic and keyword search
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @param {number} semanticWeight - Weight for semantic search (default: 0.65)
   * @param {number} keywordWeight - Weight for keyword search (default: 0.35)
   * @param {boolean} enableReranking - Whether to enable cross-encoder reranking
   * @returns {Promise<Array>} Search results
   */
  async hybridSearch(query, limit = 5, semanticWeight = 0.65, keywordWeight = 0.35, enableReranking = false) {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ Search service not initialized, falling back to semantic search');
        return await this.semanticSearch(query, limit);
      }

      const results = await hybridSearch(query, limit, semanticWeight, keywordWeight, enableReranking);
      
      return results.map(result => ({
        content: result.content,
        metadata: result.metadata,
        similarity: result.combinedScore || result.similarity,
        searchMethod: 'hybrid',
        semanticScore: result.semanticScore || 0,
        keywordScore: result.keywordScore || 0,
        crossEncoderScore: result.crossEncoderScore || 0
      }));
    } catch (error) {
      console.error('❌ Hybrid search failed:', error.message);
      return await this.semanticSearch(query, limit);
    }
  }

  /**
   * Main search method - automatically chooses the best search strategy
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    const {
      method = 'hybrid',
      limit = 5,
      semanticWeight = 0.65,
      keywordWeight = 0.35,
      enableReranking = false
    } = options;

    console.log(`🔍 Searching for: "${query}" (method: ${method})`);

    switch (method) {
      case 'semantic':
        return await this.semanticSearch(query, limit);
      
      case 'keyword':
        return this.keywordSearch(query, limit);
      
      case 'hybrid':
        return await this.hybridSearch(query, limit, semanticWeight, keywordWeight, enableReranking);
      
      default:
        console.log('⚠️ Unknown search method, using hybrid search');
        return await this.hybridSearch(query, limit, semanticWeight, keywordWeight, enableReranking);
    }
  }

  /**
   * Get search statistics and capabilities
   * @returns {Object} Search service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      methods: ['semantic', 'keyword', 'hybrid'],
      features: {
        vectorSearch: true,
        keywordSearch: true,
        hybridSearch: this.isInitialized,
        reranking: true
      }
    };
  }
}

// Export singleton instance
export default new SearchService();
