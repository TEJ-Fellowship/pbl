import fs from "fs/promises";
import path from "path";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const COLLECTION_NAME = "stripe_docs";
const VECTOR_STORE_PATH = "./data/vector_store";

// Initialize AI provider
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

// Initialize embeddings based on provider
function initEmbeddings() {
  if (AI_PROVIDER === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    return new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: "text-embedding-004",
    });
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    return new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-3-small",
    });
  }
}

// Initialize ChromaDB client
async function initChromaDB() {
  try {
    const client = new ChromaClient({
      path: process.env.CHROMA_PERSIST_DIRECTORY || "./chroma_db",
    });

    console.log("✅ ChromaDB client initialized");
    return client;
  } catch (error) {
    console.error("❌ ChromaDB initialization failed:", error.message);
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

// Process documents into chunks
async function processDocuments(documents) {
  console.log("📄 Processing documents for chunking...");

  const textSplitter = createTextSplitter();
  const allChunks = [];

  for (const doc of documents) {
    console.log(
      `🔍 Processing: ${doc.metadata.category} (${doc.metadata.wordCount} words)`
    );

    // Split document into chunks
    const chunks = await textSplitter.splitDocuments([doc]);

    // Add chunk index to metadata
    chunks.forEach((chunk, index) => {
      chunk.metadata.chunk_index = index;
      chunk.metadata.total_chunks = chunks.length;
      chunk.metadata.chunk_id = `${doc.metadata.id}_chunk_${index}`;
    });

    allChunks.push(...chunks);
    console.log(`  ✅ Created ${chunks.length} chunks`);
  }

  console.log(`📊 Total chunks created: ${allChunks.length}`);
  return allChunks;
}

// Store chunks in ChromaDB using LangChain
async function storeChunks(chunks, embeddings, client) {
  console.log("💾 Storing chunks in ChromaDB...");

  try {
    // Create ChromaDB vector store using LangChain
    const vectorStore = await Chroma.fromDocuments(chunks, embeddings, {
      collectionName: COLLECTION_NAME,
      client: client,
    });

    console.log("✅ Chunks stored successfully in ChromaDB");

    // Get collection stats
    const collection = await client.getCollection({
      name: COLLECTION_NAME,
    });
    const count = await collection.count();

    console.log(`📊 Total chunks in database: ${count}`);
    return vectorStore;
  } catch (error) {
    console.error("❌ Failed to store chunks:", error.message);
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
      ai_provider: AI_PROVIDER,
      embedding_model:
        AI_PROVIDER === "gemini"
          ? "text-embedding-004"
          : "text-embedding-3-small",
    },
  };

  // Process chunks in batches
  const batchSize = 5;

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
        await new Promise((resolve) => setTimeout(resolve, 200));
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
  console.log("🚀 Starting Stripe documentation ingestion with LangChain...");

  try {
    // Initialize embeddings
    console.log(`🤖 Initializing ${AI_PROVIDER.toUpperCase()} embeddings...`);
    const embeddings = initEmbeddings();

    // Load documents
    const documents = await loadDocuments();

    // Process documents into chunks
    const chunks = await processDocuments(documents);

    // Try ChromaDB first, fallback to local storage
    try {
      console.log("🗄️ Attempting to use ChromaDB...");
      const client = await initChromaDB();
      await storeChunks(chunks, embeddings, client);
      console.log("✅ ChromaDB storage completed successfully!");
    } catch (chromaError) {
      console.log("⚠️ ChromaDB unavailable, using local storage...");
      console.log(`   Reason: ${chromaError.message}`);
      await storeChunksLocally(chunks, embeddings);
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
