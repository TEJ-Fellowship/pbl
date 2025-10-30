import pool from "../config/database.js";

/**
 * Document Storage Service for managing raw scraped documents
 * Handles storage, retrieval, and processing status of documents
 */
class DocumentStorageService {
  constructor() {
    this.pool = pool;
    // Ensure schema exists before first use
    this.schemaInitialized = this.initializeSchema();
  }

  /**
   * Initialize database schema for raw_documents if it doesn't exist
   */
  async initializeSchema() {
    const client = await this.pool.connect();
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS raw_documents (
          id VARCHAR(255) PRIMARY KEY,
          url TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          title TEXT,
          content TEXT,
          word_count INTEGER,
          scraped_at TIMESTAMP NOT NULL,
          doc_type VARCHAR(50) DEFAULT 'document',
          metadata JSONB DEFAULT '{}'::jsonb,
          processed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_raw_documents_category ON raw_documents(category);
        CREATE INDEX IF NOT EXISTS idx_raw_documents_processed ON raw_documents(processed);
        CREATE INDEX IF NOT EXISTS idx_raw_documents_scraped_at ON raw_documents(scraped_at);
      `;

      await client.query(createTableSQL);
    } finally {
      client.release();
    }
  }

  /**
   * Store scraped documents in PostgreSQL
   */
  async storeDocuments(documents) {
    // Ensure schema is ready before inserts
    await this.schemaInitialized;
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const insertPromises = documents.map(async (doc) => {
        const query = `
          INSERT INTO raw_documents 
          (id, url, category, title, content, word_count, scraped_at, doc_type, metadata, processed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
          url = EXCLUDED.url,
          category = EXCLUDED.category,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          word_count = EXCLUDED.word_count,
          scraped_at = EXCLUDED.scraped_at,
          doc_type = EXCLUDED.doc_type,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        `;

        const values = [
          doc.id,
          doc.url,
          doc.category,
          doc.title || "",
          doc.content,
          doc.wordCount || 0,
          doc.scrapedAt ? new Date(doc.scrapedAt) : new Date(),
          doc.docType || "document",
          JSON.stringify(doc.metadata || {}),
          false, // Not processed yet
        ];

        return client.query(query, values);
      });

      await Promise.all(insertPromises);
      await client.query("COMMIT");

      console.log(`✅ Stored ${documents.length} documents in PostgreSQL`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get unprocessed documents for processing
   */
  async getUnprocessedDocuments(limit = 100, category = null) {
    const client = await this.pool.connect();

    try {
      let whereClause = "WHERE processed = false";
      let queryParams = [];
      let paramIndex = 1;

      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      const query = `
        SELECT 
          id, url, category, title, content, word_count, 
          scraped_at, doc_type, metadata
        FROM raw_documents 
        ${whereClause}
        ORDER BY scraped_at DESC
        LIMIT $${paramIndex}
      `;

      queryParams.push(limit);

      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Mark documents as processed
   */
  async markAsProcessed(documentIds) {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE raw_documents 
        SET processed = true, updated_at = NOW()
        WHERE id = ANY($1)
      `;

      await client.query(query, [documentIds]);
      console.log(`✅ Marked ${documentIds.length} documents as processed`);
    } finally {
      client.release();
    }
  }

  /**
   * Get document statistics
   */
  async getStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN processed = true THEN 1 END) as processed_documents,
          COUNT(CASE WHEN processed = false THEN 1 END) as unprocessed_documents,
          COUNT(DISTINCT category) as categories,
          AVG(word_count) as avg_word_count,
          MIN(scraped_at) as oldest_document,
          MAX(scraped_at) as newest_document
        FROM raw_documents
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category, limit = 50) {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT id, url, title, word_count, scraped_at, processed
        FROM raw_documents 
        WHERE category = $1
        ORDER BY scraped_at DESC
        LIMIT $2
      `;

      const result = await client.query(query, [category, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Search documents by content (for debugging)
   */
  async searchDocuments(query, limit = 20) {
    const client = await this.pool.connect();

    try {
      const searchQuery = `
        SELECT 
          id, url, category, title, 
          ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as rank
        FROM raw_documents 
        WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2
      `;

      const result = await client.query(searchQuery, [query, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old processed documents (optional)
   */
  async cleanupOldDocuments(daysOld = 30) {
    const client = await this.pool.connect();

    try {
      const query = `
        DELETE FROM raw_documents 
        WHERE processed = true 
        AND updated_at < NOW() - INTERVAL '${daysOld} days'
      `;

      const result = await client.query(query);
      console.log(`🧹 Cleaned up ${result.rowCount} old documents`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default DocumentStorageService;