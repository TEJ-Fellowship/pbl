import fs from "fs/promises";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { AdvancedChunker } from "./utils/advancedChunker.js";
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";
import config from "../config/config.js";

// Configuration
const CHUNK_SIZE = parseInt(config.CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(config.CHUNK_OVERLAP) || 100;
const COLLECTION_NAME = "stripe_docs";
const VECTOR_STORE_PATH = "./data/vector_store";

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

// Load and process documents
async function loadDocuments() {
  console.log("📂 Loading scraped documents...");

  const scrapedDataPath = path.join(
    process.cwd(),
    "data",
    "stripe_docs",
    "scraped.json"
  );

  const scrapedData = JSON.parse(await fs.readFile(scrapedDataPath, "utf-8"));
  console.log(`📊 Found ${scrapedData.length} documents to process`);

  // Convert to LangChain Documents
  const documents = scrapedData.map((doc) => {
    return new Document({
      pageContent: doc.content,
      metadata: {
        source: doc.url,
        title: doc.title,
        category: doc.category,
        docType: doc.docType,
        wordCount: doc.wordCount,
        scrapedAt: doc.scrapedAt,
        id: doc.id,
      },
    });
  });

  return documents;
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

// Alternative: Store in local JSON file (fallback)
async function storeChunksLocally(chunks, embeddings) {
  console.log("💾 Storing chunks locally (fallback)...");

  const vectorStore = {
    chunks: [],
    metadata: {
      created_at: new Date().toISOString(),
      total_chunks: chunks.length,
      ai_provider: "gemini",
      embedding_model: "text-embedding-004",
    },
  };

  // Process chunks in batches
  const batchSize = parseInt(config.BATCH_SIZE) || 5;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(
      `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        chunks.length / batchSize
      )}`
    );

    for (const chunk of batch) {
      try {
        // Generate embedding
        const embedding = await embeddings.embedQuery(chunk.pageContent);

        vectorStore.chunks.push({
          id: chunk.metadata.chunk_id,
          content: chunk.pageContent,
          embedding: embedding,
          metadata: chunk.metadata,
        });

        console.log(`  ✅ Processed chunk: ${chunk.metadata.chunk_id}`);

        // Rate limiting
        await new Promise((resolve) =>
          setTimeout(resolve, parseInt(config.EMBEDDING_DELAY) || 200)
        );
      } catch (error) {
        console.error(
          `  ❌ Failed to process chunk ${chunk.metadata.chunk_id}:`,
          error.message
        );
      }
    }
  }

  // Save to file
  const outputPath = path.join(process.cwd(), "data", "vector_store.json");
  await fs.writeFile(outputPath, JSON.stringify(vectorStore, null, 2));

  console.log(`🎉 Local vector store saved to: ${outputPath}`);
  console.log(`📊 Total chunks stored: ${vectorStore.chunks.length}`);

  return vectorStore;
}

// Main ingestion function
async function main() {
  console.log("🚀 Starting Stripe documentation ingestion with Gemini...");

  try {
    // Initialize embeddings
    console.log("🤖 Initializing Gemini embeddings...");
    const embeddings = initEmbeddings();

    // Load documents
    const documents = await loadDocuments();

    // Process documents into chunks
    const chunks = await processDocuments(documents);

    // Try Pinecone first, fallback to local storage
    try {
      console.log("🗄️ Attempting to use Pinecone...");
      const pinecone = await initPinecone();
      await storeChunks(chunks, embeddings, pinecone);
      console.log("✅ Pinecone storage completed successfully!");
    } catch (pineconeError) {
      console.log("⚠️ Pinecone unavailable, using local storage...");
      console.log(`   Reason: ${pineconeError.message}`);
      await storeChunksLocally(chunks, embeddings);
    }

    // Store chunks in PostgreSQL for BM25 search
    try {
      console.log("🗄️ Storing chunks in PostgreSQL for BM25 search...");
      const postgresBM25Service = new PostgreSQLBM25Service();
      await postgresBM25Service.insertChunks(chunks);
      console.log("✅ PostgreSQL storage completed successfully!");
    } catch (postgresError) {
      console.log("⚠️ PostgreSQL storage failed:", postgresError.message);
      console.log("   Continuing with Pinecone/local storage only...");
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

export { processDocuments, initEmbeddings, loadDocuments };
