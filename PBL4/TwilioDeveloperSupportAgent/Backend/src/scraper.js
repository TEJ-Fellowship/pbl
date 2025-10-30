// backend/src/scraper.js
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import config from "../config/config.js";
import DocumentStorageService from '../services/documentStorageService.js'
import crypto from "crypto";


// Twilio documentation sources 
const SOURCES = {
  api: "https://www.twilio.com/docs/usage/api",
  webhooks: "https://www.twilio.com/docs/usage/webhooks",
  errors: "https://www.twilio.com/docs/api/errors",
  sms_quickstart: "https://www.twilio.com/docs/sms/quickstart",
  voice_quickstart: "https://www.twilio.com/docs/voice/quickstart",
  whatsapp_api: "https://www.twilio.com/docs/whatsapp",
  video_api: "https://www.twilio.com/docs/video",
  node_sdk: "https://www.twilio.com/docs/libraries/node",
};

// Rate limiting: 1 request per second
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    await delay(parseInt(config.RATE_LIMIT_DELAY) || 1000);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    // Remove navigation, footer, ads, and other non-content elements
    $(
      "nav, footer, .sidebar, .header, .advertisement, .cookie-banner, script, style"
    ).remove();

    // Extract title with multiple fallback strategies
    let title = "";
    if ($("h1").length > 0) {
      title = $("h1").first().text().trim();
    } else if ($("title").length > 0) {
      title = $("title").text().trim();
    } else if ($("h2").length > 0) {
      title = $("h2").first().text().trim();
    } else if ($(".page-title").length > 0) {
      title = $(".page-title").first().text().trim();
    } else if ($("[data-testid='page-title']").length > 0) {
      title = $("[data-testid='page-title']").first().text().trim();
    }

    // Clean up title (normalize brand positioning)
    title = title
      .replace(/\s+/g, " ")
      .replace(/^\s*-\s*Twilio\s*$/i, "")
      .replace(/^\s*Twilio\s*-\s*/i, "")
      .replace(/-\s*Twilio\s*$/i, "")
      .trim();

    // Extract main content
    const rawContent = $("main").text() || $("article").text() || $("body").text();

    // Clean content and redact secrets
    const cleanContent = (rawContent || "")
      .replace(/\s+/g, " ")
      // Redact common secret formats (Twilio SIDs/Keys)
      .replace(/AC[a-f0-9]{32}/gi, "AC[REDACTED]") // Account SID
      .replace(/SK[a-f0-9]{32}/gi, "SK[REDACTED]") // API Key Secret
      .replace(/WK[a-f0-9]{32}/gi, "WK[REDACTED]") // (Occasional) Webhook Key
      .trim();

    if (!title || title.length === 0) {
      const categoryTitles = {
        api: "API Reference",
        webhooks: "Webhooks",
        errors: "Error Codes",
        sms_quickstart: "SMS Quickstart",
        voice_quickstart: "Voice Quickstart",
        whatsapp_api: "WhatsApp API",
        video_api: "Video API",
        node_sdk: "Node.js SDK",
      };
      title = categoryTitles[category] || "Documentation";
    }

    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

    const deterministicId = crypto
      .createHash("sha256")
      .update(url)
      .digest("hex");

    return {
      id: deterministicId,
      url,
      category,
      title: title.trim(),
      content: cleanContent,
      wordCount,
      scrapedAt: new Date().toISOString(),
      docType: "api",
      // codeBlocks: [],
      metadata: {
        source: "twilio.com",
        contentType: response.headers["content-type"] || "text/html",
      },
    };
  } catch (error) {
    console.error(`❌ Error scraping ${category}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting Twilio documentation scraper...");

 const args = process.argv.slice(2);
  const sourcesArg = args
    .find((arg) => arg.startsWith("--sources="))
    ?.split("=")[1];
  const limitArg = args
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")[1];

  let sourcesToScrape = Object.keys(SOURCES);
  let limit = limitArg ? parseInt(limitArg) : null;

  if (sourcesArg) {
    if (sourcesArg === "all") {
      sourcesToScrape = Object.keys(SOURCES);
    } else {
      sourcesToScrape = sourcesArg.split(",").map((s) => s.trim());
    }
  }

  console.log(`📋 Sources to scrape: ${sourcesToScrape.join(", ")}`);
  if (limit) console.log(`🔢 Limit: ${limit} documents per source`);

  const docs = [];
  let totalWords = 0;

  for (const category of sourcesToScrape) {
    if (!SOURCES[category]) {
      console.log(`⚠️ Unknown source: ${category}`);
      continue;
    }

    const doc = await scrapeDoc(SOURCES[category], category);
    if (doc) {
      docs.push(doc);
      totalWords += doc.wordCount;
      console.log(`✅ Scraped ${category}: ${doc.wordCount} words`);
    }

    if (limit && docs.length >= limit) {
      console.log(`🛑 Reached limit of ${limit} documents`);
      break;
    }
  }

  // Store documents in PostgreSQL
  console.log(`\n💾 Storing ${docs.length} documents in PostgreSQL...`);
  const documentStorageService = new DocumentStorageService();

  try {
    await documentStorageService.storeDocuments(docs);
    console.log(
      `✅ Successfully stored ${docs.length} documents in PostgreSQL`
    );
  } catch (error) {
    console.error(`❌ Failed to store documents in PostgreSQL:`, error.message);

    // Fallback: Save to JSON file as backup
    console.log(`🔄 Falling back to JSON file storage...`);
    const outputDir = path.join(process.cwd(), "data", "stripe_docs");
    await fs.mkdir(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, "scraped.json");
    await fs.writeFile(outputFile, JSON.stringify(docs, null, 2));
    console.log(`💾 Saved to: ${outputFile}`);
  } finally {
    await documentStorageService.close();
  }

  console.log(`\n🎉 Scraping completed!`);
  console.log(`📊 Total documents: ${docs.length}`);
  console.log(`📝 Total words: ${totalWords.toLocaleString()}`);

  // Display summary
  console.log(`\n📋 Scraped sources:`);
  docs.forEach((doc) => {
    console.log(`  • ${doc.category}: ${doc.wordCount} words`);
  });
}

/**
 * Get latest scraped documents from PostgreSQL
 */
async function getLatestScrapedDocuments(limit = 10) {
  console.log("📂 Getting latest scraped documents from PostgreSQL...");

  const documentStorageService = new DocumentStorageService();

  try {
    const documents = await documentStorageService.getUnprocessedDocuments(
      limit
    );
    console.log(`📊 Found ${documents.length} unprocessed documents`);

    // Display documents
    documents.forEach((doc, index) => {
      console.log(
        `  ${index + 1}. ${doc.title || "Untitled"} (${doc.category})`
      );
      console.log(`     - URL: ${doc.url}`);
      console.log(`     - Words: ${doc.word_count}`);
      console.log(`     - Scraped: ${doc.scraped_at}`);
      console.log("");
    });

    return documents;
  } catch (error) {
    console.error("❌ Failed to get documents from PostgreSQL:", error.message);
    return [];
  } finally {
    await documentStorageService.close();
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("scraper.js")) {
  main().catch(console.error);
}

export { scrapeDoc, SOURCES, getLatestScrapedDocuments };