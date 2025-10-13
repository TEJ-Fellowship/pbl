#!/usr/bin/env node

/**
 * Migration script to move from JSON storage to PostgreSQL
 * This script helps transition from file-based storage to database storage
 */

import { storeScrapedDocuments } from "./ingest.js";
import DocumentStorageService from "./services/documentStorageService.js";

async function migrateToPostgreSQL() {
  console.log("🔄 Starting migration from JSON to PostgreSQL...");

  try {
    // Step 1: Store scraped documents in PostgreSQL
    console.log("\n📂 Step 1: Storing scraped documents in PostgreSQL...");
    await storeScrapedDocuments();

    // Step 2: Verify the migration
    console.log("\n📊 Step 2: Verifying migration...");
    const documentStorageService = new DocumentStorageService();

    try {
      const stats = await documentStorageService.getStats();
      console.log("✅ Migration verification:");
      console.log(`   📊 Total documents: ${stats.total_documents}`);
      console.log(`   📊 Categories: ${stats.categories}`);
      console.log(
        `   📊 Average word count: ${Math.round(stats.avg_word_count)}`
      );
      console.log(
        `   📊 Date range: ${stats.oldest_document} to ${stats.newest_document}`
      );

      // Show sample documents by category
      console.log("\n📋 Sample documents by category:");
      const categories = ["api", "webhooks", "payments", "guides"];

      for (const category of categories) {
        const docs = await documentStorageService.getDocumentsByCategory(
          category,
          3
        );
        if (docs.length > 0) {
          console.log(`   ${category}: ${docs.length} documents`);
          docs.forEach((doc) => {
            console.log(
              `     - ${doc.title || "Untitled"} (${doc.word_count} words)`
            );
          });
        }
      }
    } catch (error) {
      console.error("❌ Verification failed:", error.message);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log(
      "   1. Update your ingestion process to use loadDocumentsFromDB()"
    );
    console.log("   2. Consider archiving the original scraped.json file");
    console.log("   3. Test the new PostgreSQL-based ingestion process");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("migrate-to-postgres.js")) {
  migrateToPostgreSQL().catch(console.error);
}

export { migrateToPostgreSQL };
