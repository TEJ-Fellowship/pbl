import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory vector store for testing
let vectorStore = [];
const COLLECTION_NAME = "discord_support_docs";

// Load embeddings from file if they exist
function loadVectorStore() {
  try {
    const embeddingsPath = path.join(__dirname, "../../data/gemini_embeddings.json");
    if (fs.existsSync(embeddingsPath)) {
      const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
      vectorStore = embeddings.map(emb => ({
        id: emb.id,
        content: emb.content,
        embedding: emb.embedding,
        metadata: {
          source: emb.source,
          chunkIndex: emb.chunkIndex,
          fileName: emb.fileName,
          embeddingModel: "text-embedding-004",
          // Include classification fields
          category: emb.category || 'general',
          tags: emb.tags || ['general'],
          type: emb.type || 'unknown',
          url: emb.url || '',
          title: emb.title || ''
        }
      }));
      console.log(`📚 Loaded ${vectorStore.length} documents from embeddings file`);
    }
  } catch (error) {
    console.error("❌ Error loading vector store:", error.message);
  }
}

// Initialize vector store on import
loadVectorStore();

export async function setupChromaDatabase() {
  try {
    console.log("🗄️ Setting up vector database...");
    
    // Clear existing data
    vectorStore = [];
    
    console.log(`✅ Vector database initialized`);
    return true;
    
  } catch (error) {
    console.error("❌ Error setting up vector database:", error.message);
    throw error;
  }
}

export async function addDocumentsToChroma(embeddings) {
  try {
    console.log("📥 Adding documents to vector database...");
    
    // Add embeddings to in-memory store
    vectorStore = embeddings.map(emb => ({
      id: emb.id,
      content: emb.content,
      embedding: emb.embedding,
      metadata: {
        source: emb.source,
        chunkIndex: emb.chunkIndex,
        fileName: emb.fileName,
        embeddingModel: "text-embedding-004",
        // Include classification fields
        category: emb.category || 'general',
        tags: emb.tags || ['general'],
        type: emb.type || 'unknown',
        url: emb.url || '',
        title: emb.title || ''
      }
    }));
    
    console.log(`✅ Added ${embeddings.length} documents to vector database`);
    
  } catch (error) {
    console.error("❌ Error adding documents to vector database:", error.message);
    throw error;
  }
}

/**
 * Optimized semantic search with intent-based filtering
 * Filters documents by intent/category BEFORE computing similarities for better performance
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return
 * @param {Object} intentClassification - Intent classification result from queryIntentService
 * @returns {Promise<Object>} Search results with documents, distances, and metadatas
 */
export async function searchSimilarDocuments(query, limit = 5, intentClassification = null) {
  try {
    const { embedQueryWithGemini } = await import('./geminiEmbeddings.js');
    
    // Cosine similarity function
    function cosineSimilarity(a, b) {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      if (magnitudeA === 0 || magnitudeB === 0) return 0;
      return dotProduct / (magnitudeA * magnitudeB);
    }
    
    // STEP 1: Filter by intent BEFORE computing similarities (FAST - O(n) metadata comparison)
    let candidateDocs = vectorStore;
    const initialDocCount = vectorStore.length;
    
    if (intentClassification && intentClassification.confidence > 0.3) {
      const relevantCategories = intentClassification.relevantCategories || [];
      const primaryIntent = intentClassification.primaryIntent;
      
      // Filter documents by category/tags - metadata comparison is very fast
      candidateDocs = vectorStore.filter(doc => {
        const docCategory = doc.metadata?.category || 'general';
        const docTags = doc.metadata?.tags || [];
        
        // Include if category matches relevant categories
        if (relevantCategories.includes(docCategory)) {
          return true;
        }
        
        // Include if any tag matches
        if (docTags.some(tag => relevantCategories.includes(tag))) {
          return true;
        }
        
        // Keep 'general' category as fallback for moderate confidence
        if (docCategory === 'general' && intentClassification.confidence < 0.8) {
          return true;
        }
        
        return false;
      });
      
      const filterRatio = ((initialDocCount - candidateDocs.length) / initialDocCount * 100).toFixed(1);
      console.log(`🎯 DOCUMENT FILTERING BY INTENT:`);
      console.log(`   Primary Intent: ${primaryIntent} (confidence: ${intentClassification.confidence.toFixed(3)})`);
      console.log(`   Documents: ${initialDocCount} → ${candidateDocs.length} (filtered ${filterRatio}%)`);
      console.log(`   Performance gain: ${(100 - (candidateDocs.length / initialDocCount * 100)).toFixed(1)}% fewer similarity calculations`);
      
      // If filtering is too aggressive, expand candidate set
      if (candidateDocs.length < limit * 2) {
        // Load intent service to get category mappings
        const queryIntentService = (await import('../services/queryIntentService.js')).default;
        
        // Add more candidates from secondary intents
        const secondaryIntents = intentClassification.intents?.slice(1, 3) || [];
        const candidateIds = new Set(candidateDocs.map(d => d.id));
        
        for (const secondaryIntent of secondaryIntents) {
          const secondaryCategories = queryIntentService.intentToCategoryMap[secondaryIntent.label] || ['general'];
          
          const secondaryDocs = vectorStore.filter(doc => {
            if (candidateIds.has(doc.id)) return false;
            const docCategory = doc.metadata?.category || 'general';
            const docTags = doc.metadata?.tags || [];
            return secondaryCategories.includes(docCategory) || 
                   docTags.some(tag => secondaryCategories.includes(tag));
          });
          
          secondaryDocs.forEach(doc => {
            if (!candidateIds.has(doc.id)) {
              candidateDocs.push(doc);
              candidateIds.add(doc.id);
            }
          });
        }
        
        // Cap at reasonable size (30% of total or minimum needed)
        if (candidateDocs.length > initialDocCount * 0.3) {
          candidateDocs = candidateDocs.slice(0, Math.floor(initialDocCount * 0.3));
        }
        
        console.log(`📊 Expanded candidate set to ${candidateDocs.length} documents`);
      }
    }
    
    // STEP 2: Get query embedding (only if we have candidates)
    if (candidateDocs.length === 0) {
      console.warn('⚠️ No candidate documents after filtering, using all documents');
      candidateDocs = vectorStore;
    }
    
    const queryEmbedding = await embedQueryWithGemini(query);
    
    // STEP 3: Compute similarities ONLY on filtered subset (EFFICIENT - O(m) where m << n)
    let similarities = candidateDocs.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      intentBoost: 1.0 // Default no boost
    }));
    
    // STEP 4: Apply intent-based boosting on the filtered set
    if (intentClassification && intentClassification.confidence > 0.3) {
      const queryIntentService = (await import('../services/queryIntentService.js')).default;
      
      similarities = similarities.map(doc => {
        const boost = queryIntentService.getBoostMultiplier(
          intentClassification,
          doc.metadata
        );
        
        return {
          ...doc,
          similarity: doc.similarity * boost,
          intentBoost: boost
        };
      });
    }
    
    // STEP 5: Sort by boosted similarity and return top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    // Format results to match expected structure
    const documents = [topResults.map(result => result.content)];
    const distances = [topResults.map(result => 1 - result.similarity)];
    const metadatas = [topResults.map(result => result.metadata)];
    
    return {
      documents,
      distances,
      metadatas
    };
    
  } catch (error) {
    console.error("❌ Error searching vector database:", error.message);
    throw error;
  }
}

export { vectorStore, COLLECTION_NAME };
