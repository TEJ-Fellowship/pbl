/**
 * Database Setup Script
 *
 * Creates PostgreSQL tables and indexes for the hybrid search system.
 * Run this once before using the hybrid search.
 *
 * Usage: npm run db:setup
 */

import pkg from "pg";
const { Pool } = pkg;
import config from "../../config/config.js";

async function setupDatabase() {
  console.log(`PostgreSQL Database setting.....`);

  // Create connection pool
  const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD || "password",
    port: config.DB_PORT,
  });

  try {
    // Test connection
    console.log(`Testing database connection...`);
    await pool.query("SELECT NOW()");
    console.log(`Database connection successful!`);

    // Create documents_chunks table
    console.log(`Creating documents_chunks table...`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents_chunks (
        id SERIAL PRIMARY KEY,
        chunk_id VARCHAR(255) UNIQUE NOT NULL,
        pageContent TEXT NOT NULL,
        metadata JSONB,
        title VARCHAR(500),
        category VARCHAR(100),
        doc_type VARCHAR(50),
        chunk_index INTEGER DEFAULT 0,
        total_chunks INTEGER DEFAULT 1,
        published_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        search_vector tsvector
      )
    `);
    console.log(`Documents table created!`);

    // Create full-text search index (for BM25)
    console.log(`Creating full-text search index...`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_chunks_search_idx 
      ON documents_chunks 
      USING GIN (search_vector)
    `);
    console.log(`Full-text search index created`);

    // Create category index (for filtering)
    console.log(`Creating category index...`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_chunks_category_idx 
      ON documents_chunks (category)
    `);
    console.log(`Category index created`);

    // Create chunk_id index (for uniqueness)
    console.log(`Creating chunk_id index...`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_chunks_chunk_id_idx 
      ON documents_chunks (chunk_id)
    `);
    console.log(`Chunk ID index created`);

    // Create published_date index (for recency boost)
    console.log(`Creating published_date index...`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_chunks_published_date_idx 
      ON documents_chunks (published_date DESC)
    `);
    console.log(`Published date index created`);

    // Create trigger to automatically update search_vector
    console.log(`Creating automatic search vector trigger...`);
    await pool.query(`
      CREATE OR REPLACE FUNCTION documents_chunks_search_vector_update() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.pageContent, ''));
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS documents_chunks_search_vector_trigger ON documents_chunks;
    `);

    await pool.query(`
      CREATE TRIGGER documents_chunks_search_vector_trigger 
      BEFORE INSERT OR UPDATE ON documents_chunks
      FOR EACH ROW 
      EXECUTE FUNCTION documents_chunks_search_vector_update();
    `);
    console.log(`Automatic search vector trigger created`);

    // Check if table has data
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM documents_chunks"
    );
    const documentCount = parseInt(countResult.rows[0].count);

    console.log(`Database Statistics:`);
    console.log(`   Documents: ${documentCount}`);

    if (documentCount === 0) {
      console.log(`No documents in database yet`);
      console.log(`Next steps:`);
      console.log(`   1. Run: npm run enhanced-ingest (to process documents)`);
      console.log(`   2. Import documents into PostgreSQL`);
    } else {
      console.log(`Database has ${documentCount} documents`);
    }

    console.log(`Database setup completed successfully!`);
  } catch (error) {
    console.error(`Database setup failed`, error.message);
    console.error(`Troubleshooting: ERROR`);
    console.error(`   1. Make sure PostgreSQL is installed and running`);
    console.error(`   2. Check your .env file has correct DB credentials`);
    console.error(`   3. Create database: createdb ${config.DB_NAME}`);
    console.error(`   4. Update DB_PASSWORD in .env file`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
