//Reads all JSON files in /data, merges them, splits long text fields into overlapping chunks,
 // and saves the formatted output to /output/chunks.json
import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Configuration
const inputDir = "./data";
const outputDir = "./data";
const outputFile = "chunks.json";

// Chunking parameters
const chunkSize = 800;      // Number of characters per chunk
const chunkOverlap = 200;    // Overlap for context continuity

// Utility: log with timestamp
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Step 1: Load and merge all JSON files from /data
async function loadAllJSON() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".json"));
  if (files.length === 0) throw new Error("No JSON files found in /data");

  log(`Found ${files.length} JSON files in /data`);

  const merged = [];

  for (const file of files) {
    const fullPath = path.join(inputDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      log(`Skipping invalid JSON: ${file}`);
      continue;
    }

    if (!Array.isArray(data)) {
      log(`File ${file} is not an array. Wrapping in array.`);
      data = [data];
    }

    data.forEach((item, index) => {
      merged.push({
        source: file,
        original_index: index,
        ...item,
      });
    });
  }

  log(`Merged total ${merged.length} JSON entries`);
  return merged;
}

// Step 2: Chunk merged content
async function createChunks(entries) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const allChunks = [];

  for (const entry of entries) {
    // Choose which field to chunk (e.g., text, content, description)
    const rawText =
      entry.text ||
      entry.content ||
      entry.description ||
      JSON.stringify(entry);

    if (!rawText || rawText.trim() === "") continue;

    const chunks = await splitter.splitText(rawText);

    chunks.forEach((chunk, idx) => {
      allChunks.push({
        source: entry.source,
        original_index: entry.original_index,
        chunk_index: idx,
        text: chunk,
      });
    });

    if (chunks.length > 1)
      log(
        `Chunked "${entry.source}" [${entry.original_index}] → ${chunks.length} chunks`
      );
  }

  log(`Total chunks created: ${allChunks.length}`);
  return allChunks;
}

// Step 3: Save chunks to /output
function saveChunks(chunks) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  const outputPath = path.join(outputDir, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2), "utf8");
  log(`Saved chunks to ${outputPath}`);
}

// Run all steps
(async () => {
  try {
    log("Starting chunking process...");
    const entries = await loadAllJSON();
    const chunks = await createChunks(entries);
    saveChunks(chunks);
    log("Done! You can now use chunks.json for embedding or RAG.");
  } catch (err) {
    console.error("Error:", err);
  }
})();
