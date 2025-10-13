import fs from "fs/promises";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { AdvancedChunker } from "../utils/advancedChunker.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
import DocumentStorageService from "../services/documentStorageService.js";
import config from "../config/config.js";

// Configuration
const CHUNK_SIZE = parseInt(config.CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(config.CHUNK_OVERLAP) || 100;
const COLLECTION_NAME = "stripe_docs";

// Initialize Gemini embeddings
function initEmbeddings() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

// Initialize Pinecone client
async function initPinecone() {
  try {
    if (!config.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }

    const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
    console.log("✅ Pinecone client initialized");
    return pinecone;
  } catch (error) {
    console.error("❌ Pinecone initialization failed:", error.message);
    throw error;
  }
}

// Legacy function - no longer needed with PostgreSQL storage
// async function loadDocuments() { ... }

/**
 * Load documents from PostgreSQL (scalable approach)
 */
async function loadDocumentsFromDB(limit = 100, category = null) {
  console.log("📂 Loading documents from PostgreSQL...");

  const documentStorageService = new DocumentStorageService();

  try {
    const rawDocuments = await documentStorageService.getUnprocessedDocuments(
      limit,
      category
    );
    console.log(`📊 Found ${rawDocuments.length} unprocessed documents`);

    // Convert to LangChain Documents
    const documents = rawDocuments.map((doc) => {
      return new Document({
        pageContent: doc.content,
        metadata: {
          id: doc.id,
          source: doc.url,
          title: doc.title,
          category: doc.category,
          docType: doc.doc_type,
          wordCount: doc.word_count,
          scrapedAt: doc.scraped_at,
          ...doc.metadata,
        },
      });
    });

    return documents;
  } finally {
    await documentStorageService.close();
  }
}

/**
 * Store scraped documents in PostgreSQL
 */
async function storeScrapedDocuments() {
  console.log("📂 Storing scraped documents in PostgreSQL...");

  const scrapedDataPath = path.join(
    process.cwd(),
    "data",
    "stripe_docs",
    "scraped.json"
  );

  const scrapedData = JSON.parse(await fs.readFile(scrapedDataPath, "utf-8"));
  console.log(`📊 Found ${scrapedData.length} documents to store`);

  const documentStorageService = new DocumentStorageService();

  try {
    await documentStorageService.storeDocuments(scrapedData);
    console.log("✅ Documents stored in PostgreSQL successfully!");
  } finally {
    await documentStorageService.close();
  }
}

// Create text splitter
function createTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", " ", ""],
    keepSeparator: false,
  });
}

// Process documents into chunks with advanced chunking
async function processDocuments(documents) {
  console.log("📄 Processing documents with advanced chunking...");

  const textSplitter = createTextSplitter();
  const advancedChunker = new AdvancedChunker();
  const allChunks = [];

  for (const doc of documents) {
    console.log(
      `🔍 Processing: ${doc.metadata.category} (${doc.metadata.wordCount} words)`
    );

    // Use advanced chunking with code separation
    const chunks = await advancedChunker.createEnhancedChunks(
      doc,
      textSplitter
    );

    // Add chunk IDs
    chunks.forEach((chunk, index) => {
      chunk.metadata.chunk_id = `${doc.metadata.id}_chunk_${index}`;
    });

    allChunks.push(...chunks);
    console.log(`  ✅ Created ${chunks.length} chunks (with code separation)`);
  }

  console.log(`📊 Total chunks created: ${allChunks.length}`);
  return allChunks;
}

// Store chunks in Pinecone
async function storeChunks(chunks, embeddings, pinecone) {
  console.log("💾 Storing chunks in Pinecone...");

  try {
    const index = pinecone.Index(config.PINECONE_INDEX_NAME);
    console.log(`📊 Using Pinecone index: ${config.PINECONE_INDEX_NAME}`);

    // Prepare vectors for upsert
    const vectors = [];
    for (const chunk of chunks) {
      const embedding = await embeddings.embedQuery(chunk.pageContent);
      vectors.push({
        id: chunk.metadata.chunk_id,
        values: embedding,
        metadata: {
          content: chunk.pageContent,
          source: chunk.metadata.source,
          source_url: chunk.metadata.source_url,
          title: chunk.metadata.title,
          category: chunk.metadata.category,
          docType: chunk.metadata.docType,
          doc_type: chunk.metadata.doc_type,
          last_updated: chunk.metadata.last_updated,
          code_language: chunk.metadata.code_language,
          chunk_type: chunk.metadata.chunk_type,
          chunk_index: chunk.metadata.chunk_index,
          total_chunks: chunk.metadata.total_chunks,
        },
      });
    }

    // Upsert vectors in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(
        `📦 Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          vectors.length / batchSize
        )}`
      );
    }

    console.log(
      `✅ Chunks stored successfully in Pinecone (${vectors.length} total)`
    );
    return { index, vectors };
  } catch (error) {
    console.error("❌ Failed to store chunks in Pinecone:", error.message);
    throw error;
  }
}

// Main ingestion function
async function main() {
  console.log("🚀 Starting Stripe documentation ingestion with Gemini...");

  try {
    // Initialize embeddings
    console.log("🤖 Initializing Gemini embeddings...");
    const embeddings = initEmbeddings();

    // Load from PostgreSQL (scalable approach)
    const documents = await loadDocumentsFromDB(100); // Process 100 documents at a time

    // Process documents into chunks
    const chunks = await processDocuments(documents);

    // Store chunks in Pinecone for semantic search
    try {
      console.log("🗄️ Storing chunks in Pinecone for semantic search...");
      const pinecone = await initPinecone();
      await storeChunks(chunks, embeddings, pinecone);
      console.log("✅ Pinecone storage completed successfully!");
    } catch (pineconeError) {
      console.log("❌ Pinecone storage failed:", pineconeError.message);
      console.log("   Please check your Pinecone configuration and try again.");
      throw pineconeError;
    }

    // Store chunks in PostgreSQL for BM25 search
    try {
      console.log("🗄️ Storing chunks in PostgreSQL for BM25 search...");
      const postgresBM25Service = new PostgreSQLBM25Service();
      await postgresBM25Service.insertChunks(chunks);
      console.log("✅ PostgreSQL storage completed successfully!");
    } catch (postgresError) {
      console.log("❌ PostgreSQL storage failed:", postgresError.message);
      console.log(
        "   Please check your PostgreSQL configuration and try again."
      );
      throw postgresError;
    }

    console.log(`\n🎉 Ingestion completed successfully!`);
    console.log(`📊 Total chunks processed: ${chunks.length}`);
    console.log(`🔍 Ready for RAG queries!`);
  } catch (error) {
    console.error("❌ Ingestion failed:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
  main().catch(console.error);
}

export {
  processDocuments,
  initEmbeddings,
  loadDocumentsFromDB,
  storeScrapedDocuments,
};
