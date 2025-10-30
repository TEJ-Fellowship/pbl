import { pipeline } from '@xenova/transformers';

let crossEncoder = null;
let isInitialized = false;

/**
 * Initialize a true cross-encoder using Transformers.js
 * Model: Xenova/cross-encoder-ms-marco-MiniLM-L-6-v2 (or equivalent)
 * Falls back to stub if model fails to load
 */
export async function initializeCrossEncoder() {
  if (isInitialized) {
    return crossEncoder !== null;
  }

  try {
    console.log("🔄 Initializing cross-encoder re-ranker (Transformers.js)...");

    // Try loading a cross-encoder text-classification pipeline
    // This model outputs a relevance score for (query, passage) pairs
    crossEncoder = await pipeline('text-classification', 'Xenova/cross-encoder-ms-marco-MiniLM-L-6-v2');

    isInitialized = true;
    console.log("✅ Cross-encoder initialized successfully");
    return true;
  } catch (error) {
    console.log("⚠️ Cross-encoder initialization failed:", error.message);
    console.log("🔄 Falling back to lightweight heuristic re-ranking...");
    crossEncoder = null;
    isInitialized = true;
    return false;
  }
}

/**
 * Re-rank results using cross-encoder.
 * If cross-encoder is unavailable, falls back to a lightweight heuristic.
 */
export async function rerankResults(query, results, topK = 5) {
  if (!isInitialized) {
    await initializeCrossEncoder();
  }

  try {
    console.log(`🔄 Re-ranking ${results.length} results for query: "${query}"`);

    let rerankedResults;

    if (crossEncoder) {
      // Prepare inputs for batch scoring (text/text_pair objects)
      const inputs = results.map(r => ({ text: query, text_pair: r.content }));

      // Run model in batches to avoid memory spikes
      const BATCH_SIZE = 16;
      const scores = [];
      for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
        const batch = inputs.slice(i, i + BATCH_SIZE);
        const outputs = await crossEncoder(batch, { topk: 1 });
        // Each output is an array with one label/score; take score as relevance
        batch.forEach((_, j) => {
          const out = outputs[j]?.[0] || outputs?.[0];
          const score = typeof out?.score === 'number' ? out.score : 0;
          scores.push(score);
        });
      }

      // Combine original score with cross-encoder score
      rerankedResults = results.map((result, idx) => ({
        ...result,
        crossEncoderScore: scores[idx],
        combinedScore: 0.5 * (result.combinedScore ?? result.similarity ?? 0) + 0.5 * scores[idx],
      }))
      .sort((a, b) => (b.crossEncoderScore ?? 0) - (a.crossEncoderScore ?? 0));

      console.log(`✅ Re-ranked with cross-encoder. Top CE score: ${rerankedResults[0]?.crossEncoderScore?.toFixed(4)}`);
    } else {
      // Lightweight fallback: small boost if query terms appear in content
      rerankedResults = results.map((result, index) => {
        const hasQueryTerms = query.toLowerCase().split(/\s+/).some(term =>
          term.length > 2 && result.content.toLowerCase().includes(term)
        );
        const boost = hasQueryTerms ? 0.1 : 0;
        const base = result.combinedScore ?? result.similarity ?? 0;
        return {
          ...result,
          crossEncoderScore: base + boost,
          combinedScore: base + boost,
        };
      }).sort((a, b) => (b.crossEncoderScore ?? 0) - (a.crossEncoderScore ?? 0));

      console.log(`✅ Re-ranked with heuristic fallback.`);
    }

    return rerankedResults.slice(0, topK);
  } catch (error) {
    console.error("❌ Re-ranking failed:", error.message);
    return results.slice(0, topK);
  }
}

export { crossEncoder };
