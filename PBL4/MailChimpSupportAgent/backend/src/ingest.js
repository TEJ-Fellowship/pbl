import fs from "fs/promises";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";

// ---------------- CONFIG ----------------
const CHUNK_SIZE = parseInt(config.CHUNK_SIZE) || 600;
const CHUNK_OVERLAP = parseInt(config.CHUNK_OVERLAP) || 100;
const BATCH_SIZE = parseInt(config.BATCH_SIZE) || 50;
const SCRAPED_PATH = path.resolve("./data/mailerbyte_docs/scraped.json");
const OUTPUT_PATH = path.resolve("./data/processed_chunks/chunks.json");

// ---------------- INITIALIZERS ----------------
function initEmbeddings() {
  if (!config.GEMINI_API_KEY)
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

async function initPinecone() {
  if (!config.PINECONE_API_KEY)
    throw new Error("Missing PINECONE_API_KEY in environment variables");

  const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
  console.log("Pinecone client initialized");
  return pinecone;
}

// ---------------- LOAD DOCUMENTS ----------------
async function loadDocuments() {
  console.log("Loading scraped Mailchimp docs...");
  const data = await fs.readFile(SCRAPED_PATH, "utf-8");
  const scrapedDocs = JSON.parse(data);

  const documents = scrapedDocs.flatMap((doc) =>
    doc.sections.map(
      (section) =>
        new Document({
          pageContent: section.content || "",
          metadata: {
            title: doc.title,
            category: doc.category,
            heading: section.heading,
            url: doc.url,
            scrapedAt: doc.scrapedAt,
            sectionType:
              section.heading === doc.title ? "introduction" : "content",
          },
        })
    )
  );

  console.log(`Loaded ${documents.length} total sections`);
  return documents;
}

// ---------------- CHUNKING ----------------
function createTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", " ", ""],
  });
}

async function processDocuments(documents) {
  console.log("Splitting documents into chunks...");
  const splitter = createTextSplitter();
  const allChunks = [];

  for (const doc of documents) {
    const splits = await splitter.splitDocuments([doc]);
    splits.forEach((chunk, i) => {
      chunk.metadata.chunk_id = `${doc.metadata.title}_${i}`;
      chunk.metadata.tokenCount = Math.round(chunk.pageContent.length / 4);
    });
    allChunks.push(...splits);
  }

  console.log(`Total chunks created: ${allChunks.length}`);
  return allChunks;
}

// ---------------- CATEGORY + DIFFICULTY ----------------
function mapCategory(
  category = "",
  heading = "",
  content = "",
  sectionType = ""
) {
  const cat = category.toLowerCase();
  const combined = `${heading} ${content}`.toLowerCase();

  if (sectionType === "introduction") {
    if (cat.includes("gettingstarted")) return "getting-started";
    if (cat.includes("campaign")) return "campaigns";
    if (cat.includes("list") || cat.includes("audience")) return "audience";
    return "general";
  }

  if (combined.includes("automation")) return "automation";
  if (cat.includes("campaign")) return "campaigns";
  if (cat.includes("list") || cat.includes("audience")) return "audience";
  return "general";
}

function mapDifficulty(
  category = "",
  tokenCount = 0,
  content = "",
  sectionType = ""
) {
  const text = content.toLowerCase();
  
  // Beginner indicators
  if (sectionType === "introduction" || 
      category.includes("gettingstarted") ||
      text.includes("getting started") ||
      text.includes("first time") ||
      text.includes("beginner") ||
      text.includes("basic") ||
      text.includes("setup") ||
      text.includes("create account") ||
      tokenCount < 100) {
    return "beginner";
  }
  
  // Advanced indicators
  if (text.includes("api") || 
      text.includes("developer") || 
      text.includes("advanced") ||
      text.includes("integration") ||
      text.includes("custom") ||
      text.includes("automation") ||
      text.includes("workflow") ||
      text.includes("segment") ||
      text.includes("analytics") ||
      tokenCount >= 150) {
    return "advanced";
  }
  
  // Intermediate for everything else
  return "intermediate";
}

// ---------------- STORE IN PINECONE ----------------
async function storeChunks(chunks, embeddings, pinecone) {
  console.log("Storing chunks in Pinecone...");
  const index = pinecone.Index(config.PINECONE_INDEX_NAME);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const vectors = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await embeddings.embedQuery(chunk.pageContent);
        const m = chunk.metadata;
        return {
          id: m.chunk_id,
          values: embedding,
          metadata: {
            ...m,
            category: mapCategory(
              m.category,
              m.heading,
              chunk.pageContent,
              m.sectionType
            ),
            difficulty: mapDifficulty(
              m.category,
              m.tokenCount,
              chunk.pageContent,
              m.sectionType
            ),
          },
        };
      })
    );

    await index.upsert(vectors);
    console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }

  console.log("All chunks stored successfully in Pinecone");
}

// ---------------- LOCAL BACKUP ----------------
async function storeChunksLocally(chunks) {
  // Process chunks with metadata mapping before saving locally
  const processedChunks = chunks.map(chunk => {
    const m = chunk.metadata;
    return {
      ...chunk,
      metadata: {
        ...m,
        category: mapCategory(
          m.category,
          m.heading,
          chunk.pageContent,
          m.sectionType
        ),
        difficulty: mapDifficulty(
          m.category,
          m.tokenCount,
          chunk.pageContent,
          m.sectionType
        ),
      }
    };
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(processedChunks, null, 2), "utf-8");
  console.log(`Chunks saved locally to ${OUTPUT_PATH}`);
}

// ---------------- MAIN ----------------
async function main() {
  console.log("Starting Mailchimp ingestion pipeline...");

  try {
    const embeddings = initEmbeddings();
    const documents = await loadDocuments();
    const chunks = await processDocuments(documents);

    try {
      const pinecone = await initPinecone();
      await storeChunks(chunks, embeddings, pinecone);
    } catch (pineconeError) {
      console.log("Pinecone unavailable — saving locally instead...");
      console.log(`Reason: ${pineconeError.message}`);
      await storeChunksLocally(chunks);
    }

    console.log(`Ingestion complete! ${chunks.length} chunks processed.`);
  } catch (error) {
    console.error("Ingestion failed:", error.message);
    process.exit(1);
  }
}

if (process.argv[1].endsWith("ingest.js")) main();
