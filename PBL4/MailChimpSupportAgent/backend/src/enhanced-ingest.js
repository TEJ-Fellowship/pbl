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
const SCRAPED_PATH = path.resolve("../data/mailerbyte_docs/scraped.json");
const OUTPUT_PATH = path.resolve(
  "../data/processed_chunks/enhanced_chunks.json"
);

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

// ---------------- ENHANCED CONTENT PROCESSING ----------------
function extractScreenshots($, element) {
  const screenshots = [];

  // Look for images with alt text or captions
  element.find("img").each((_, img) => {
    const $img = $(img);
    const src = $img.attr("src");
    const alt = $img.attr("alt") || "";
    const caption =
      $img.next("figcaption").text().trim() ||
      $img.parent("figure").find("figcaption").text().trim();

    if (src && (alt || caption)) {
      screenshots.push({
        src: src.startsWith("http") ? src : `https://mailchimp.com${src}`,
        alt: alt,
        caption: caption,
        description: caption || alt,
      });
    }
  });

  return screenshots;
}

function extractNumberedLists($, element) {
  const lists = [];

  // Extract ordered lists (ol) and their context
  element.find("ol").each((_, ol) => {
    const $ol = $(ol);
    const listItems = [];

    $ol.find("li").each((_, li) => {
      const itemText = $(li).text().trim();
      if (itemText) {
        listItems.push(itemText);
      }
    });

    if (listItems.length > 0) {
      // Get context before the list
      const context = $ol.prevAll("p, h3, h4").first().text().trim();

      lists.push({
        type: "numbered",
        context: context,
        items: listItems,
        count: listItems.length,
      });
    }
  });

  return lists;
}

function extractBulletPoints($, element) {
  const lists = [];

  // Extract unordered lists (ul) and their context
  element.find("ul").each((_, ul) => {
    const $ul = $(ul);
    const listItems = [];

    $ul.find("li").each((_, li) => {
      const itemText = $(li).text().trim();
      if (itemText) {
        listItems.push(itemText);
      }
    });

    if (listItems.length > 0) {
      // Get context before the list
      const context = $ul.prevAll("p, h3, h4").first().text().trim();

      lists.push({
        type: "bulleted",
        context: context,
        items: listItems,
        count: listItems.length,
      });
    }
  });

  return lists;
}

function enhanceContentWithStructure($, element, originalContent) {
  const screenshots = extractScreenshots($, element);
  const numberedLists = extractNumberedLists($, element);
  const bulletPoints = extractBulletPoints($, element);

  // Create enhanced content that preserves structure
  let enhancedContent = originalContent;

  // Add screenshot references
  if (screenshots.length > 0) {
    enhancedContent += "\n\n[Screenshots in this section:]\n";
    screenshots.forEach((screenshot, index) => {
      enhancedContent += `${index + 1}. ${screenshot.description}\n`;
    });
  }

  // Add numbered list context
  if (numberedLists.length > 0) {
    enhancedContent += "\n\n[Step-by-step instructions:]\n";
    numberedLists.forEach((list, listIndex) => {
      if (list.context) {
        enhancedContent += `\n${list.context}:\n`;
      }
      list.items.forEach((item, itemIndex) => {
        enhancedContent += `${itemIndex + 1}. ${item}\n`;
      });
    });
  }

  // Add bullet point context
  if (bulletPoints.length > 0) {
    enhancedContent += "\n\n[Key points:]\n";
    bulletPoints.forEach((list, listIndex) => {
      if (list.context) {
        enhancedContent += `\n${list.context}:\n`;
      }
      list.items.forEach((item, itemIndex) => {
        enhancedContent += `• ${item}\n`;
      });
    });
  }

  return {
    enhancedContent,
    metadata: {
      screenshots,
      numberedLists,
      bulletPoints,
      hasScreenshots: screenshots.length > 0,
      hasNumberedLists: numberedLists.length > 0,
      hasBulletPoints: bulletPoints.length > 0,
      totalSteps: numberedLists.reduce((sum, list) => sum + list.count, 0),
      totalPoints: bulletPoints.reduce((sum, list) => sum + list.count, 0),
    },
  };
}

// ---------------- LOAD AND PROCESS DOCUMENTS ----------------
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

// ---------------- ENHANCED CHUNKING ----------------
function createEnhancedTextSplitter() {
  return new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: [
      "\n\n\n", // Triple newlines (major sections)
      "\n\n", // Double newlines (paragraphs)
      "\n", // Single newlines
      ". ", // Sentences
      " ", // Words
      "", // Characters
    ],
    keepSeparator: true,
  });
}

