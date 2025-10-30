import { searchSimilarDocuments } from '../repositories/vectorRepository.js';
import { searchDocuments } from '../search/keywordSearch.js';
import { hybridSearch, initializeHybridSearch } from '../search/hybridSearch.js';
import { rerankResults } from '../search/reranker.js';
import queryIntentService from './queryIntentService.js';

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
      
      // Initialize query intent service
      await queryIntentService.initialize();
      
      this.isInitialized = true;
      console.log('✅ Search Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Search Service initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Perform semantic search using vector similarity with intent classification
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @param {Object} serverContext - Server context for intent classification
   * @returns {Promise<Array>} Search results
   */
  async semanticSearch(query, limit = 5, serverContext = {}) {
    try {
      // Classify query intent
      const intentClassification = await queryIntentService.detectIntents(query, serverContext);
      
      // Perform semantic search with intent filtering
      const results = await searchSimilarDocuments(query, limit * 2, intentClassification);
      
      const semanticResults = results.documents[0].map((doc, index) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        similarity: 1 - results.distances[0][index],
        searchMethod: 'semantic',
        semanticScore: 1 - results.distances[0][index],
        keywordScore: 0,
        crossEncoderScore: 0,
        intentClassification: intentClassification
      })).slice(0, limit);
      
      console.log(`\n✅ SEMANTIC SEARCH COMPLETE: ${semanticResults.length} results returned\n`);
      return semanticResults;
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
   * @param {Object} intentClassification - Intent classification for filtering
   * @returns {Promise<Array>} Search results
   */
  async hybridSearch(query, limit = 5, semanticWeight = 0.65, keywordWeight = 0.35, enableReranking = false, intentClassification = null) {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ Search service not initialized, falling back to semantic search');
        return await this.semanticSearch(query, limit);
      }

      const results = await hybridSearch(query, limit, semanticWeight, keywordWeight, enableReranking, intentClassification);
      
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
   * @param {Object} serverContext - Server context for intent classification
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}, serverContext = {}) {
    const {
      method = 'hybrid',
      limit = 5,
      semanticWeight = 0.65,
      keywordWeight = 0.35,
      enableReranking = false
    } = options;

    console.log(`\n🔍 SEARCH REQUEST:`);
    console.log(`   Query: "${query}"`);
    console.log(`   Method: ${method}`);
    if (serverContext.type) {
      console.log(`   Server Context: ${serverContext.type} server`);
    }
    
    // Classify query intent (used for all methods)
    const intentClassification = await queryIntentService.detectIntents(query, serverContext);

    switch (method) {
      case 'semantic':
        return await this.semanticSearch(query, limit, serverContext);
      
      case 'keyword':
        return this.keywordSearch(query, limit);
      
      case 'hybrid':
        // For hybrid, pass intent classification to enable filtering in semantic search
        let results = await this.hybridSearch(query, limit * 2, semanticWeight, keywordWeight, enableReranking, intentClassification);
        
        // Apply intent-based filtering and boosting
        if (intentClassification.confidence > 0.3) {
          results = this.applyIntentFiltering(results, intentClassification, limit);
        }
        
        console.log(`\n✅ SEARCH COMPLETE: ${results.length} results returned\n`);
        return results.slice(0, limit);
      
      default:
        console.log('⚠️ Unknown search method, using hybrid search');
        let defaultResults = await this.hybridSearch(query, limit * 2, semanticWeight, keywordWeight, enableReranking, intentClassification);
        
        if (intentClassification.confidence > 0.3) {
          defaultResults = this.applyIntentFiltering(defaultResults, intentClassification, limit);
        }
        
        console.log(`\n✅ SEARCH COMPLETE: ${defaultResults.length} results returned\n`);
        return defaultResults.slice(0, limit);
    }
  }

  /**
   * Apply intent-based filtering and boosting to results
   * @param {Array} results - Search results
   * @param {Object} intentClassification - Intent classification result
   * @param {number} limit - Max number of results
   * @returns {Array} Filtered and boosted results
   */
  applyIntentFiltering(results, intentClassification, limit) {
    const { relevantCategories, confidence } = intentClassification;
    
    console.log(`\n🎯 APPLYING INTENT-BASED FILTERING & BOOSTING:`);
    console.log(`   Input results: ${results.length}`);
    
    // Apply boosting based on intent match
    const processedResults = results.map(result => {
      const boost = queryIntentService.getBoostMultiplier(
        intentClassification, 
        result.metadata
      );
      
      const originalScore = result.combinedScore || result.similarity;
      const boostedScore = originalScore * boost;
      
      return {
        ...result,
        intentBoost: boost,
        similarity: boostedScore,
        // Update combined scores if they exist
        combinedScore: boostedScore,
        originalScore: originalScore
      };
    });
    
    // Display boost information for top results
    const sortedByOriginal = [...processedResults].sort((a, b) => 
      (b.originalScore || b.similarity) - (a.originalScore || a.similarity)
    );
    
    console.log(`\n📈 Top 5 Results - Boost Analysis:`);
    sortedByOriginal.slice(0, 5).forEach((result, index) => {
      const docCategory = result.metadata?.category || 'general';
      const docTags = result.metadata?.tags?.join(', ') || 'none';
      const boostIndicator = result.intentBoost > 1.2 ? '🚀' : result.intentBoost > 1.0 ? '⬆️' : result.intentBoost < 0.8 ? '⬇️' : '➡️';
      console.log(`   ${index + 1}. ${boostIndicator} Category: ${docCategory.padEnd(15)} | Tags: ${docTags.padEnd(30)} | Boost: ${result.intentBoost.toFixed(2)}x | Score: ${result.originalScore.toFixed(3)} → ${(result.combinedScore || result.similarity).toFixed(3)}`);
    });
    
    // Filter out very irrelevant results (boost < 0.5)
    const relevantResults = processedResults.filter(r => r.intentBoost >= 0.5);
    console.log(`\n   After filtering (boost >= 0.5): ${relevantResults.length} results`);
    
    // Sort by boosted similarity
    const sortedResults = relevantResults.sort((a, b) => 
      (b.combinedScore || b.similarity) - (a.combinedScore || a.similarity)
    );
    
    // If we filtered too many, keep top results even if boost is lower
    if (sortedResults.length < limit) {
      console.log(`   ⚠️  Filtered too many (${sortedResults.length} < ${limit}), keeping top results with lower boost`);
      const allSorted = processedResults.sort((a, b) => 
        (b.combinedScore || b.similarity) - (a.combinedScore || a.similarity)
      );
      return allSorted.slice(0, limit);
    }
    
    console.log(`   ✅ Final results: ${sortedResults.slice(0, limit).length} (after intent filtering)\n`);
    
    return sortedResults.slice(0, limit);
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
