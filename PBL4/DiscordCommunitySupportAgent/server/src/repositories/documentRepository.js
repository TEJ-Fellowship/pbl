import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Document Repository - Handles document storage and retrieval
 */
class DocumentRepository {
  constructor() {
    this.documents = [];
    this.isLoaded = false;
  }

  /**
   * Load documents from storage
   * @param {string} source - Source file path
   * @returns {Array} Loaded documents
   */
  loadDocuments(source = 'processed') {
    try {
      let documents = [];
      
      if (source === 'processed') {
        // Load from processed chunks
        const processedPath = path.join(__dirname, '../../data/processed/discord_chunks.json');
        if (fs.existsSync(processedPath)) {
          documents = JSON.parse(fs.readFileSync(processedPath, 'utf-8'));
          console.log(`✅ Loaded ${documents.length} documents from processed data`);
        }
      } else if (source === 'embeddings') {
        // Load from embeddings file
        const embeddingsPath = path.join(__dirname, '../../data/gemini_embeddings.json');
        if (fs.existsSync(embeddingsPath)) {
          const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
          documents = embeddings.map(emb => ({
            id: emb.id,
            content: emb.content,
            metadata: {
              source: emb.source,
              chunkIndex: emb.chunkIndex,
              fileName: emb.fileName,
              embeddingModel: "text-embedding-004"
            }
          }));
          console.log(`✅ Loaded ${documents.length} documents from embeddings`);
        }
      }

      this.documents = documents;
      this.isLoaded = true;
      return documents;

    } catch (error) {
      console.error('❌ Error loading documents:', error.message);
      return [];
    }
  }

  /**
   * Get all documents
   * @returns {Array} All documents
   */
  getAllDocuments() {
    if (!this.isLoaded) {
      this.loadDocuments();
    }
    return this.documents;
  }

  /**
   * Get documents by source
   * @param {string} source - Source identifier
   * @returns {Array} Filtered documents
   */
  getDocumentsBySource(source) {
    if (!this.isLoaded) {
      this.loadDocuments();
    }
    return this.documents.filter(doc => 
      doc.metadata?.source === source || doc.source === source
    );
  }

  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @returns {Object|null} Document or null
   */
  getDocumentById(id) {
    if (!this.isLoaded) {
      this.loadDocuments();
    }
    return this.documents.find(doc => doc.id === id) || null;
  }

  /**
   * Search documents by content
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Array} Matching documents
   */
  searchDocuments(query, limit = 10) {
    if (!this.isLoaded) {
      this.loadDocuments();
    }

    const queryLower = query.toLowerCase();
    const results = this.documents
      .filter(doc => 
        doc.content.toLowerCase().includes(queryLower) ||
        (doc.metadata?.source && doc.metadata.source.toLowerCase().includes(queryLower))
      )
      .slice(0, limit);

    return results;
  }

  /**
   * Get document statistics
   * @returns {Object} Document statistics
   */
  getStatistics() {
    if (!this.isLoaded) {
      this.loadDocuments();
    }

    const stats = {
      totalDocuments: this.documents.length,
      totalContentLength: this.documents.reduce((sum, doc) => sum + doc.content.length, 0),
      averageContentLength: 0,
      sources: {},
      documentTypes: {}
    };

    if (stats.totalDocuments > 0) {
      stats.averageContentLength = stats.totalContentLength / stats.totalDocuments;
    }

    // Count by source
    this.documents.forEach(doc => {
      const source = doc.metadata?.source || doc.source || 'unknown';
      stats.sources[source] = (stats.sources[source] || 0) + 1;
    });

    // Count by type
    this.documents.forEach(doc => {
      const type = doc.metadata?.type || 'unknown';
      stats.documentTypes[type] = (stats.documentTypes[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Save documents to storage
   * @param {Array} documents - Documents to save
   * @param {string} destination - Destination file path
   * @returns {boolean} Success status
   */
  saveDocuments(documents, destination = 'processed') {
    try {
      let filePath;
      
      if (destination === 'processed') {
        filePath = path.join(__dirname, '../../data/processed/discord_chunks.json');
      } else if (destination === 'embeddings') {
        filePath = path.join(__dirname, '../../data/gemini_embeddings.json');
      } else {
        filePath = destination;
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
      console.log(`✅ Saved ${documents.length} documents to ${filePath}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving documents:', error.message);
      return false;
    }
  }

  /**
   * Clear all documents from memory
   */
  clear() {
    this.documents = [];
    this.isLoaded = false;
  }

  /**
   * Reload documents from storage
   * @param {string} source - Source to reload from
   */
  reload(source = 'processed') {
    this.clear();
    this.loadDocuments(source);
  }
}

// Export singleton instance
export default new DocumentRepository();
