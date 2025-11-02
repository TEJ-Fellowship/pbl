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

// Braintree fee file to process
const BRAINTREE_FILE = "paypal_braintree_fees.json";

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

// Chunk Braintree file with improved table extraction
async function chunkBraintreeFile() {
  console.log("📦 Step 1: Chunking Braintree fee file...\n");

  const inputDir = path.resolve(__dirname, "./src/data");
  const filePath = path.join(inputDir, BRAINTREE_FILE);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${BRAINTREE_FILE}`);
    process.exit(1);
  }

  console.log(`Processing ${BRAINTREE_FILE}...`);

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const entries = Array.isArray(data) ? data : [data];

  const allChunks = [];

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    // PRIORITY: Special handling for fee table structures
    if (entry.headers && entry.rows && Array.isArray(entry.rows)) {
      // Create ONE chunk per row - this ensures each payment type is independently searchable
      // This fixes the issue where Venmo row might be in a later chunk that's not retrieved
      const braintreeContext =
        "Braintree payment processing fees and transaction rates:";
      const headersText = entry.headers.join(" | ");
      const descriptionText = entry.description || "";

      entry.rows.forEach((row, rowIdx) => {
        if (typeof row === "object" && row !== null) {
          // Build row-specific chunk with full context
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

          // Each chunk contains: context + headers + ONE row
          // This ensures Venmo row is in its own chunk and easily findable
          const chunkText = [
            braintreeContext,
            descriptionText,
            `Headers: ${headersText}`,
            `Payment type data: ${rowText}`,
          ]
            .filter(Boolean)
            .join("\n");

          allChunks.push({
            source: BRAINTREE_FILE,
            original_index: index,
            chunk_index: rowIdx, // Use row index as chunk index
            text: chunkText,
          });
        }
      });

      console.log(`  → Table [${index}] → ${entry.rows.length} row chunks`);
    } else {
      // For non-table entries, use original chunking logic
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 200,
      });

      let rawText =
        entry.text ||
        entry.content ||
        entry.description ||
        JSON.stringify(entry);

      if (!rawText || rawText.trim() === "") continue;

      const chunks = await splitter.splitText(rawText);
      chunks.forEach((chunk, chunkIdx) => {
        allChunks.push({
          source: BRAINTREE_FILE,
          original_index: index,
          chunk_index: chunkIdx,
          text: chunk,
        });
      });

      if (chunks.length > 1) {
        console.log(`  → Entry [${index}] → ${chunks.length} chunks`);
      }
    }
  }

  console.log(`\n✅ Created ${allChunks.length} new Braintree chunks\n`);
  return allChunks;
}

// Delete old Braintree chunks from Pinecone
async function deleteOldBraintreeChunksFromPinecone(index) {
  console.log("🗑️  Step 2: Deleting old Braintree chunks from Pinecone...\n");

  try {
    // Delete old IDs by pattern
    const idsToDelete = [];

    // Generate potential old IDs (with reasonable index ranges)
    for (let origIdx = 0; origIdx < 10; origIdx++) {
      for (let chunkIdx = 0; chunkIdx < 10; chunkIdx++) {
        idsToDelete.push(`${BRAINTREE_FILE}:${origIdx}:${chunkIdx}`);
      }
    }

    // Delete in batches
    const deleteBatchSize = 1000;
    for (let i = 0; i < idsToDelete.length; i += deleteBatchSize) {
      const batch = idsToDelete.slice(i, i + deleteBatchSize);
      try {
        await index.namespace(PINECONE_NAMESPACE).deleteMany(batch);
      } catch (error) {
        // Some IDs might not exist, that's OK
        if (!error.message.includes("not found")) {
          console.log(
            `   ⚠️  Error deleting batch (may not exist): ${error.message}`
          );
        }
      }
    }

    console.log(
      `✅ Attempted to delete old Braintree chunks (upsert will overwrite remaining)\n`
    );
    return true;
  } catch (error) {
    console.error("❌ Error deleting from Pinecone:", error.message);
    console.log("   Continuing anyway - upsert will overwrite...\n");
    return false;
  }
}

// Delete old Braintree chunks from PostgreSQL
async function deleteOldBraintreeChunksFromPostgreSQL(client) {
  console.log("🗑️  Step 3: Deleting old Braintree chunks from PostgreSQL...\n");

  try {
    const result = await client.query(
      "DELETE FROM chunks WHERE source_file = $1",
      [BRAINTREE_FILE]
    );
    console.log(
      `✅ Deleted old chunks for ${BRAINTREE_FILE} (${result.rowCount} rows)`
    );
    console.log("");
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

      if (inserted % 10 === 0) {
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
    console.log("   Chunk & Embed Braintree Fees Only");
    console.log("═══════════════════════════════════════════════════\n");

    // Step 1: Chunk Braintree file
    const newChunks = await chunkBraintreeFile();

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
    await deleteOldBraintreeChunksFromPinecone(index);

    // Step 3: Delete from PostgreSQL
    await deleteOldBraintreeChunksFromPostgreSQL(client);

    // Step 4: Insert new chunks to PostgreSQL
    await insertChunksToPostgreSQL(client, newChunks);

    // Step 5: Embed and upsert to Pinecone
    await embedAndUpsertToPinecone(newChunks, index);

    console.log("═══════════════════════════════════════════════════");
    console.log("   ✅ All Done! Braintree fees chunked and embedded");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