async function processDocumentsWithStructure(documents) {
  console.log("Processing documents with enhanced structure preservation...");
  const splitter = createEnhancedTextSplitter();
  const allChunks = [];

  for (const doc of documents) {
    // Parse the HTML content to extract structure
    const cheerio = await import("cheerio");
    const $ = cheerio.load(`<div>${doc.pageContent}</div>`);

    // Enhance content with structure information
    const enhanced = enhanceContentWithStructure($, $("div"), doc.pageContent);

    // Create a new document with enhanced content
    const enhancedDoc = new Document({
      pageContent: enhanced.enhancedContent,
      metadata: {
        ...doc.metadata,
        ...enhanced.metadata,
      },
    });

    const splits = await splitter.splitDocuments([enhancedDoc]);
    splits.forEach((chunk, i) => {
      chunk.metadata.chunk_id = `${doc.metadata.title}_${i}`;
      chunk.metadata.tokenCount = Math.round(chunk.pageContent.length / 4);
      chunk.metadata.chunkIndex = i;
      chunk.metadata.totalChunks = splits.length;
    });
    allChunks.push(...splits);
  }

  console.log(`Total enhanced chunks created: ${allChunks.length}`);
  return allChunks;
}

// ---------------- ENHANCED CATEGORY + DIFFICULTY MAPPING ----------------
function mapEnhancedCategory(
  category = "",
  heading = "",
  content = "",
  sectionType = "",
  metadata = {}
) {
  const cat = category.toLowerCase();
  const combined = `${heading} ${content}`.toLowerCase();

  // Check for automation indicators
  if (
    combined.includes("automation") ||
    combined.includes("workflow") ||
    combined.includes("trigger")
  ) {
    return "automation";
  }

  // Check for campaign indicators
  if (
    cat.includes("campaign") ||
    combined.includes("email") ||
    combined.includes("send")
  ) {
    return "campaigns";
  }

  // Check for audience/list indicators
  if (
    cat.includes("list") ||
    cat.includes("audience") ||
    combined.includes("contact") ||
    combined.includes("import")
  ) {
    return "lists";
  }

  // Check for getting started indicators
  if (
    sectionType === "introduction" ||
    cat.includes("gettingstarted") ||
    combined.includes("setup") ||
    combined.includes("beginner")
  ) {
    return "getting-started";
  }

  return "general";
}

function mapEnhancedDifficulty(
  category = "",
  tokenCount = 0,
  content = "",
  sectionType = "",
  metadata = {}
) {
  const text = content.toLowerCase();

  // Beginner indicators
  if (
    sectionType === "introduction" ||
    category.includes("gettingstarted") ||
    text.includes("getting started") ||
    text.includes("first time") ||
    text.includes("beginner") ||
    text.includes("basic") ||
    text.includes("setup") ||
    text.includes("create account") ||
    tokenCount < 100
  ) {
    return "beginner";
  }

  // Advanced indicators
  if (
    text.includes("api") ||
    text.includes("developer") ||
    text.includes("advanced") ||
    text.includes("integration") ||
    text.includes("custom") ||
    text.includes("automation") ||
    text.includes("workflow") ||
    text.includes("segment") ||
    text.includes("analytics") ||
    text.includes("conditional") ||
    text.includes("trigger") ||
    tokenCount >= 150 ||
    (metadata.hasScreenshots && metadata.totalSteps > 5)
  ) {
    return "advanced";
  }

  // Intermediate for everything else
  return "intermediate";
}

