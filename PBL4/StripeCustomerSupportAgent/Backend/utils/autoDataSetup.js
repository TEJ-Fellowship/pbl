import pool from "../config/database.js";
import DocumentStorageService from "../services/documentStorageService.js";

/**
 * Auto Data Setup Utility
 * Handles automatic scraping and ingestion on startup
 */
class AutoDataSetup {
  constructor() {
    this.isRunning = false;
    this.scrapingEnabled = process.env.AUTO_SCRAPE !== "false"; // Enabled by default
    this.ingestionEnabled = process.env.AUTO_INGEST !== "false"; // Enabled by default
  }

  /**
   * Check if documents have been scraped
   */
  async hasScrapedDocuments() {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM raw_documents
        `);
        const count = parseInt(result.rows[0].count);
        return count > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("   ⚠️  Error checking scraped documents:", error.message);
      return false;
    }
  }

  /**
   * Check if there are unprocessed documents
   */
  async hasUnprocessedDocuments() {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM raw_documents 
          WHERE processed = false
        `);
        const count = parseInt(result.rows[0].count);
        return count > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "   ⚠️  Error checking unprocessed documents:",
        error.message
      );
      return false;
    }
  }

  /**
   * Check if chunks exist in database
   */
  async hasChunks() {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM document_chunks
        `);
        const count = parseInt(result.rows[0].count);
        return count > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("   ⚠️  Error checking chunks:", error.message);
      return false;
    }
  }

  /**
   * Run scraping in background (non-blocking)
   */
  async runScraping() {
    if (this.isRunning) {
      console.log("   ⚠️  Scraping already in progress, skipping...");
      return;
    }

    if (!this.scrapingEnabled) {
      console.log(
        "   ℹ️  Auto-scraping is disabled (set AUTO_SCRAPE=false to disable)"
      );
      return;
    }

    this.isRunning = true;
    console.log("   🔄 Starting auto-scraping in background...");

    // Run in background (don't await - fire and forget)
    (async () => {
      try {
        const { scrapeDoc, SOURCES } = await import("../scripts/scraper.js");
        const DocumentStorageService = (
          await import("../services/documentStorageService.js")
        ).default;

        const docs = [];
        // Limit to first 3 sources for initial setup (can be configured)
        const sourcesToScrape = Object.keys(SOURCES).slice(0, 3);

        console.log(`   📡 Scraping ${sourcesToScrape.length} sources...`);

        for (const category of sourcesToScrape) {
          try {
            const doc = await scrapeDoc(SOURCES[category], category);
            if (doc) {
              docs.push(doc);
              console.log(`   ✅ Scraped ${category}: ${doc.wordCount} words`);
            }
          } catch (error) {
            console.log(
              `   ⚠️  Failed to scrape ${category}: ${error.message}`
            );
          }
        }

        if (docs.length > 0) {
          const documentStorageService = new DocumentStorageService();
          await documentStorageService.storeDocuments(docs);
          console.log(`   ✅ Stored ${docs.length} documents in database`);

          // Trigger ingestion after scraping
          setTimeout(() => this.checkAndIngest(), 2000);
        } else {
          console.log("   ⚠️  No documents scraped");
        }
      } catch (error) {
        console.error("   ❌ Auto-scraping failed:", error.message);
      } finally {
        this.isRunning = false;
      }
    })();
  }

  /**
   * Run ingestion in background (non-blocking)
   */
  async runIngestion() {
    if (!this.ingestionEnabled) {
      console.log(
        "   ℹ️  Auto-ingestion is disabled (set AUTO_INGEST=false to disable)"
      );
      return;
    }

    console.log("   🔄 Starting auto-ingestion in background...");

    // Run in background (don't await - fire and forget)
    (async () => {
      try {
        const ingestModule = await import("../scripts/ingest.js");
        const { loadDocumentsFromDB, processDocuments, initEmbeddings } =
          ingestModule;

        // These functions are used internally in ingest.js, we need to import them separately
        const { Pinecone } = await import("@pinecone-database/pinecone");
        const config = (await import("../config/config.js")).default;

        // Helper function to initialize Pinecone
        const initPinecone = async () => {
          if (!config.PINECONE_API_KEY) {
            throw new Error(
              "PINECONE_API_KEY environment variable is required"
            );
          }
          const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
          return pinecone;
        };

        // Helper function to store chunks in Pinecone (replicated from ingest.js)
        const storeChunks = async (chunks, embeddings, pinecone) => {
          const index = pinecone.Index(
            config.PINECONE_INDEX_NAME || "stripe-docs"
          );

          // Prepare vectors for upsert
          const vectors = [];
          for (const chunk of chunks) {
            const embedding = await embeddings.embedQuery(
              chunk.pageContent || chunk.content
            );
            vectors.push({
              id:
                chunk.metadata?.chunk_id ||
                `chunk_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              values: embedding,
              metadata: {
                content: chunk.pageContent || chunk.content,
                source: chunk.metadata?.source,
                source_url: chunk.metadata?.source_url,
                title: chunk.metadata?.title,
                category: chunk.metadata?.category,
                docType: chunk.metadata?.docType,
                doc_type: chunk.metadata?.doc_type,
                ...chunk.metadata,
              },
            });
          }

          // Upsert vectors in batches
          const batchSize = 100;
          for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
            console.log(
              `   📦 Upserted batch ${
                Math.floor(i / batchSize) + 1
              }/${Math.ceil(vectors.length / batchSize)}`
            );
          }

          console.log(`   ✅ Stored ${vectors.length} chunks in Pinecone`);
        };

        const PostgreSQLBM25Service = (
          await import("../services/postgresBM25Service.js")
        ).default;

        console.log("   🤖 Initializing embeddings...");
        const embeddings = initEmbeddings();

        // Load unprocessed documents (limit to 50 for initial setup)
        const documents = await loadDocumentsFromDB(50);

        if (documents.length === 0) {
          console.log("   ℹ️  No unprocessed documents to ingest");
          return;
        }

        console.log(`   📊 Processing ${documents.length} documents...`);
        const chunks = await processDocuments(documents);

        // Store in Pinecone
        try {
          console.log("   🗄️  Storing chunks in Pinecone...");
          const pinecone = await initPinecone();
          await storeChunks(chunks, embeddings, pinecone);
          console.log("   ✅ Pinecone storage completed");
        } catch (error) {
          console.log(`   ⚠️  Pinecone storage failed: ${error.message}`);
          // Continue with PostgreSQL storage
        }

        // Store in PostgreSQL
        try {
          console.log("   🗄️  Storing chunks in PostgreSQL...");
          const postgresBM25Service = new PostgreSQLBM25Service();
          await postgresBM25Service.insertChunks(chunks);
          console.log("   ✅ PostgreSQL storage completed");

          // Mark documents as processed
          const documentStorageService = new DocumentStorageService();
          const documentIds = documents.map((doc) => doc.id);
          await documentStorageService.markAsProcessed(documentIds);
          console.log(
            `   ✅ Marked ${documentIds.length} documents as processed`
          );
        } catch (error) {
          console.log(`   ⚠️  PostgreSQL storage failed: ${error.message}`);
        }

        console.log(
          `   🎉 Ingestion completed: ${chunks.length} chunks processed`
        );
      } catch (error) {
        console.error("   ❌ Auto-ingestion failed:", error.message);
      }
    })();
  }

  /**
   * Main auto-setup function
   * Checks what's needed and runs appropriate processes
   */
  async runAutoSetup() {
    console.log("\n📊 Checking data setup status...");

    try {
      // Check if documents have been scraped
      const hasDocuments = await this.hasScrapedDocuments();

      if (!hasDocuments) {
        console.log("   ⚠️  No documents found in database");
        console.log("   🔄 Starting auto-scraping...");
        await this.runScraping();
        // Wait a bit for scraping to start, then check for ingestion
        setTimeout(() => this.checkAndIngest(), 5000);
      } else {
        console.log("   ✅ Documents found in database");

        // Check if there are unprocessed documents
        const hasUnprocessed = await this.hasUnprocessedDocuments();
        const hasChunks = await this.hasChunks();

        if (hasUnprocessed && !hasChunks) {
          console.log(
            "   ⚠️  Found unprocessed documents, starting ingestion..."
          );
          await this.runIngestion();
        } else if (hasUnprocessed) {
          console.log(
            "   ⚠️  Found unprocessed documents, starting ingestion..."
          );
          await this.runIngestion();
        } else if (!hasChunks) {
          console.log(
            "   ⚠️  No chunks found, but all documents are processed"
          );
          console.log(
            "   💡 You may want to re-run ingestion to create chunks"
          );
        } else {
          console.log(
            "   ✅ Data setup complete (documents scraped and chunks created)"
          );
        }
      }
    } catch (error) {
      console.error("   ❌ Auto-setup check failed:", error.message);
    }
  }

  /**
   * Check and run ingestion if needed
   */
  async checkAndIngest() {
    const hasUnprocessed = await this.hasUnprocessedDocuments();
    if (hasUnprocessed) {
      await this.runIngestion();
    }
  }
}

export default AutoDataSetup;
