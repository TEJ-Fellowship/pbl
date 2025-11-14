import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Database Schema Setup
 * Creates all required tables for:
 * 1. Raw documents (scraping)
 * 2. Document chunks (chunking & BM25 search)
 * 3. Conversation memory (chat functionality)
 */
async function setupAllSchemas() {
  console.log("🚀 Setting up complete database schema...");
  console.log("=".repeat(60));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ============================================
    // 1. RAW DOCUMENTS TABLE (for scraping)
    // ============================================
    console.log("\n📄 Step 1: Creating raw_documents table...");
    try {
      const rawDocumentsSchema = `
        -- Create raw documents table for storing scraped documents
        CREATE TABLE IF NOT EXISTS raw_documents (
            id VARCHAR(255) PRIMARY KEY,
            url TEXT NOT NULL,
            category VARCHAR(100),
            title TEXT,
            content TEXT NOT NULL,
            word_count INTEGER,
            scraped_at TIMESTAMP DEFAULT NOW(),
            doc_type VARCHAR(50),
            metadata JSONB,
            processed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for efficient querying
        CREATE INDEX IF NOT EXISTS idx_raw_documents_category ON raw_documents (category);
        CREATE INDEX IF NOT EXISTS idx_raw_documents_processed ON raw_documents (processed);
        CREATE INDEX IF NOT EXISTS idx_raw_documents_scraped_at ON raw_documents (scraped_at);
        CREATE INDEX IF NOT EXISTS idx_raw_documents_doc_type ON raw_documents (doc_type);

        -- Create full-text search index for content
        CREATE INDEX IF NOT EXISTS idx_raw_documents_content_gin ON raw_documents USING gin(to_tsvector('english', content));

        -- Create metadata search index
        CREATE INDEX IF NOT EXISTS idx_raw_documents_metadata_gin ON raw_documents USING gin(metadata);

        -- Create composite index for processing queries
        CREATE INDEX IF NOT EXISTS idx_raw_documents_processed_category ON raw_documents (processed, category);
      `;

      await client.query(rawDocumentsSchema);
      console.log("   ✅ raw_documents table created successfully");
    } catch (error) {
      if (error.code === "42P07" || error.message.includes("already exists")) {
        console.log("   ⚠️  raw_documents table already exists, skipping...");
      } else {
        console.error(
          "   ❌ Error creating raw_documents table:",
          error.message
        );
        throw error;
      }
    }

    // ============================================
    // 2. DOCUMENT CHUNKS TABLE (for chunking & BM25 search)
    // ============================================
    console.log("\n📦 Step 2: Creating document_chunks table...");
    try {
      const documentChunksSchema = `
        -- Create document chunks table for BM25 search
        CREATE TABLE IF NOT EXISTS document_chunks (
            id SERIAL PRIMARY KEY,
            chunk_id VARCHAR(255) UNIQUE NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            title VARCHAR(500),
            category VARCHAR(100),
            source VARCHAR(500),
            word_count INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for efficient BM25 search
        CREATE INDEX IF NOT EXISTS idx_document_chunks_content_gin ON document_chunks USING gin(to_tsvector('english', content));
        CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata_gin ON document_chunks USING gin(metadata);
        CREATE INDEX IF NOT EXISTS idx_document_chunks_category ON document_chunks (category);
        CREATE INDEX IF NOT EXISTS idx_document_chunks_source ON document_chunks (source);
        CREATE INDEX IF NOT EXISTS idx_document_chunks_word_count ON document_chunks (word_count);

        -- Create composite index for hybrid queries
        CREATE INDEX IF NOT EXISTS idx_document_chunks_category_word_count ON document_chunks (category, word_count);

        -- Create index for chunk_id lookups
        CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_id ON document_chunks (chunk_id);
      `;

      await client.query(documentChunksSchema);
      console.log("   ✅ document_chunks table created successfully");
    } catch (error) {
      if (error.code === "42P07" || error.message.includes("already exists")) {
        console.log("   ⚠️  document_chunks table already exists, skipping...");
      } else {
        console.error(
          "   ❌ Error creating document_chunks table:",
          error.message
        );
        throw error;
      }
    }

    // ============================================
    // 3. CONVERSATION MEMORY TABLES (for chat)
    // ============================================
    console.log("\n💬 Step 3: Creating conversation memory tables...");
    try {
      // Read the conversation memory SQL file
      // Try multiple possible paths
      let memorySchemaPath = path.join(
        __dirname,
        "setup_conversation_memory.sql"
      );

      // If not found, try scripts directory
      try {
        await fs.access(memorySchemaPath);
      } catch {
        memorySchemaPath = path.join(
          process.cwd(),
          "scripts",
          "setup_conversation_memory.sql"
        );
      }
      const memorySchemaSQL = await fs.readFile(memorySchemaPath, "utf8");

      await client.query(memorySchemaSQL);
      console.log("   ✅ Conversation memory tables created successfully");
    } catch (error) {
      if (error.code === "42P07" || error.message.includes("already exists")) {
        console.log(
          "   ⚠️  Conversation memory tables already exist, skipping..."
        );
      } else {
        console.error(
          "   ❌ Error creating conversation memory tables:",
          error.message
        );
        throw error;
      }
    }

    await client.query("COMMIT");

    // ============================================
    // VERIFICATION
    // ============================================
    console.log("\n🔍 Step 4: Verifying schema...");
    try {
      const verificationQuery = `
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name IN ('raw_documents', 'document_chunks', 'conversation_sessions', 
                              'conversation_messages', 'conversation_qa_pairs', 
                              'conversation_summaries', 'memory_retrieval_cache')) as table_count,
          (SELECT COUNT(*) FROM raw_documents) as raw_docs_count,
          (SELECT COUNT(*) FROM document_chunks) as chunks_count,
          (SELECT COUNT(*) FROM conversation_sessions) as sessions_count;
      `;

      const verification = await client.query(verificationQuery);
      const stats = verification.rows[0];

      console.log("\n📊 Database Schema Status:");
      console.log("=".repeat(60));
      console.log(`   ✅ Tables created: ${stats.table_count}/7`);
      console.log(`   📄 Raw documents: ${stats.raw_docs_count}`);
      console.log(`   📦 Document chunks: ${stats.chunks_count}`);
      console.log(`   💬 Conversation sessions: ${stats.sessions_count}`);
      console.log("=".repeat(60));
    } catch (verifyError) {
      console.log(
        "   ⚠️  Verification query failed (tables may not exist yet):",
        verifyError.message
      );
      console.log(
        "   This is normal if this is the first run and tables weren't created."
      );
    }

    console.log("\n🎉 Database schema setup completed successfully!");
    console.log("\n📋 Created tables:");
    console.log("   • raw_documents - For storing scraped documents");
    console.log("   • document_chunks - For storing chunks (BM25 search)");
    console.log("   • conversation_sessions - For chat sessions");
    console.log("   • conversation_messages - For chat messages");
    console.log("   • conversation_qa_pairs - For Q&A pairs");
    console.log("   • conversation_summaries - For conversation summaries");
    console.log("   • memory_retrieval_cache - For memory cache");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Database schema setup failed:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("setup_all_schemas.js")) {
  setupAllSchemas()
    .then(() => {
      console.log("\n✅ Setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Setup failed:", error);
      process.exit(1);
    });
}

export default setupAllSchemas;
