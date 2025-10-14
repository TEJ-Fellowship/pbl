import faiss from 'faiss-node';
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Extract FAISS classes from the default export
const { IndexFlatIP } = faiss;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FAISS-based Vector Store with SentenceTransformer Embeddings
 * 
 * This implementation provides:
 * - FAISS index for fast similarity search
 * - SentenceTransformer embeddings for semantic understanding
 * - Proper normalization and indexing
 * - Support for hybrid search integration
 */
class FAISSVectorStore {
  constructor() {
    this.index = null;
    this.documents = [];
    this.embeddings = [];
    this.embedder = null;
    this.isInitialized = false;
    this.dimension = 384; // all-MiniLM-L6-v2 embedding dimension
  }

  /**
   * Initialize the FAISS index and SentenceTransformer embedder
   */
  async initialize() {
    try {
      console.log('🔧 Initializing FAISS vector store with SentenceTransformer...');
      
      // Load documents first to check if we have data
      await this.loadDocuments();
      
      if (this.documents.length === 0) {
        console.log('❌ No documents found for FAISS indexing');
        return false;
      }
      
      console.log(`📊 Found ${this.documents.length} documents to process`);
      
      // Initialize SentenceTransformer embedder
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          quantized: true,
          progress_callback: (progress) => {
            if (progress.status === 'downloading') {
              console.log(`📥 Downloading SentenceTransformer: ${progress.file} (${Math.round(progress.loaded / progress.total * 100)}%)`);
            }
          }
        }
      );
      
      console.log('✅ SentenceTransformer embedder initialized');
      
      // Create embeddings for all documents
      console.log(`🔄 Creating embeddings for ${this.documents.length} documents...`);
      await this.createEmbeddings();
      
      if (this.embeddings.length === 0) {
        console.log('❌ No embeddings created');
        return false;
      }
      
      // Initialize FAISS index
      this.index = new IndexFlatIP(this.dimension);
      
      // Convert embeddings to flat array format for FAISS
      // FAISS expects a flat array of all embedding values
      const flatEmbeddings = [];
      for (let i = 0; i < this.embeddings.length; i++) {
        const embedding = Array.from(this.embeddings[i]);
        flatEmbeddings.push(...embedding);
      }
      
      // Add embeddings to FAISS index
      this.index.add(flatEmbeddings);
      
      this.isInitialized = true;
      console.log(`✅ FAISS index initialized with ${this.documents.length} documents`);
      console.log(`📊 Index dimension: ${this.dimension}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize FAISS vector store:', error.message);
      console.error('❌ Error details:', error.stack);
      return false;
    }
  }

  /**
   * Load documents from available data sources
   */
  async loadDocuments() {
    try {
      const possiblePaths = [
        path.join(__dirname, "../../data/processed/discord_chunks.json"),
        path.join(__dirname, "../../data/gemini_embeddings.json"),
        path.join(__dirname, "../../data/embeddings.json"),
        path.join(__dirname, "../../data/chunks/metadata.json")
      ];
      
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`📂 Loading documents from: ${filePath}`);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          if (Array.isArray(data) && data.length > 0) {
            this.documents = data.map((item, index) => ({
              id: item.id || `doc_${index}`,
              content: item.content || item.pageContent || '',
              metadata: {
                source: item.metadata?.source || item.source || 'Discord Documentation',
                fileName: item.metadata?.fileName || item.fileName || 'unknown',
                chunkIndex: item.metadata?.chunkIndex || item.chunkIndex || index,
                url: item.metadata?.url || item.url || '',
                type: item.metadata?.type || item.type || 'unknown',
                ...item.metadata
              }
            }));
            
            // Filter out documents with empty content
            this.documents = this.documents.filter(doc => doc.content && doc.content.trim().length > 0);
            
            if (this.documents.length > 0) {
              console.log(`✅ Loaded ${this.documents.length} documents`);
              return;
            } else {
              console.log(`⚠️ No valid documents found in ${filePath}`);
            }
          } else {
            console.log(`⚠️ Empty or invalid data in ${filePath}`);
          }
        }
      }
      
      console.log('❌ No valid document files found');
      this.documents = [];
      
    } catch (error) {
      console.error('❌ Error loading documents:', error.message);
      this.documents = [];
    }
  }

  /**
   * Create embeddings for all documents using SentenceTransformer
   */
  async createEmbeddings() {
    try {
      this.embeddings = [];
      
      for (let i = 0; i < this.documents.length; i++) {
        const doc = this.documents[i];
        const content = doc.content;
        
        // Create embedding using SentenceTransformer
        const embedding = await this.embedder(content, { pooling: 'mean', normalize: true });
        
        // Convert to Float32Array for FAISS
        const embeddingArray = new Float32Array(embedding.data);
        this.embeddings.push(embeddingArray);
        
        if ((i + 1) % 10 === 0) {
          console.log(`📊 Created embeddings for ${i + 1}/${this.documents.length} documents`);
        }
      }
      
      console.log(`✅ Created ${this.embeddings.length} embeddings`);
      
    } catch (error) {
      console.error('❌ Error creating embeddings:', error.message);
      throw error;
    }
  }

  /**
   * Create embedding for a query using SentenceTransformer
   */
  async embedQuery(query) {
    try {
      if (!this.embedder) {
        throw new Error('Embedder not initialized');
      }
      
      const embedding = await this.embedder(query, { pooling: 'mean', normalize: true });
      return new Float32Array(embedding.data);
      
    } catch (error) {
      console.error('❌ Error creating query embedding:', error.message);
      throw error;
    }
  }

  /**
   * Search for similar documents using FAISS
   * @param {string} query - Search query
   * @param {number} k - Number of results to return
   * @returns {Array} Array of search results with scores
   */
  async search(query, k = 5) {
    try {
      if (!this.isInitialized || !this.index) {
        throw new Error('FAISS index not initialized');
      }
      
      if (!this.embedder) {
        throw new Error('Embedder not initialized');
      }
      
      // Create query embedding
      const queryEmbedding = await this.embedQuery(query);
      
      // Convert query embedding to proper format for FAISS
      const queryArray = Array.from(queryEmbedding);
      
      // Search FAISS index
      const { distances, indices } = this.index.search(queryArray, k);
      
      // Format results
      const results = [];
      if (indices && distances && indices.length > 0) {
        for (let i = 0; i < indices.length; i++) {
          const docIndex = indices[i];
          const similarity = distances[i]; // FAISS returns similarity scores for IP index
          
          if (docIndex < this.documents.length) {
            results.push({
              ...this.documents[docIndex],
              similarity: similarity,
              semanticScore: similarity,
              docIndex: docIndex,
              searchMethod: 'faiss'
            });
          }
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Error searching FAISS index:', error.message);
      throw error;
    }
  }

  /**
   * Get document by index
   */
  getDocument(index) {
    if (index >= 0 && index < this.documents.length) {
      return this.documents[index];
    }
    return null;
  }

  /**
   * Get total number of documents
   */
  getDocumentCount() {
    return this.documents.length;
  }

  /**
   * Check if the vector store is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

// Create singleton instance
const faissVectorStore = new FAISSVectorStore();

export { faissVectorStore, FAISSVectorStore };
