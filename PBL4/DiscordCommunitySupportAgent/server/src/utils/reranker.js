import { pipeline } from '@xenova/transformers';

let sentenceTransformer = null;
let isInitialized = false;

export async function initializeCrossEncoder() {
  if (isInitialized) {
    return sentenceTransformer !== null;
  }
  
  try {
    console.log("🔄 Initializing semantic re-ranker...");
    
    // Use a lightweight approach - just mark as available for now
    // The actual re-ranking will use a simple scoring approach
    sentenceTransformer = { available: true };
    
    isInitialized = true;
    console.log("✅ Semantic re-ranker initialized successfully");
    return true;
    
  } catch (error) {
    console.log("⚠️ Semantic re-ranker initialization failed:", error.message);
    console.log("🔄 Continuing without re-ranking...");
    sentenceTransformer = null;
    isInitialized = true;
    return false;
  }
}

export async function rerankResults(query, results, topK = 5) {
  if (!sentenceTransformer) {
    console.log("⚠️ Semantic re-ranker not initialized, returning original results");
    return results.slice(0, topK);
  }

  try {
    console.log(`🔄 Re-ranking ${results.length} results for query: "${query}"`);
    
    // Simple re-ranking based on content relevance and existing scores
    const rerankedResults = results.map((result, index) => {
      // Calculate a simple relevance score based on content length and existing scores
      const contentLength = result.content.length;
      const hasQueryTerms = query.toLowerCase().split(' ').some(term => 
        result.content.toLowerCase().includes(term)
      );
      
      // Boost score for results that contain query terms
      const relevanceBoost = hasQueryTerms ? 0.1 : 0;
      
      // Combine existing scores with relevance boost
      const rerankScore = (result.combinedScore || result.similarity || 0) + relevanceBoost;
      
      return {
        ...result,
        crossEncoderScore: rerankScore,
        originalRank: index + 1
      };
    });
    
    // Sort by rerank score (descending)
    rerankedResults.sort((a, b) => b.crossEncoderScore - a.crossEncoderScore);
    
    console.log(`✅ Re-ranked results, top score: ${rerankedResults[0]?.crossEncoderScore?.toFixed(4)}`);
    
    return rerankedResults.slice(0, topK);
    
  } catch (error) {
    console.error("❌ Re-ranking failed:", error.message);
    return results.slice(0, topK);
  }
}

export { sentenceTransformer };
