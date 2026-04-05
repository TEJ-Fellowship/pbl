import "dotenv/config";
/** fs: File system module for reading and writing files */
import fs from "fs/promises";
/** path: Path module for working with file paths */
import path from "path";
/** toSql: function to convert the embedding to a SQL vector */
import { toSql } from "pgvector";
/** pool: the database connection pool */
import pool from "../config/db.js";
/** embedText: function to embed the text */
import { embedText } from "../services/embeddingService.js";
/** chunkScrapedDocuments: function to chunk the scraped documents */
import { chunkScrapedDocuments } from "./testChunk.js";

/** main: main function to ingest the vectors */
async function main() {
  /** jsonPath: the path to the JSON file containing the scraped documents */
  const jsonPath = path.join(
    process.cwd(),
    "data",
    "stripe_docs",
    "scraped.json",
  );
  const raw = await fs.readFile(jsonPath, "utf8");
  const docs = JSON.parse(raw);
  const chunks = chunkScrapedDocuments(docs);

  console.log("📥 Ingest:", docs.length, "doc(s) →", chunks.length, "chunk(s)");

  /** client: the database client */
  const client = await pool.connect();
  /** try: try to ingest the vectors */
  try {
    /** if INGEST_APPEND is not set to 1, truncate the stripe_doc_chunks table */
    if (process.env.INGEST_APPEND !== "1") {
      await client.query("TRUNCATE stripe_doc_chunks RESTART IDENTITY");
      console.log(
        "🗑️  Truncated stripe_doc_chunks (set INGEST_APPEND=1 to skip)",
      );
    }
    /** n: the number of chunks ingested
     * for each chunk, embed the text and insert the vector into the database
     */
    let n = 0;
    /** go through each chunk produced from scraped.json */
    for (const ch of chunks) {
      /** embed the text of the chunk */
      const emb = await embedText(ch.content);
      /** insert the vector into the database
       * embedding (via toSql(emb) for pgvector), metadata as JSON.
       * ON CONFLICT (source_doc_id, chunk_index) DO UPDATE SET: if the chunk already exists, update the existing chunk
       * why update: to keep the chunk up to date with the latest version of the document
       */
      await client.query(
        `INSERT INTO stripe_doc_chunks (source_doc_id, chunk_index, source_url, title, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7::jsonb)
         ON CONFLICT (source_doc_id, chunk_index) DO UPDATE SET
           source_url = EXCLUDED.source_url,
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           embedding = EXCLUDED.embedding,
           metadata = EXCLUDED.metadata`,
        [
          ch.sourceDocId,
          ch.chunkIndex,
          ch.sourceUrl,
          ch.title,
          ch.content,
          toSql(emb),
          JSON.stringify({ category: ch.category, ...ch.metadata }),
        ],
      );
      /** increment the number of chunks ingested */
      n += 1;
      /** log the progress every 20 chunks
       */
      if (n % 20 === 0) console.log("   … embedded", n, "/", chunks.length);
    }
    console.log("✅ Ingest complete:", n, "row(s) upserted");
    /** release the database client */
  } finally {
    client.release();
  }
  /** end the database connection */
  await pool.end();
}

/** if the script is run directly, run the main function */
if (process.argv[1]?.endsWith("ingestVectors.js")) {
  main().catch((e) => {
    console.error("❌ Ingest failed:", e.message);
    process.exit(1);
  });
}
