import { pipeline } from '@xenova/transformers';

let crossEncoder = null;

export async function initializeCrossEncoder() {
  try {
    console.log("🧠 Initializing cross-encoder for re-ranking...");
    crossEncoder = await pipeline('text-classification', 'cross-encoder/ms-marco-MiniLM-L-6-v2');
    console.log("✅ Cross-encoder initialized");
    return true;
  } catch (error) {
    console.error("❌ Cross-encoder initialization failed:", error.message);
    return false;
  }
}

export async function rerankResults(query, results, topK = 5) {
  if (!crossEncoder) {
    console.log("⚠️ Cross-encoder not initialized, returning original results");
    return results.slice(0, topK);
  }

  try {
    console.log(`🔄 Re-ranking ${results.length} results for query: "${query}"`);
    
    // Prepare query-document pairs for cross-encoder
    const pairs = results.map(result => [query, result.content]);
    
    // Get relevance scores from cross-encoder
    const scores = await crossEncoder(pairs);
    
    // Combine results with cross-encoder scores
    const rerankedResults = results.map((result, index) => ({
      ...result,
      crossEncoderScore: scores[index].score,
      originalRank: index + 1
    }));
    
    // Sort by cross-encoder score (descending)
    rerankedResults.sort((a, b) => b.crossEncoderScore - a.crossEncoderScore);
    
    console.log(`✅ Re-ranked results, top score: ${rerankedResults[0]?.crossEncoderScore?.toFixed(4)}`);
    
    return rerankedResults.slice(0, topK);
    
  } catch (error) {
    console.error("❌ Re-ranking failed:", error.message);
    return results.slice(0, topK);
  }
}

export { crossEncoder };
