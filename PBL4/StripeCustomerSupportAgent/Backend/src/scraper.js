import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

// Stripe documentation sources
const SOURCES = {
  api: "https://stripe.com/docs/api",
  webhooks: "https://stripe.com/docs/webhooks",
  errors: "https://stripe.com/docs/error-codes",
  payments: "https://stripe.com/docs/payments/payment-methods",
  billing: "https://stripe.com/docs/billing",
  disputes: "https://stripe.com/docs/disputes",
  integration: "https://stripe.com/docs/development/get-started",
  support: "https://support.stripe.com/topics",
  connect: "https://stripe.com/docs/connect",
};

// Rate limiting: 1 request per second
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    // Rate limiting
    await delay(1000);

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

    // Extract main content
    const content = $("main").text() || $("article").text() || $("body").text();
    const title = $("h1").first().text() || $("title").text();
    console.log("content before cleaning", content);
    // Clean up the content
    const cleanContent = content
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/sk_test_[A-Za-z0-9]+/g, "sk_test_[REDACTED]") // Remove API keys
      .replace(/sk_live_[A-Za-z0-9]+/g, "sk_live_[REDACTED]") // Remove live API keys
      .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[REDACTED]") // Remove webhook secrets
      .replace(/pk_test_[A-Za-z0-9]+/g, "pk_test_[REDACTED]") // Remove publishable keys
      .replace(/pk_live_[A-Za-z0-9]+/g, "pk_live_[REDACTED]") // Remove live publishable keys
      .trim();

    const wordCount = cleanContent.split(/\s+/).length;

    return {
      id: `${category}_${Date.now()}`,
      url,
      category,
      title: title.trim(),
      content: cleanContent,
      wordCount,
      scrapedAt: new Date().toISOString(),
      docType: "api",
      metadata: {
        source: "stripe.com",
        contentType: response.headers["content-type"] || "text/html",
      },
    };
  } catch (error) {
    console.error(`❌ Error scraping ${category}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting Stripe documentation scraper...");

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

  // Create output directory
  const outputDir = path.join(process.cwd(), "data", "stripe_docs");
  await fs.mkdir(outputDir, { recursive: true });

  // Save scraped data
  const outputFile = path.join(outputDir, "scraped.json");
  await fs.writeFile(outputFile, JSON.stringify(docs, null, 2));

  console.log(`\n🎉 Scraping completed!`);
  console.log(`📊 Total documents: ${docs.length}`);
  console.log(`📝 Total words: ${totalWords.toLocaleString()}`);
  console.log(`💾 Saved to: ${outputFile}`);

  // Display summary
  console.log(`\n📋 Scraped sources:`);
  docs.forEach((doc) => {
    console.log(`  • ${doc.category}: ${doc.wordCount} words`);
  });
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("scraper.js")) {
  main().catch(console.error);
}

export { scrapeDoc, SOURCES };
