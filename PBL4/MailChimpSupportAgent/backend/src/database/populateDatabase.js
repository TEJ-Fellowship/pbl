/**
 * Populate PostgreSQL Database
 *
 * Loads processed chunks from JSON and inserts them into PostgreSQL
 * for BM25 keyword search.
 *
 * Usage: node src/database/populateDatabase.js
 */

import fs from "fs/promises";
import path from "path";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";

async function populateDatabase() {
  console.log(`Populating PostgreSQL Database`);

  const bm25Service = new PostgreSQLBM25Service();

  try {
    // Test connection by getting stats
    console.log(`Testing database connection...`);
    await bm25Service.getStats();
    console.log(`Database connection successful!`);

    // Find chunks file
    const chunksPath = path.resolve(
      "./src/data/processed_chunks/enhanced_chunks.json"
    );
    const backupChunksPath = path.resolve(
      "./data/processed_chunks/enhanced_chunks.json"
    );

    let chunks;
    try {
      const data = await fs.readFile(chunksPath, "utf-8");
      chunks = JSON.parse(data);
      console.log(`Loaded chunks from: ${chunksPath}`);
    } catch {
      try {
        const data = await fs.readFile(backupChunksPath, "utf-8");
        chunks = JSON.parse(data);
        console.log(`Loaded chunks from: ${backupChunksPath}`);
      } catch {
        throw new Error(
          "No processed chunks found. Run: npm run enhanced-ingest"
        );
      }
    }

    console.log(`Found ${chunks.length} chunks to process`);

    // Check current database stats
    const beforeStats = await bm25Service.getStats();
    console.log(`Current database: ${beforeStats.total_chunks} chunks`);

    // Ask if user wants to clear existing data
    if (beforeStats.total_chunks > 0) {
      console.log(`Database already has data. Clearing...`);
      await bm25Service.clearAll();
    }

    // Insert chunks in batches
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    console.log(`Inserting chunks in batches...`);

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      // Process each chunk in the batch
      for (const chunk of batch) {
        try {
          await bm25Service.insertChunk({
            content: chunk.pageContent || chunk.content,
            source: chunk.metadata?.source || "",
            title: chunk.metadata?.title || "Untitled",
            category: chunk.metadata?.category || "general",
            docType: chunk.metadata?.docType || "article",
            chunk_index: chunk.metadata?.chunk_index || 0,
            total_chunks: chunk.metadata?.total_chunks || 1,
            publishedDate: chunk.metadata?.publishedDate || new Date(),
          });
          totalInserted++;

          // Show progress
          if (totalInserted % 50 === 0) {
            console.log(`Progress: ${totalInserted}/${chunks.length}`);
          }
        } catch (error) {
          console.error(
            `Failed to insert chunk ${totalInserted}:`,
            error.message
          );
        }
      }
    }

    // Final stats
    const afterStats = await bm25Service.getStats();
    console.log(`Population completed!`);
    console.log(`Final Statistics:`);
    console.log(`   Total chunks: ${afterStats.total_chunks}`);
    console.log(`   Categories: ${afterStats.categories}`);
    console.log(`   Unique sources: ${afterStats.unique_sources}`);
    console.log(`   Oldest document: ${afterStats.oldest_document || "N/A"}`);
    console.log(`   Newest document: ${afterStats.newest_document || "N/A"}`);

    console.log(`PostgreSQL database is ready for hybrid search!`);
  } catch (error) {
    console.error(`Population failed:`, error.message);
    console.error(`Troubleshooting:`);
    console.error(`   1. Make sure database is set up: npm run db:setup`);
    console.error(`   2. Check PostgreSQL is running`);
    console.error(`   3. Verify .env has correct credentials`);
    console.error(`   4. Run ingestion first: npm run enhanced-ingest`);
    process.exit(1);
  }
}

// Run population
populateDatabase();
