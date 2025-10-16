import { bm25Search } from "./bm25Search.js";
import { searchSimilarDocuments } from "../repositories/vectorRepository.js";
import { rerankResults } from "./reranker.js";

let isInitialized = false;
let documents = [];

export async function initializeHybridSearch() {
  console.log("🔍 Initializing hybrid search system...");
  
  try {
    // Load documents for BM25 indexing
    documents = bm25Search.loadDocuments();
    
    if (documents.length === 0) {
      console.log("❌ No documents found for indexing.");
      return false;
    }
    
    // Build BM25 index
    bm25Search.buildIndex(documents);
    
    // Verify semantic search is available
    const { vectorStore } = await import('../repositories/vectorRepository.js');
    if (vectorStore.length === 0) {
      console.log("⚠️ No semantic embeddings found. Hybrid search will use BM25 only.");
    }
    
    isInitialized = true;
    console.log(`✅ Hybrid search initialized with ${documents.length} documents`);
    return true;
    
  } catch (error) {
    console.error("❌ Failed to initialize hybrid search:", error.message);
    return false;
  }
}

export async function hybridSearch(query, limit = 5, semanticWeight = 0.65, keywordWeight = 0.35, enableReranking = true) {
  if (!isInitialized) {
    console.log("❌ Search not initialized. Run initializeHybridSearch() first.");
    return [];
  }
  
  console.log(`🔀 Starting hybrid search for: "${query}"`);
  console.log(`⚖️ Weights - Semantic: ${semanticWeight}, BM25: ${keywordWeight}`);
  
  const results = new Map();
  
  try {
    // 1. BM25 Keyword Search
    console.log("🔍 Running BM25 keyword search...");
    const bm25Results = bm25Search.search(query, limit * 2);
    
    // Normalize BM25 scores to 0-1 range
    const maxBm25Score = Math.max(...bm25Results.map(r => r.bm25Score), 1);
    bm25Results.forEach(result => {
      const normalizedScore = result.bm25Score / maxBm25Score;
      results.set(result.docIndex, {
        ...result,
        semanticScore: 0,
        keywordScore: normalizedScore,
        combinedScore: normalizedScore * keywordWeight,
        searchMethod: 'bm25'
      });
    });
    
    console.log(`✅ BM25 found ${bm25Results.length} results`);
    
  } catch (error) {
    console.log("⚠️ BM25 search failed:", error.message);
  }
  
  try {
    // 2. Semantic Search (if embeddings available)
    console.log("🧠 Running semantic search...");
    const semanticResults = await searchSimilarDocuments(query, limit * 2);
    
    if (semanticResults.documents && semanticResults.documents[0]) {
      const semanticDocs = semanticResults.documents[0];
      const semanticMetadatas = semanticResults.metadatas[0];
      const semanticDistances = semanticResults.distances[0];
      
      semanticDocs.forEach((content, index) => {
        const similarity = 1 - semanticDistances[index]; // Convert distance to similarity
        const metadata = semanticMetadatas[index];
        
        // Try to find matching document by content similarity
        let docIndex = -1;
        for (let i = 0; i < documents.length; i++) {
          if (documents[i].content === content || 
              documents[i].content.includes(content.substring(0, 100))) {
            docIndex = i;
            break;
          }
        }
        
        // If no exact match, use a hash-based approach
        if (docIndex === -1) {
          docIndex = Math.abs(content.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0)) % documents.length;
        }
        
        if (results.has(docIndex)) {
          // Update existing result
          const existing = results.get(docIndex);
          existing.semanticScore = similarity;
          existing.combinedScore = (similarity * semanticWeight) + (existing.keywordScore * keywordWeight);
          existing.searchMethod = 'hybrid';
        } else {
          // Add new semantic result
          results.set(docIndex, {
            content: content,
            source: metadata?.source || 'Discord Documentation',
            metadata: metadata,
            semanticScore: similarity,
            keywordScore: 0,
            combinedScore: similarity * semanticWeight,
            docIndex: docIndex,
            searchMethod: 'semantic'
          });
        }
      });
      
      console.log(`✅ Semantic search found ${semanticDocs.length} results`);
    }
    
  } catch (error) {
    console.log("⚠️ Semantic search failed:", error.message);
  }
  
  // 3. Combine and normalize results
  let finalResults = Array.from(results.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit * 2); // Get more results for potential re-ranking
  
  // 4. Apply cross-encoder re-ranking if enabled and available
  if (enableReranking && finalResults.length > 1) {
    try {
      console.log("🔄 Applying cross-encoder re-ranking...");
      finalResults = await rerankResults(query, finalResults, limit);
      console.log("✅ Re-ranking completed");
    } catch (error) {
      console.log("⚠️ Re-ranking failed, using original results:", error.message);
    }
  }
  
  // 5. Return top results
  const topResults = finalResults.slice(0, limit);
  
  console.log(`🎯 Returning ${topResults.length} hybrid search results`);
  console.log(`📊 Score range: ${topResults[0]?.combinedScore?.toFixed(4)} - ${topResults[topResults.length-1]?.combinedScore?.toFixed(4)}`);
  
  return topResults;
}

export { documents, bm25Search };
