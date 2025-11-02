import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import pool from "./src/database.js";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "";

// Consumer fee file to process
const CONSUMER_FILE = "paypal_consumer_fees.json";

// Resize vector function
function resizeVector768to1024(vector768) {
  const vector1024 = [...vector768];
  const extra = 1024 - 768;
  for (let i = 0; i < extra; i++) {
    const scale = 0.1 + (i % 10) * 0.01;
    const sourceIndex = i % 768;
    vector1024.push(vector768[sourceIndex] * scale);
  }
  return vector1024;
}

// Chunk Consumer file with improved table extraction
async function chunkConsumerFile() {
  console.log("📦 Step 1: Chunking Consumer fee file...\n");

  const inputDir = path.resolve(__dirname, "./src/data");
  const filePath = path.join(inputDir, CONSUMER_FILE);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${CONSUMER_FILE}`);
    process.exit(1);
  }

  console.log(`Processing ${CONSUMER_FILE}...`);

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const entries = Array.isArray(data) ? data : [data];

  // Initialize RecursiveCharacterTextSplitter for proper table chunking
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  const allChunks = [];

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    // PRIORITY: Special handling for fee table structures
    // Convert table to structured text format, then use RecursiveCharacterTextSplitter
    if (
      entry.headers &&
      entry.rows &&
      Array.isArray(entry.rows) &&
      entry.rows.length > 0
    ) {
      // Convert entire table structure to well-formatted text
      const tableLines = [];

      // Add context keywords for better semantic search matching
      // Detect table type from headers/description to add relevant keywords
      const headersLower =
        entry.headers?.map((h) => h.toLowerCase()).join(" ") || "";
      const descriptionLower = (entry.description || "").toLowerCase();
      const contextKeywords = [];

      // Add context keywords based on table content
      if (/donation|donate/i.test(descriptionLower + headersLower)) {
        contextKeywords.push(
          "PayPal consumer fees",
          "donation fees",
          "charity donations"
        );
      }
      if (/currency|conversion/i.test(descriptionLower + headersLower)) {
        contextKeywords.push(
          "currency conversion fees",
          "PayPal consumer fees"
        );
      }
      if (/crypto|cryptocurrency/i.test(descriptionLower + headersLower)) {
        contextKeywords.push(
          "cryptocurrency fees",
          "PayPal consumer fees",
          "crypto transaction fees"
        );
      }
      if (/transfer|withdrawal|send/i.test(descriptionLower + headersLower)) {
        contextKeywords.push(
          "transfer fees",
          "PayPal consumer fees",
          "sending money fees"
        );
      }
      if (/payment.*method|card/i.test(descriptionLower + headersLower)) {
        contextKeywords.push(
          "payment method fees",
          "PayPal consumer fees",
          "card fees"
        );
      }

      // Always add base context if not already included
      if (contextKeywords.length === 0) {
        contextKeywords.push("PayPal consumer fees");
      }

      // Add context keywords at the beginning for better semantic matching
      if (contextKeywords.length > 0) {
        tableLines.push(
          `PayPal Consumer Fees Information: ${contextKeywords.join(", ")}`
        );
        tableLines.push(""); // Empty line for readability
      }

      // Add description/context if available
      if (entry.description) {
        tableLines.push(entry.description);
        tableLines.push(""); // Empty line for readability
      }

      // Add table headers for context
      if (entry.headers && entry.headers.length > 0) {
        tableLines.push(`Table Headers: ${entry.headers.join(" | ")}`);
        tableLines.push(""); // Empty line for readability
      }

      // Add all rows with proper formatting - preserve structure and newlines
      entry.rows.forEach((row, rowIdx) => {
        if (typeof row === "object" && row !== null) {
          // Build row text with proper formatting
          let rowText = "";
          if (entry.headers && entry.headers.length > 0) {
            // Use headers to map values - preserve original formatting
            const rowParts = entry.headers
              .map((header) => {
                const value = row[header] || "";
                // Preserve newlines in values for better context (don't replace)
                // Only normalize excessive whitespace
                const cleanValue = String(value)
                  .replace(/\n{3,}/g, "\n\n")
                  .trim();
                return `${header}: ${cleanValue}`;
              })
              .filter((item) => {
                // Only include non-empty values
                const colonIndex = item.indexOf(":");
                if (colonIndex === -1) return false;
                const value = item.substring(colonIndex + 1).trim();
                return value.length > 0;
              });

            rowText = rowParts.join("\n");
          } else {
            // Fallback to object entries
            rowText = Object.entries(row)
              .map(([key, val]) => {
                const cleanVal = String(val)
                  .replace(/\n{3,}/g, "\n\n")
                  .trim();
                return `${key}: ${cleanVal}`;
              })
              .join("\n");
          }

          // Skip empty rows
          if (!rowText || rowText.trim() === "") return;

          // Format row with clear separation
          tableLines.push(`Row ${rowIdx + 1}:`);
          tableLines.push(rowText);
          tableLines.push(""); // Empty line between rows for readability
        }
      });

      // Combine all table text
      const tableText = tableLines.join("\n").trim();

      if (!tableText || tableText.length === 0) {
        // Empty table - create minimal chunk with description
        if (entry.description) {
          allChunks.push({
            source: CONSUMER_FILE,
            original_index: index,
            chunk_index: 0,
            text: entry.description,
          });
          console.log(`  → Table [${index}] → 1 chunk (empty table)`);
        }
        continue;
      }

      // Use RecursiveCharacterTextSplitter to chunk the table text properly
      // This maintains context overlap and handles long rows correctly
      try {
        const chunks = await splitter.splitText(tableText);

        chunks.forEach((chunk, chunkIdx) => {
          if (chunk && chunk.trim() !== "") {
            allChunks.push({
              source: CONSUMER_FILE,
              original_index: index,
              chunk_index: chunkIdx,
              text: chunk,
            });
          }
        });

        if (chunks.length > 1) {
          console.log(
            `  → Table [${index}] → ${chunks.length} chunks (using RecursiveCharacterTextSplitter)`
          );
        } else if (chunks.length === 1) {
          console.log(`  → Table [${index}] → 1 chunk`);
        }
      } catch (error) {
        console.error(`  ❌ Error chunking table [${index}]:`, error.message);
        // Fallback: use table text as single chunk
        allChunks.push({
          source: CONSUMER_FILE,
          original_index: index,
          chunk_index: 0,
          text: tableText,
        });
        console.log(`  → Table [${index}] → 1 chunk (fallback)`);
      }
    } else if (
      entry.headers &&
      entry.rows &&
      Array.isArray(entry.rows) &&
      entry.rows.length === 0
    ) {
      // Table with empty rows - create minimal chunk with just description
      if (entry.description) {
        allChunks.push({
          source: CONSUMER_FILE,
          original_index: index,
          chunk_index: 0,
          text: entry.description,
        });
        console.log(`  → Table [${index}] → 1 chunk (empty table)`);
      }
    } else {
      // For non-table entries or entries without rows, use RecursiveCharacterTextSplitter
      let rawText =
        entry.text ||
        entry.content ||
        entry.description ||
        JSON.stringify(entry);

      if (!rawText || rawText.trim() === "") continue;

      try {
        const chunks = await splitter.splitText(rawText);
        chunks.forEach((chunk, chunkIdx) => {
          if (chunk && chunk.trim() !== "") {
            allChunks.push({
              source: CONSUMER_FILE,
              original_index: index,
              chunk_index: chunkIdx,
              text: chunk,
            });
          }
        });

        if (chunks.length > 1) {
          console.log(`  → Entry [${index}] → ${chunks.length} chunks`);
        } else if (chunks.length === 1) {
          console.log(`  → Entry [${index}] → 1 chunk`);
        }
      } catch (error) {
        console.error(`  ❌ Error chunking entry [${index}]:`, error.message);
        // Fallback: use entry as single chunk
        allChunks.push({
          source: CONSUMER_FILE,
          original_index: index,
          chunk_index: 0,
          text: rawText,
        });
      }
    }
  }

  console.log(`\n✅ Created ${allChunks.length} new Consumer chunks\n`);
  return allChunks;
}

// Delete old Consumer chunks from Pinecone
async function deleteOldConsumerChunksFromPinecone(index) {
  console.log("🗑️  Step 2: Deleting old Consumer chunks from Pinecone...\n");

  try {
    const idsToDelete = [];

    // Generate potential old IDs (with reasonable index ranges)
    for (let origIdx = 0; origIdx < 100; origIdx++) {
      for (let chunkIdx = 0; chunkIdx < 20; chunkIdx++) {
        idsToDelete.push(`${CONSUMER_FILE}:${origIdx}:${chunkIdx}`);
      }
    }

    // Delete in batches
    const deleteBatchSize = 1000;
    for (let i = 0; i < idsToDelete.length; i += deleteBatchSize) {
      const batch = idsToDelete.slice(i, i + deleteBatchSize);
      try {
        await index.namespace(PINECONE_NAMESPACE).deleteMany(batch);
      } catch (error) {
        if (!error.message.includes("not found")) {
          console.log(
            `   ⚠️  Error deleting batch (may not exist): ${error.message}`
          );
        }
      }
    }

    console.log(
      `✅ Attempted to delete old Consumer chunks (upsert will overwrite remaining)\n`
    );
    return true;
  } catch (error) {
    console.error("❌ Error deleting from Pinecone:", error.message);
    console.log("   Continuing anyway - upsert will overwrite...\n");
    return false;
  }
}

// Delete old Consumer chunks from PostgreSQL
async function deleteOldConsumerChunksFromPostgreSQL(client) {
  console.log("🗑️  Step 3: Deleting old Consumer chunks from PostgreSQL...\n");

  try {
    const result = await client.query(
      "DELETE FROM chunks WHERE source_file = $1",
      [CONSUMER_FILE]
    );
    console.log(
      `✅ Deleted old chunks for ${CONSUMER_FILE} (${result.rowCount} rows)\n`
    );
    return true;
  } catch (error) {
    console.error("❌ Error deleting from PostgreSQL:", error.message);
    return false;
  }
}

// Insert new chunks into PostgreSQL
async function insertChunksToPostgreSQL(client, chunks) {
  console.log("💾 Step 4: Inserting new chunks into PostgreSQL...\n");

  try {
    let inserted = 0;
    for (const chunk of chunks) {
      await client.query(
        "INSERT INTO chunks (source_file, original_index, chunk_index, text, text_search_vector) VALUES ($1, $2, $3, $4, to_tsvector($4))",
        [chunk.source, chunk.original_index, chunk.chunk_index, chunk.text]
      );
      inserted++;

      if (inserted % 50 === 0) {
        console.log(`  → Inserted ${inserted}/${chunks.length} chunks...`);
      }
    }
    console.log(`✅ Inserted ${inserted} chunks into PostgreSQL\n`);
    return true;
  } catch (error) {
    console.error("❌ Error inserting to PostgreSQL:", error.message);
    return false;
  }
}

// Embed and upsert chunks to Pinecone
async function embedAndUpsertToPinecone(chunks, index) {
  console.log("🚀 Step 5: Embedding and upserting to Pinecone...\n");

  try {
    console.log("🔧 Loading embedding model...");
    const embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-mpnet-base-v2"
    );
    console.log("✅ Model loaded!\n");

    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          chunks.length / batchSize
        )}`
      );

      const vectors = [];

      for (const chunk of batch) {
        try {
          const output = await embedder(chunk.text, {
            pooling: "mean",
            normalize: true,
          });
          const embedding768 = Array.from(output.data);
          const embedding1024 = resizeVector768to1024(embedding768);

          const vectorId = `${chunk.source}:${chunk.original_index}:${chunk.chunk_index}`;

          vectors.push({
            id: vectorId,
            values: embedding1024,
            metadata: {
              source: chunk.source,
              original_index: chunk.original_index,
              chunk_index: chunk.chunk_index,
              text: chunk.text,
              preview: chunk.text.slice(0, 200) + "...",
            },
          });
        } catch (error) {
          console.error(`❌ Error embedding chunk:`, error.message);
        }
      }

      if (vectors.length > 0) {
        await index.namespace(PINECONE_NAMESPACE).upsert(vectors);
        processed += vectors.length;
        console.log(`✅ Upserted ${processed}/${chunks.length} chunks\n`);
      }
    }

    console.log("🎉 Pinecone embedding complete!\n");
    return true;
  } catch (error) {
    console.error("❌ Error embedding to Pinecone:", error.message);
    return false;
  }
}

// Main function
async function main() {
  const client = await pool.connect();

  try {
    console.log("═══════════════════════════════════════════════════");
    console.log("   Chunk & Embed Consumer Fees Only");
    console.log("═══════════════════════════════════════════════════\n");

    // Step 1: Chunk Consumer file
    const newChunks = await chunkConsumerFile();

    if (newChunks.length === 0) {
      console.log("❌ No chunks created. Exiting.");
      process.exit(1);
    }

    // Initialize Pinecone
    console.log("🔌 Connecting to Pinecone...");
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(PINECONE_INDEX);
    console.log("✅ Connected!\n");

    // Step 2: Delete from Pinecone
    await deleteOldConsumerChunksFromPinecone(index);

    // Step 3: Delete from PostgreSQL
    await deleteOldConsumerChunksFromPostgreSQL(client);

    // Step 4: Insert new chunks to PostgreSQL
    await insertChunksToPostgreSQL(client, newChunks);

    // Step 5: Embed and upsert to Pinecone
    await embedAndUpsertToPinecone(newChunks, index);

    console.log("═══════════════════════════════════════════════════");
    console.log("   ✅ All Done! Consumer fees chunked and embedded");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
