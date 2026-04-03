import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { toSql } from "pgvector";
import pool from "../config/db.js";
import { embedText } from "../services/embeddingService.js";
import { chunkScrapedDocuments } from "./testChunk.js";

async function main() {
  const jsonPath = path.join(process.cwd(), "data", "stripe_docs", "scraped.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const docs = JSON.parse(raw);
  const chunks = chunkScrapedDocuments(docs);

  console.log("📥 Ingest:", docs.length, "doc(s) →", chunks.length, "chunk(s)");

  const client = await pool.connect();
  try {
    if (process.env.INGEST_APPEND !== "1") {
      await client.query("TRUNCATE stripe_doc_chunks RESTART IDENTITY");
      console.log("🗑️  Truncated stripe_doc_chunks (set INGEST_APPEND=1 to skip)");
    }

    let n = 0;
    for (const ch of chunks) {
      const emb = await embedText(ch.content);
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
      n += 1;
      if (n % 20 === 0) console.log("   … embedded", n, "/", chunks.length);
    }
    console.log("✅ Ingest complete:", n, "row(s) upserted");
  } finally {
    client.release();
  }

  await pool.end();
}

if (process.argv[1]?.endsWith("ingestVectors.js")) {
  main().catch((e) => {
    console.error("❌ Ingest failed:", e.message);
    process.exit(1);
  });
}
