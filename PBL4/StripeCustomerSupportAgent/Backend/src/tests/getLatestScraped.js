#!/usr/bin/env node

/**
 * Script to get latest scraped documents from PostgreSQL
 */

import { getLatestScrapedDocuments } from "../scraper.js";

async function main() {
  console.log("🔍 Getting latest scraped documents from PostgreSQL...");

  try {
    const documents = await getLatestScrapedDocuments(10);

    if (documents.length === 0) {
      console.log("📭 No unprocessed documents found");
    } else {
      console.log(`\n✅ Found ${documents.length} unprocessed documents`);
      console.log("💡 Run 'npm run ingest' to process these documents");
    }
  } catch (error) {
    console.error("❌ Failed to get latest documents:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("getLatestScraped.js")) {
  main().catch(console.error);
}

export { main as getLatestScraped };
