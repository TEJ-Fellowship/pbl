import { pipeline } from '@xenova/transformers';

let crossEncoder = null;
let isInitialized = false;

export async function initializeCrossEncoder() {
  if (isInitialized) {
    return crossEncoder !== null;
  }
  
  try {
    console.log("🔄 Initializing cross-encoder for re-ranking...");
    
    // Try to initialize cross-encoder with better error handling
    crossEncoder = await pipeline(
      'text-classification', 
      'Xenova/cross-encoder-ms-marco-MiniLM-L-6-v2',
      {
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`📥 Downloading model: ${progress.file} (${Math.round(progress.loaded / progress.total * 100)}%)`);
          }
        }
      }
    );
    
    isInitialized = true;
    console.log("✅ Cross-encoder initialized successfully");
    return true;
    
  } catch (error) {
    console.log("⚠️ Cross-encoder initialization failed:", error.message);
    console.log("🔄 Continuing without re-ranking (this is normal for first run)...");
    crossEncoder = null;
    isInitialized = true;
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
