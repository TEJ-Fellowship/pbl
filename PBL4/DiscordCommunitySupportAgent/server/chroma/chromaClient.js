import { ChromaClient } from "chromadb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Chroma client with proper configuration
const client = new ChromaClient({
  path: path.join(__dirname, "../data/chroma_db")
});

const COLLECTION_NAME = "discord_support_docs";

export async function setupChromaDatabase() {
  try {
    console.log("🗄️ Setting up Chroma database...");
    
    // Check if collection exists
    const collections = await client.listCollections();
    const existingCollection = collections.find(col => col.name === COLLECTION_NAME);
    
    if (existingCollection) {
      console.log("📚 Collection already exists, deleting old one...");
      await client.deleteCollection({ name: COLLECTION_NAME });
    }
    
    // Create new collection
    const collection = await client.createCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: "Discord Community Support Documentation",
        created_at: new Date().toISOString(),
        version: "1.0"
      }
    });
    
    console.log(`✅ Created collection: ${COLLECTION_NAME}`);
    return collection;
    
  } catch (error) {
    console.error("❌ Error setting up Chroma database:", error.message);
    throw error;
  }
}

export async function addDocumentsToChroma(embeddings) {
  try {
    console.log("📥 Adding documents to Chroma database...");
    
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    
    // Prepare data for Chroma
    const ids = embeddings.map(emb => emb.id);
    const documents = embeddings.map(emb => emb.content);
    const embeddings_data = embeddings.map(emb => emb.embedding);
    const metadatas = embeddings.map(emb => ({
      source: emb.source,
      chunkIndex: emb.chunkIndex,
      fileName: emb.fileName,
      embeddingModel: "gemini-embedding-001"
    }));
    
    // Add to collection
    await collection.add({
      ids: ids,
      documents: documents,
      embeddings: embeddings_data,
      metadatas: metadatas
    });
    
    console.log(`✅ Added ${embeddings.length} documents to Chroma with Gemini embeddings`);
    
  } catch (error) {
    console.error("❌ Error adding documents to Chroma:", error.message);
    throw error;
  }
}

export async function searchSimilarDocuments(query, limit = 5) {
  try {
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit
    });
    
    return results;
    
  } catch (error) {
    console.error("❌ Error searching Chroma database:", error.message);
    throw error;
  }
}

export { client, COLLECTION_NAME };
