#!/usr/bin/env node

/**
 * Discord Support Data Scraper and Embedder
 * Scrapes Discord support pages and processes them for RAG
 */

import ScraperService from "./src/services/scrapeService.js";
import EmbeddingService from "./src/services/embeddingService.js";
import fs from "fs-extra";

(async () => {
  const scraper = new ScraperService();
  const embedder = new EmbeddingService();

  try {
    console.log("\n==============================");
    console.log("🚀 Starting Discord RAG Pipeline");
    console.log("==============================\n");

    // STEP 1: SCRAPE
    console.log("🕸️ Step 1: Scraping Discord Support Pages...");
    const scrapedData = await scraper.scrapeAllPages();
    console.log(
      `✅ Scraping complete. Scraped ${scrapedData.length} documents.`
    );

    // STEP 2: INITIALIZE EMBEDDING SERVICE
    console.log("\n🧠 Step 2: Initializing Embedding Service...");
    await embedder.initialize();

    // STEP 3: PROCESS DOCUMENTS INTO CHUNKS
    console.log("\n✂️ Step 3: Splitting scraped text into chunks...");
    const processedChunks = await embedder.processDocuments(scrapedData);
    console.log(`✅ Processed into ${processedChunks.length} chunks.`);

    // STEP 4: GENERATE STATS
    console.log("\n📊 Step 4: Getting embedding statistics...");
    const stats = await embedder.getEmbeddingStats(processedChunks);
    console.log(stats);

    // STEP 5: SAVE OUTPUT
    console.log("\n💾 Step 5: Saving processed chunks...");
    await fs.ensureDir("./data/processed");
    await fs.writeJson(
      "./data/processed/discord_chunks.json",
      processedChunks,
      { spaces: 2 }
    );
    await fs.writeJson("./data/processed/stats.json", stats, {
      spaces: 2,
    });
    console.log("✅ Embedding data saved in ./data/processed");

    console.log("\n🎉 Pipeline completed successfully!");
  } catch (err) {
    console.error("❌ Pipeline failed:", err);
  }
})();
