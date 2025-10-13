import FlexSearch from "flexsearch";
import { searchDocuments } from "./simpleSearch.js";
import { loadChunks } from "./simpleSearch.js";
import { rerankResults } from "./reranker.js";

// Initialize FlexSearch for BM25 keyword search
const flexSearch = new FlexSearch.Index({
  tokenize: "forward",
  resolution: 3,
  depth: 2
});

let chunks = [];
let isIndexed = false;

export async function initializeHybridSearch() {
  console.log("🔍 Initializing hybrid search system...");
  
  // Load chunks
  chunks = loadChunks();
  
  if (chunks.length === 0) {
    console.log("❌ No chunks found. Please run processDocsSimple.js first.");
    return false;
  }
  
  // Index chunks for BM25 search
  chunks.forEach((chunk, index) => {
    flexSearch.add(index, chunk.content);
  });
  
  isIndexed = true;
  console.log(`✅ Indexed ${chunks.length} chunks for BM25 search`);
  return true;
}

export async function hybridSearch(query, limit = 5, semanticWeight = 0.65, keywordWeight = 0.35, enableReranking = true) {
  if (!isIndexed) {
    console.log("❌ Search not initialized. Run initializeHybridSearch() first.");
    return [];
  }
  
  // BM25 keyword search
  const keywordResults = flexSearch.search(query, limit * 2);
  
  // Simple semantic search (our improved keyword search)
  const semanticResults = searchDocuments(query, chunks, limit * 2);
  
  // Combine and score results
  const combinedResults = new Map();
  
  // Add semantic results
  semanticResults.forEach((result, index) => {
    const semanticScore = (semanticResults.length - index) / semanticResults.length;
    const chunkIndex = chunks.findIndex(chunk => chunk.id === result.id);
    
    if (chunkIndex !== -1) {
      combinedResults.set(chunkIndex, {
        ...result,
        semanticScore: semanticScore,
        keywordScore: 0,
        combinedScore: semanticScore * semanticWeight
      });
    }
  });
  
  // Add keyword results
  keywordResults.forEach((chunkIndex, index) => {
    const keywordScore = (keywordResults.length - index) / keywordResults.length;
    const chunk = chunks[chunkIndex];
    
    if (combinedResults.has(chunkIndex)) {
      // Update existing result
      const existing = combinedResults.get(chunkIndex);
      existing.keywordScore = keywordScore;
      existing.combinedScore = (existing.semanticScore * semanticWeight) + (keywordScore * keywordWeight);
    } else {
      // Add new result
      combinedResults.set(chunkIndex, {
        ...chunk,
        semanticScore: 0,
        keywordScore: keywordScore,
        combinedScore: keywordScore * keywordWeight
      });
    }
  });
  
  // Sort by combined score
  let finalResults = Array.from(combinedResults.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit * 2); // Get more results for re-ranking
  
  // Apply cross-encoder re-ranking if enabled
  if (enableReranking && finalResults.length > 1) {
    try {
      finalResults = await rerankResults(query, finalResults, limit);
    } catch (error) {
      console.log("⚠️ Re-ranking failed, using original results:", error.message);
    }
  }
  
  return finalResults.slice(0, limit);
}

export { chunks, flexSearch };
