import { bm25Search } from "./bm25Search.js";
import { faissVectorStore } from "./faissVectorStore.js";
import { rerankResults } from "./reranker.js";

/**
 * Enhanced Hybrid Search System
 * 
 * This implementation fuses BM25 keyword search with FAISS semantic search:
 * - BM25: Probabilistic keyword matching with term frequency
 * - FAISS: Fast semantic similarity using SentenceTransformer embeddings
 * - Normalization: Proper score normalization for both methods
 * - Weighting: Configurable alpha parameter for result fusion
 * - Ranking: Comprehensive ranking system for combined results
 */

let isInitialized = false;
let documents = [];

/**
 * Initialize the enhanced hybrid search system
 * @returns {Promise<boolean>} Success status
 */
export async function initializeHybridSearch() {
  console.log("🔍 Initializing Enhanced Hybrid Search System...");
  
  try {
    // Initialize BM25 search
    console.log("📊 Initializing BM25 search...");
    documents = bm25Search.loadDocuments();
    
    if (documents.length === 0) {
      console.log("❌ No documents found for BM25 indexing.");
      return false;
    }
    
    bm25Search.buildIndex(documents);
    console.log(`✅ BM25 initialized with ${documents.length} documents`);
    
    // Initialize FAISS vector store
    console.log("🧠 Initializing FAISS vector store...");
    const faissReady = await faissVectorStore.initialize();
    
    if (!faissReady) {
      console.log("⚠️ FAISS initialization failed, falling back to BM25 only");
    }
    
    isInitialized = true;
    console.log(`✅ Enhanced hybrid search initialized`);
    console.log(`📊 Features: BM25 + FAISS + SentenceTransformer`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Failed to initialize enhanced hybrid search:", error.message);
    return false;
  }
}

/**
 * Normalize scores to 0-1 range using min-max normalization
 * @param {Array} scores - Array of scores to normalize
 * @returns {Array} Normalized scores
 */
function normalizeScores(scores) {
  if (scores.length === 0) return scores;
  
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  
  if (max === min) {
    // All scores are the same, return uniform distribution
    return scores.map(() => 0.5);
  }
  
  return scores.map(score => (score - min) / (max - min));
}

/**
 * Apply softmax normalization to scores
 * @param {Array} scores - Array of scores
 * @param {number} temperature - Temperature parameter (default: 1.0)
 * @returns {Array} Softmax normalized scores
 */
function softmaxNormalize(scores, temperature = 1.0) {
  if (scores.length === 0) return scores;
  
  // Apply temperature scaling
  const scaledScores = scores.map(score => score / temperature);
  
  // Find maximum for numerical stability
  const maxScore = Math.max(...scaledScores);
  
  // Compute softmax
  const expScores = scaledScores.map(score => Math.exp(score - maxScore));
  const sumExp = expScores.reduce((sum, exp) => sum + exp, 0);
  
  return expScores.map(exp => exp / sumExp);
}

/**
 * Enhanced hybrid search that fuses BM25 and FAISS results
 * 
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results to return
 * @param {number} alpha - Weight for semantic search (0-1, default: 0.7)
 * @param {number} beta - Weight for BM25 search (0-1, default: 0.3)
 * @param {boolean} enableReranking - Whether to apply cross-encoder reranking
 * @param {string} normalizationMethod - 'minmax', 'softmax', or 'none'
 * @returns {Promise<Array>} Array of ranked search results
 */
export async function hybridSearch(
  query, 
  limit = 5, 
  alpha = 0.7, 
  beta = 0.3, 
  enableReranking = false,
  normalizationMethod = 'minmax'
) {
  if (!isInitialized) {
    console.log("❌ Enhanced hybrid search not initialized. Run initializeHybridSearch() first.");
    return [];
  }
  
  console.log(`🔀 Enhanced Hybrid Search: "${query}"`);
  console.log(`⚖️ Weights - Semantic (α): ${alpha}, BM25 (β): ${beta}`);
  console.log(`📊 Normalization: ${normalizationMethod}`);
  
  const results = new Map();
  
  try {
    // 1. BM25 Keyword Search
    console.log("🔍 Running BM25 keyword search...");
    const bm25Results = bm25Search.search(query, limit * 2);
    
    if (bm25Results.length > 0) {
      // Normalize BM25 scores
      const bm25Scores = bm25Results.map(r => r.bm25Score);
      let normalizedBm25Scores;
      
      switch (normalizationMethod) {
        case 'softmax':
          normalizedBm25Scores = softmaxNormalize(bm25Scores, 2.0);
          break;
        case 'minmax':
          normalizedBm25Scores = normalizeScores(bm25Scores);
          break;
        default:
          normalizedBm25Scores = bm25Scores;
      }
      
      // Add BM25 results to combined results
      bm25Results.forEach((result, index) => {
        const normalizedScore = normalizedBm25Scores[index];
        results.set(result.docIndex, {
          ...result,
          semanticScore: 0,
          keywordScore: normalizedScore,
          bm25Score: result.bm25Score,
          combinedScore: normalizedScore * beta,
          searchMethod: 'bm25',
          docIndex: result.docIndex
        });
      });
      
      console.log(`✅ BM25 found ${bm25Results.length} results (max score: ${Math.max(...bm25Scores).toFixed(4)})`);
    } else {
      console.log("⚠️ No BM25 results found");
    }
    
  } catch (error) {
    console.log("⚠️ BM25 search failed:", error.message);
  }
  
  try {
    // 2. FAISS Semantic Search
    console.log("🧠 Running FAISS semantic search...");
    const faissResults = await faissVectorStore.search(query, limit * 2);
    
    if (faissResults.length > 0) {
      // Normalize FAISS scores
      const faissScores = faissResults.map(r => r.similarity);
      let normalizedFaissScores;
      
      switch (normalizationMethod) {
        case 'softmax':
          normalizedFaissScores = softmaxNormalize(faissScores, 2.0);
          break;
        case 'minmax':
          normalizedFaissScores = normalizeScores(faissScores);
          break;
        default:
          normalizedFaissScores = faissScores;
      }
      
      // Add FAISS results to combined results
      faissResults.forEach((result, index) => {
        const normalizedScore = normalizedFaissScores[index];
        
        if (results.has(result.docIndex)) {
          // Update existing result (found by both methods)
          const existing = results.get(result.docIndex);
          existing.semanticScore = normalizedScore;
          existing.combinedScore = (normalizedScore * alpha) + (existing.keywordScore * beta);
          existing.searchMethod = 'hybrid';
          existing.faissScore = result.similarity;
        } else {
          // Add new semantic result
          results.set(result.docIndex, {
            ...result,
            semanticScore: normalizedScore,
            keywordScore: 0,
            bm25Score: 0,
            combinedScore: normalizedScore * alpha,
            searchMethod: 'faiss',
            faissScore: result.similarity
          });
        }
      });
      
      console.log(`✅ FAISS found ${faissResults.length} results (max score: ${Math.max(...faissScores).toFixed(4)})`);
    } else {
      console.log("⚠️ No FAISS results found");
    }
    
  } catch (error) {
    console.log("⚠️ FAISS search failed:", error.message);
  }
  
  // 3. Combine and rank results
  let finalResults = Array.from(results.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit * 2); // Get more results for potential re-ranking
  
  // 4. Apply cross-encoder re-ranking if enabled
  if (enableReranking && finalResults.length > 1) {
    try {
      console.log("🔄 Applying cross-encoder re-ranking...");
      finalResults = await rerankResults(query, finalResults, limit);
      console.log("✅ Re-ranking completed");
    } catch (error) {
      console.log("⚠️ Re-ranking failed, using original results:", error.message);
    }
  }
  
  // 5. Return top results with detailed scoring information
  const topResults = finalResults.slice(0, limit);
  
  console.log(`🎯 Returning ${topResults.length} enhanced hybrid search results`);
  if (topResults.length > 0) {
    console.log(`📊 Score range: ${topResults[0].combinedScore.toFixed(4)} - ${topResults[topResults.length-1].combinedScore.toFixed(4)}`);
    console.log(`🔀 Search methods: ${[...new Set(topResults.map(r => r.searchMethod))].join(', ')}`);
  }
  
  return topResults;
}

/**
 * Example query demonstration
 * This function demonstrates how to use the enhanced hybrid search
 */
export async function demonstrateHybridSearch() {
  console.log('\n🎯 Enhanced Hybrid Search Demonstration\n');
  
  const exampleQueries = [
    "How to create a Discord account?",
    "Discord server permissions setup",
    "What are Discord webhooks?",
    "How to create Discord bot?",
    "Discord channel management"
  ];
  
  for (const query of exampleQueries) {
    console.log(`\n📝 Example Query: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      // Test different configurations
      const configurations = [
        { alpha: 0.7, beta: 0.3, name: 'Semantic-focused' },
        { alpha: 0.3, beta: 0.7, name: 'Keyword-focused' },
        { alpha: 0.5, beta: 0.5, name: 'Balanced' }
      ];
      
      for (const config of configurations) {
        console.log(`\n🔧 Configuration: ${config.name} (α=${config.alpha}, β=${config.beta})`);
        
        const results = await hybridSearch(query, 3, config.alpha, config.beta, false, 'minmax');
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            console.log(`   ${index + 1}. Combined: ${result.combinedScore.toFixed(4)} | Semantic: ${result.semanticScore.toFixed(4)} | BM25: ${result.keywordScore.toFixed(4)}`);
            console.log(`      Method: ${result.searchMethod} | Source: ${result.source}`);
            console.log(`      Content: ${result.content.substring(0, 80)}...`);
          });
        } else {
          console.log('   ⚠️ No results found');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✨ Demonstration completed!\n');
}

export { documents, bm25Search, faissVectorStore };
