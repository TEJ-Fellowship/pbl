//Reads all JSON files in /data, merges them, splits long text fields into overlapping chunks,
// and saves the formatted output to /output/chunks.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputDir = path.resolve(__dirname, "./data");
const outputDir = path.resolve(__dirname, "./chunkData");
const outputFile = "chunks.json";

// Chunking parameters
const chunkSize = 800; // Number of characters per chunk
const chunkOverlap = 200; // Overlap for context continuity

// Utility: log with timestamp
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Step 1: Load and merge all JSON files from /data
async function loadAllJSON() {
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".json"));
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
    let rawText;

    // PRIORITY: Special handling for fee table structures (from paypal fees JSON files)
    // Check for table structure FIRST, as it contains the actual fee data
    if (entry.headers && entry.rows && Array.isArray(entry.rows)) {
      // Convert table structure to readable text format
      const tableLines = [];

      // Add description if available
      if (entry.description) {
        tableLines.push(entry.description);
      }

      // Add headers
      if (entry.headers && entry.headers.length > 0) {
        tableLines.push(`Headers: ${entry.headers.join(" | ")}`);
      }

      // Add rows with data - this is the CRITICAL fee information
      entry.rows.forEach((row, idx) => {
        if (typeof row === "object" && row !== null) {
          const rowText = entry.headers
            ? entry.headers
                .map((header, i) => {
                  const value = row[header] || Object.values(row)[i] || "";
                  return `${header}: ${value}`;
                })
                .join(", ")
            : Object.entries(row)
                .map(([key, val]) => `${key}: ${val}`)
                .join(", ");
          tableLines.push(`Row ${idx + 1}: ${rowText}`);
        } else {
          tableLines.push(`Row ${idx + 1}: ${row}`);
        }
      });

      rawText = tableLines.join("\n");
    } else {
      // Fallback to standard fields (text, content, description)
      rawText = entry.text || entry.content || entry.description;
    }

    // Final fallback to JSON stringify if still no text
    if (!rawText) {
      rawText = JSON.stringify(entry);
    }

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