// ---------------- STORE ENHANCED CHUNKS ----------------
async function storeEnhancedChunks(chunks, embeddings, pinecone) {
  console.log("Storing enhanced chunks in Pinecone...");
  const index = pinecone.Index(config.PINECONE_INDEX_NAME);

  // Array to store all vectors for local backup
  const allVectors = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const vectors = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await embeddings.embedQuery(chunk.pageContent);
        const m = { ...chunk.metadata };

        if (m.loc?.lines) {
          m.line_from = m.loc.lines.from;
          m.line_to = m.loc.lines.to;
          delete m.loc;
        }

        return {
          id: m.chunk_id,
          values: embedding,
          metadata: {
            ...m,
            category: mapEnhancedCategory(
              m.category,
              m.heading,
              chunk.pageContent,
              m.sectionType,
              m
            ),
            difficulty: mapEnhancedDifficulty(
              m.category,
              m.tokenCount,
              chunk.pageContent,
              m.sectionType,
              m
            ),
            // Enhanced metadata
            hasStructure:
              m.hasScreenshots || m.hasNumberedLists || m.hasBulletPoints,
            stepCount: m.totalSteps || 0,
            pointCount: m.totalPoints || 0,
            isInstructional: m.hasNumberedLists || m.totalSteps > 0,
            hasVisuals: m.hasScreenshots || false,
          },
        };
      })
    );

    await index.upsert(vectors);
    allVectors.push(...vectors);
    console.log(`Uploaded enhanced batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }

  console.log("All enhanced chunks stored successfully in Pinecone");

  // Save embeddings locally as backup
  await saveEmbeddingsLocally(allVectors);
}

// ---------------- SAVE EMBEDDINGS LOCALLY ----------------
async function saveEmbeddingsLocally(vectors) {
  try {
    console.log("Saving vector embeddings locally...");

    const embeddingsPath = path.resolve(
      "../data/vector_store/enhanced_embeddings.json"
    );

    // Create simplified structure for local storage
    const embeddingsData = vectors.map((vector) => ({
      id: vector.id,
      embedding: vector.values,
      metadata: {
        ...vector.metadata,
        pageContent: vector.metadata.pageContent || "",
      },
    }));

    await fs.mkdir(path.dirname(embeddingsPath), { recursive: true });
    await fs.writeFile(
      embeddingsPath,
      JSON.stringify(embeddingsData, null, 2),
      "utf-8"
    );

    console.log(
      `Saved ${embeddingsData.length} embeddings to ${embeddingsPath}`
    );
    console.log(
      `Vector dimension: ${embeddingsData[0]?.embedding?.length || 0}`
    );
  } catch (error) {
    console.error("Failed to save embeddings locally:", error.message);
    console.log("Pinecone upload completed, but local backup failed");
  }
}

// ---------------- LOCAL BACKUP ----------------
async function storeEnhancedChunksLocally(chunks, embeddings = null) {
  console.log("Saving enhanced chunks locally...");

  // Process chunks with enhanced metadata mapping before saving locally
  const processedChunks = chunks.map((chunk) => {
    const m = chunk.metadata;
    return {
      ...chunk,
      metadata: {
        ...m,
        category: mapEnhancedCategory(
          m.category,
          m.heading,
          chunk.pageContent,
          m.sectionType,
          m
        ),
        difficulty: mapEnhancedDifficulty(
          m.category,
          m.tokenCount,
          chunk.pageContent,
          m.sectionType,
          m
        ),
        // Enhanced metadata
        hasStructure:
          m.hasScreenshots || m.hasNumberedLists || m.hasBulletPoints,
        stepCount: m.totalSteps || 0,
        pointCount: m.totalPoints || 0,
        isInstructional: m.hasNumberedLists || m.totalSteps > 0,
        hasVisuals: m.hasScreenshots || false,
      },
    };
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(processedChunks, null, 2),
    "utf-8"
  );
  console.log(`Enhanced chunks saved locally to ${OUTPUT_PATH}`);

  // Generate and save embeddings locally if embeddings model is available
  if (embeddings) {
    try {
      console.log("Generating embeddings for local storage...");
      const embeddingsData = [];

      // Process in batches to show progress
      for (let i = 0; i < processedChunks.length; i += BATCH_SIZE) {
        const batch = processedChunks.slice(i, i + BATCH_SIZE);

        const batchEmbeddings = await Promise.all(
          batch.map(async (chunk) => {
            try {
              const embedding = await embeddings.embedQuery(chunk.pageContent);
              return {
                id: chunk.metadata.chunk_id,
                embedding: embedding,
                metadata: {
                  ...chunk.metadata,
                  pageContent: chunk.pageContent,
                },
              };
            } catch (error) {
              console.error(
                `Error embedding chunk ${chunk.metadata.chunk_id}:`,
                error.message
              );
              return null;
            }
          })
        );

        embeddingsData.push(...batchEmbeddings.filter((e) => e !== null));
        console.log(
          `  Generated embeddings for batch ${
            Math.floor(i / BATCH_SIZE) + 1
          }/${Math.ceil(processedChunks.length / BATCH_SIZE)}`
        );
      }

      // Save embeddings
      const embeddingsPath = path.resolve(
        "./data/processed_chunks/enhanced_embeddings.json"
      );
      await fs.writeFile(
        embeddingsPath,
        JSON.stringify(embeddingsData, null, 2),
        "utf-8"
      );
      console.log(
        `Saved ${embeddingsData.length} embeddings to ${embeddingsPath}`
      );
      console.log(
        `Vector dimension: ${embeddingsData[0]?.embedding?.length || 0}`
      );
    } catch (error) {
      console.error("Failed to generate embeddings:", error.message);
      console.log("Chunks saved without embeddings");
    }
  } else {
    console.log("No embeddings model provided, skipping embedding generation");
  }
}

// ---------------- MAIN ----------------
async function main() {
  console.log("Starting enhanced Mailchimp ingestion pipeline...");
  console.log(
    "Features: Screenshot preservation, numbered lists, step-by-step instructions, vector embeddings"
  );

  try {
    const embeddings = initEmbeddings();
    const documents = await loadDocuments();
    const chunks = await processDocumentsWithStructure(documents);

    try {
      const pinecone = await initPinecone();
      console.log("Uploading to Pinecone and saving locally...");
      await storeEnhancedChunks(chunks, embeddings, pinecone);
    } catch (pineconeError) {
      console.log("Pinecone unavailable — saving locally instead...");
      console.log(`Reason: ${pineconeError.message}`);
      await storeEnhancedChunksLocally(chunks, embeddings);
    }

    console.log(
      `Enhanced ingestion complete! ${chunks.length} chunks processed.`
    );
    console.log("Enhanced features:");
    console.log("- Screenshot references preserved");
    console.log("- Numbered lists maintained as step-by-step instructions");
    console.log("- Bullet points structured");
    console.log("- Enhanced metadata for better categorization");
  } catch (error) {
    console.error("Enhanced ingestion failed:", error.message);
    process.exit(1);
  }
}

if (process.argv[1].endsWith("enhanced-ingest.js")) main();
