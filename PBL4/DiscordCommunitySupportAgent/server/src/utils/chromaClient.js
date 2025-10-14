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
          embeddingModel: "text-embedding-004"
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
        embeddingModel: "text-embedding-004"
      }
    }));
    
    console.log(`✅ Added ${embeddings.length} documents to vector database`);
    
  } catch (error) {
    console.error("❌ Error adding documents to vector database:", error.message);
    throw error;
  }
}

export async function searchSimilarDocuments(query, limit = 5) {
  try {
    // Import Gemini embedding function
    const { embedQueryWithGemini } = await import('../utils/geminiEmbeddings.js');
    
    // Simple cosine similarity function
    function cosineSimilarity(a, b) {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    }
    
    // Get query embedding
    const queryEmbedding = await embedQueryWithGemini(query);
    
    // Calculate similarities with all documents
    const similarities = vectorStore.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    // Sort by similarity and get top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    // Format results to match expected structure
    const documents = [topResults.map(result => result.content)];
    const distances = [topResults.map(result => 1 - result.similarity)]; // Convert similarity to distance
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
