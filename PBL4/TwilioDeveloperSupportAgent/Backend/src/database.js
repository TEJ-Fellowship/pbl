// backend/src/database.js
import pkg from "pg";
const { Pool } = pkg;
import config from "../config/config.js";

// Create PostgreSQL connection pool
const pool = new Pool({
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  database: config.POSTGRES_DB,
  user: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  ssl: config.POSTGRES_SSL ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    return false;
  }
}

// Initialize database schema (create tables if they don't exist)
async function initializeSchema() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS scraped_docs (
      id VARCHAR(255) PRIMARY KEY,
      url TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      title TEXT,
      content TEXT,
      word_count INTEGER,
      scraped_at TIMESTAMP NOT NULL,
      doc_type VARCHAR(50) DEFAULT 'api',
      code_blocks JSONB DEFAULT '[]'::jsonb,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_scraped_docs_category ON scraped_docs(category);
    CREATE INDEX IF NOT EXISTS idx_scraped_docs_scraped_at ON scraped_docs(scraped_at);
    CREATE INDEX IF NOT EXISTS idx_scraped_docs_url ON scraped_docs(url);

    -- Full-text search index (PostgreSQL specific)
    CREATE INDEX IF NOT EXISTS idx_scraped_docs_content_search ON scraped_docs USING gin(to_tsvector('english', content));
    CREATE INDEX IF NOT EXISTS idx_scraped_docs_title_search ON scraped_docs USING gin(to_tsvector('english', title));
  `;

  try {
    await pool.query(createTableQuery);
    console.log("✅ Database schema initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize database schema:", error.message);
    throw error;
  }
}

// Insert or update a scraped document
async function saveScrapedDoc(doc) {
  const insertQuery = `
    INSERT INTO scraped_docs (
      id, url, category, title, content, word_count, 
      scraped_at, doc_type, code_blocks, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) 
    DO UPDATE SET
      url = EXCLUDED.url,
      category = EXCLUDED.category,
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      word_count = EXCLUDED.word_count,
      scraped_at = EXCLUDED.scraped_at,
      doc_type = EXCLUDED.doc_type,
      code_blocks = EXCLUDED.code_blocks,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;

  try {
    const values = [
      doc.id,
      doc.url,
      doc.category,
      doc.title,
      doc.content,
      doc.wordCount || 0,
      doc.scrapedAt || new Date().toISOString(),
      doc.docType || "api",
      JSON.stringify(doc.codeBlocks || []),
      JSON.stringify(doc.metadata || {}),
    ];

    const result = await pool.query(insertQuery, values);
    return result.rows[0].id;
  } catch (error) {
    console.error(`❌ Error saving document ${doc.id}:`, error.message);
    throw error;
  }
}

// Save multiple documents in a transaction
async function saveScrapedDocs(docs) {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    const savedIds = [];
    for (const doc of docs) {
      const id = await saveScrapedDocWithClient(client, doc);
      savedIds.push(id);
    }

    await client.query("COMMIT");
    return savedIds;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error saving documents:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function for transaction-based saving
async function saveScrapedDocWithClient(client, doc) {
  const insertQuery = `
    INSERT INTO scraped_docs (
      id, url, category, title, content, word_count, 
      scraped_at, doc_type, code_blocks, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) 
    DO UPDATE SET
      url = EXCLUDED.url,
      category = EXCLUDED.category,
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      word_count = EXCLUDED.word_count,
      scraped_at = EXCLUDED.scraped_at,
      doc_type = EXCLUDED.doc_type,
      code_blocks = EXCLUDED.code_blocks,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;

  const values = [
    doc.id,
    doc.url,
    doc.category,
    doc.title,
    doc.content,
    doc.wordCount || 0,
    doc.scrapedAt || new Date().toISOString(),
    doc.docType || "api",
    JSON.stringify(doc.codeBlocks || []),
    JSON.stringify(doc.metadata || {}),
  ];

  const result = await client.query(insertQuery, values);
  return result.rows[0].id;
}

// Get a document by ID
async function getScrapedDoc(id) {
  const query = "SELECT * FROM scraped_docs WHERE id = $1";
  try {
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    
    const doc = result.rows[0];
    return {
      id: doc.id,
      url: doc.url,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      wordCount: doc.word_count,
      scrapedAt: doc.scraped_at,
      docType: doc.doc_type,
      codeBlocks: doc.code_blocks,
      metadata: doc.metadata,
    };
  } catch (error) {
    console.error(`❌ Error getting document ${id}:`, error.message);
    throw error;
  }
}

// Get all documents
async function getAllScrapedDocs() {
  const query = "SELECT * FROM scraped_docs ORDER BY scraped_at DESC";
  try {
    const result = await pool.query(query);
    return result.rows.map((doc) => ({
      id: doc.id,
      url: doc.url,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      wordCount: doc.word_count,
      scrapedAt: doc.scraped_at,
      docType: doc.doc_type,
      codeBlocks: doc.code_blocks,
      metadata: doc.metadata,
    }));
  } catch (error) {
    console.error("❌ Error getting all documents:", error.message);
    throw error;
  }
}

// Get documents by category
async function getScrapedDocsByCategory(category) {
  const query = "SELECT * FROM scraped_docs WHERE category = $1 ORDER BY scraped_at DESC";
  try {
    const result = await pool.query(query, [category]);
    return result.rows.map((doc) => ({
      id: doc.id,
      url: doc.url,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      wordCount: doc.word_count,
      scrapedAt: doc.scraped_at,
      docType: doc.doc_type,
      codeBlocks: doc.code_blocks,
      metadata: doc.metadata,
    }));
  } catch (error) {
    console.error(`❌ Error getting documents by category ${category}:`, error.message);
    throw error;
  }
}

// Full-text search in documents
async function searchScrapedDocs(searchTerm, limit = 10) {
  const query = `
    SELECT 
      id, url, category, title, content, word_count, 
      scraped_at, doc_type, code_blocks, metadata,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as rank
    FROM scraped_docs
    WHERE 
      to_tsvector('english', content) @@ plainto_tsquery('english', $1)
      OR to_tsvector('english', title) @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC
    LIMIT $2;
  `;
  
  try {
    const result = await pool.query(query, [searchTerm, limit]);
    return result.rows.map((doc) => ({
      id: doc.id,
      url: doc.url,
      category: doc.category,
      title: doc.title,
      content: doc.content,
      wordCount: doc.word_count,
      scrapedAt: doc.scraped_at,
      docType: doc.doc_type,
      codeBlocks: doc.code_blocks,
      metadata: doc.metadata,
      rank: doc.rank,
    }));
  } catch (error) {
    console.error(`❌ Error searching documents:`, error.message);
    throw error;
  }
}

// Get statistics
async function getStats() {
  const query = `
    SELECT 
      COUNT(*) as total_docs,
      SUM(word_count) as total_words,
      COUNT(DISTINCT category) as total_categories,
      MAX(scraped_at) as last_scraped
    FROM scraped_docs;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error getting stats:", error.message);
    throw error;
  }
}

// Close the connection pool
async function closePool() {
  await pool.end();
  console.log("✅ PostgreSQL connection pool closed");
}

export {
  pool,
  testConnection,
  initializeSchema,
  saveScrapedDoc,
  saveScrapedDocs,
  getScrapedDoc,
  getAllScrapedDocs,
  getScrapedDocsByCategory,
  searchScrapedDocs,
  getStats,
  closePool,
};
