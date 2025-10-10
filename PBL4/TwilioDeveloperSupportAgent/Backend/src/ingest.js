// backend/src/ingest.js
import fs from "fs/promises";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";
import { processDocItem } from "./chunkDoc_v2.js";

// ----------------- Tier2 helpers -----------------

// Detect if a chunk looks like code
function isCodeBlock(content) {
  if (!content) return false;
  const c = content.trim();
  // quick heuristics: code fences, typical code tokens, CLI commands
  if (/^```/.test(c) || /```/.test(c)) return true;
  if (
    /(const |let |var |function |=>|console\.log|module\.exports|import |export )/.test(
      c
    )
  )
    return true;
  if (/(def |class |print\(|import |from )/.test(c)) return true;
  if (/<\?php|->|echo |composer require/.test(c)) return true;
  if (/curl |-X POST|--header|wget |npm install|pip install|docker /.test(c))
    return true;
  return false;
}

// Rough language detector (fallback to 'text')
function detectLanguage(content) {
  if (!content) return "text";
  const s = content.slice(0, 500).toLowerCase();
  if (/\b(def |import |from |print\(|flask|django)\b/.test(s)) return "python";
  if (
    /\b(const |let |var |function |console\.log|require\(|module\.exports|=>)\b/.test(
      s
    )
  )
    return "javascript";
  if (/\bnamespace |using |public class\b/.test(s)) return "csharp";
  if (/<\?php\b|composer require\b|->\b/.test(s)) return "php";
  if (/\b(public |class |System\.out)\b/.test(s)) return "java";
  if (/\bcurl\b|--header|-X POST|wget\b/.test(s)) return "bash";
  return "text";
}

// Extract Twilio-like error codes (e.g., 30001, 21211, 2\d{4} or 5-digit codes)
function extractErrorCodes(content = "") {
  const matches = content.match(/\b(2\d{4}|\d{5})\b/g) || [];
  // unique and return
  return Array.from(new Set(matches));
}

// Optional: infer api from URL or category
function inferApiFromDocMetadata(docMeta = {}) {
  const url = (docMeta.source || "").toLowerCase();
  const cat = (docMeta.category || "").toLowerCase();
  if (url.includes("/sms")) return "sms";
  if (url.includes("/voice")) return "voice";
  if (url.includes("/whatsapp")) return "whatsapp";
  if (url.includes("/video")) return "video";
  if (cat.includes("errors") || url.includes("/api/errors")) return "errors";
  if (cat.includes("quickstart") || url.includes("quickstart"))
    return "quickstart";
  return docMeta.api || "twilio";
}
// ----------------- end helpers -----------------

// Configuration
const CHUNK_SIZE = parseInt(config.CHUNK_SIZE) || 800;
const CHUNK_OVERLAP = parseInt(config.CHUNK_OVERLAP) || 100;
const COLLECTION_NAME = "twilio_docs";
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

// Load and process documents using chunkDoc_v2 system
async function loadDocuments() {
  console.log("📂 Loading scraped documents...");

  const scrapedDataPath = path.join(
    process.cwd(),
    "data",
    "twilio_docs",
    "scraped.json"
  );

  const scrapedData = JSON.parse(await fs.readFile(scrapedDataPath, "utf-8"));
  console.log(`📊 Found ${scrapedData.length} documents to process`);

  // Process documents using chunkDoc_v2 system
  const allChunks = [];
  scrapedData.forEach((doc, idx) => {
    try {
      const { textChunks, codeChunks } = processDocItem(doc);
      // Combine text and code chunks
      [...textChunks, ...codeChunks].forEach((chunk) => {
        allChunks.push(
          new Document({
            pageContent: chunk.content,
            metadata: {
              chunkId: chunk.id,
              source: chunk.url,
              title: chunk.title,
              category: doc.category,
              docType: doc.docType,
              wordCount: doc.wordCount,
              scrapedAt: chunk.scrapedAt,
              id: doc.id,
              // Tier 2 metadata from chunkDoc_v2
              type: chunk.type, // "text" or "code"
              language: chunk.language,
              api: chunk.api,
              version: chunk.version,
              errorCodes: chunk.errorCodes,
            },
          })
        );
      });
    } catch (err) {
      console.warn(
        `⚠️ Failed processing doc ${doc.url || idx}: ${err.message}`
      );
    }
  });

  console.log(`📊 Created ${allChunks.length} chunks using chunkDoc_v2 system`);
  return allChunks;
}

// Process documents into chunks (now using chunkDoc_v2 system)
async function processDocuments(documents) {
  console.log("📄 Processing documents for embedding...");

  // Documents are already chunked by chunkDoc_v2, just need to prepare for embedding
  const allChunks = documents.map((chunk, index) => {
    // Add additional metadata for embedding storage
    chunk.metadata.chunk_index = index;
    chunk.metadata.total_chunks = documents.length;
    chunk.metadata.chunk_id =
      chunk.metadata.chunkId || `${chunk.metadata.id}_chunk_${index}`;

    return chunk;
  });

  console.log(`📊 Total chunks ready for embedding: ${allChunks.length}`);
  console.log(
    `   📄 Text chunks: ${
      allChunks.filter((c) => c.metadata.type === "text").length
    }`
  );
  console.log(
    `   💻 Code chunks: ${
      allChunks.filter((c) => c.metadata.type === "code").length
    }`
  );

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
          title: chunk.metadata.title,
          category: chunk.metadata.category,
          docType: chunk.metadata.docType,
          chunk_index: chunk.metadata.chunk_index,
          total_chunks: chunk.metadata.total_chunks,
          // Tier 2 metadata from chunkDoc_v2
          type: chunk.metadata.type, // "text" or "code"
          language: chunk.metadata.language,
          api: chunk.metadata.api,
          version: chunk.metadata.version,
          error_codes: chunk.metadata.errorCodes || [],
          // optional
          created_at: new Date().toISOString(),
          total_chunks: chunks.length,
          ai_provider: "gemini",
          embedding_model: "text-embedding-004",
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
          metadata: {
            ...chunk.metadata, // preserves all enriched metadata from chunkDoc_v2
            type: chunk.metadata.type, // "text" or "code"
            language: chunk.metadata.language,
            api: chunk.metadata.api,
            version: chunk.metadata.version,
            errorCodes: chunk.metadata.errorCodes || [],
          },
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
  console.log("🚀 Starting Twilio documentation ingestion with Gemini...");

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
