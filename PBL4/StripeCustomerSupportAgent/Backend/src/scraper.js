/**
 * Stripe Documentation Scraper
 *
 * This module scrapes Stripe documentation from various sources to create
 * a comprehensive knowledge base for the customer support agent.
 *
 * Features:
 * - Scrapes multiple Stripe documentation sources
 * - Rate limiting to respect server resources
 * - Content cleaning and sanitization
 * - API key redaction for security
 * - Configurable scraping limits
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

/**
 * Configuration object containing all Stripe documentation sources
 * Each key represents a category, and the value is the corresponding URL
 */
const SOURCES = {
  api: "https://stripe.com/docs/api", // API reference documentation
  webhooks: "https://stripe.com/docs/webhooks", // Webhook documentation
  errors: "https://stripe.com/docs/error-codes", // Error codes and handling
  payments: "https://stripe.com/docs/payments/payment-methods", // Payment methods
  billing: "https://stripe.com/docs/billing", // Billing and subscriptions
  disputes: "https://stripe.com/docs/disputes", // Dispute handling
  integration: "https://stripe.com/docs/development/get-started", // Getting started guide
  support: "https://support.stripe.com/topics", // Support topics
  connect: "https://stripe.com/docs/connect", // Connect platform docs
};

/**
 * Utility function to implement rate limiting
 * Prevents overwhelming the target server with too many requests
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Scrapes a single documentation page from Stripe
 *
 * @param {string} url - The URL to scrape
 * @param {string} category - The category/type of documentation
 * @returns {Object|null} - Scraped document object or null if failed
 */
async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    // Implement rate limiting to be respectful to the server
    await delay(1000);

    // Make HTTP request with proper headers to mimic a real browser
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 30000, // 30 second timeout
    });

    // Load HTML content into cheerio for parsing
    const $ = cheerio.load(response.data);

    // Remove navigation, footer, ads, and other non-content elements
    // This helps focus on the actual documentation content
    $(
      "nav, footer, .sidebar, .header, .advertisement, .cookie-banner, script, style"
    ).remove();

    // Extract main content from the page
    // Try different selectors to find the main content area
    const content = $("main").text() || $("article").text() || $("body").text();
    const title = $("h1").first().text() || $("title").text();

    console.log("content before cleaning", content);

    // Clean up the content to make it more readable and secure
    const cleanContent = content
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/sk_test_[A-Za-z0-9]+/g, "sk_test_[REDACTED]") // Remove test API keys
      .replace(/sk_live_[A-Za-z0-9]+/g, "sk_live_[REDACTED]") // Remove live API keys
      .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[REDACTED]") // Remove webhook secrets
      .replace(/pk_test_[A-Za-z0-9]+/g, "pk_test_[REDACTED]") // Remove test publishable keys
      .replace(/pk_live_[A-Za-z0-9]+/g, "pk_live_[REDACTED]") // Remove live publishable keys
      .trim();

    // Calculate word count for statistics
    const wordCount = cleanContent.split(/\s+/).length;

    // Return structured document object
    return {
      id: `${category}_${Date.now()}`, // Unique identifier
      url, // Original URL
      category, // Documentation category
      title: title.trim(), // Page title
      content: cleanContent, // Cleaned content
      wordCount, // Word count for statistics
      scrapedAt: new Date().toISOString(), // Timestamp
      docType: "api", // Document type
      metadata: {
        source: "stripe.com", // Source website
        contentType: response.headers["content-type"] || "text/html", // Content type
      },
    };
  } catch (error) {
    console.error(`❌ Error scraping ${category}:`, error.message);
    return null; // Return null on error to allow continuation
  }
}

/**
 * Main function that orchestrates the scraping process
 * Handles command line arguments, scrapes all configured sources,
 * and saves the results to a JSON file
 */
async function main() {
  console.log("🚀 Starting Stripe documentation scraper...");

  // Parse command line arguments
  const args = process.argv.slice(2);

  // Extract sources argument (e.g., --sources=api,webhooks)
  const sourcesArg = args
    .find((arg) => arg.startsWith("--sources="))
    ?.split("=")[1];

  // Extract limit argument (e.g., --limit=5)
  const limitArg = args
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")[1];

  // Initialize default values
  let sourcesToScrape = Object.keys(SOURCES); // All sources by default
  let limit = limitArg ? parseInt(limitArg) : null; // No limit by default

  // Process sources argument
  if (sourcesArg) {
    if (sourcesArg === "all") {
      sourcesToScrape = Object.keys(SOURCES); // All sources
    } else {
      // Parse comma-separated list of sources
      sourcesToScrape = sourcesArg.split(",").map((s) => s.trim());
    }
  }

  // Display configuration
  console.log(`📋 Sources to scrape: ${sourcesToScrape.join(", ")}`);
  if (limit) console.log(`🔢 Limit: ${limit} documents per source`);

  // Initialize tracking variables
  const docs = []; // Array to store scraped documents
  let totalWords = 0; // Total word count across all documents

  // Scrape each configured source
  for (const category of sourcesToScrape) {
    // Validate that the source exists in our configuration
    if (!SOURCES[category]) {
      console.log(`⚠️ Unknown source: ${category}`);
      continue;
    }

    // Scrape the documentation for this category
    const doc = await scrapeDoc(SOURCES[category], category);
    if (doc) {
      docs.push(doc);
      totalWords += doc.wordCount;
      console.log(`✅ Scraped ${category}: ${doc.wordCount} words`);
    }

    // Check if we've reached the limit
    if (limit && docs.length >= limit) {
      console.log(`🛑 Reached limit of ${limit} documents`);
      break;
    }
  }

  // Create output directory structure
  const outputDir = path.join(process.cwd(), "data", "stripe_docs");
  await fs.mkdir(outputDir, { recursive: true });

  // Save scraped data to JSON file
  const outputFile = path.join(outputDir, "scraped.json");
  await fs.writeFile(outputFile, JSON.stringify(docs, null, 2));

  // Display completion summary
  console.log(`\n🎉 Scraping completed!`);
  console.log(`📊 Total documents: ${docs.length}`);
  console.log(`📝 Total words: ${totalWords.toLocaleString()}`);
  console.log(`💾 Saved to: ${outputFile}`);

  // Display detailed summary of scraped sources
  console.log(`\n📋 Scraped sources:`);
  docs.forEach((doc) => {
    console.log(`  • ${doc.category}: ${doc.wordCount} words`);
  });
}

/**
 * CLI Execution Handler
 * Only runs the main function if this script is executed directly
 * (not when imported as a module)
 */
if (process.argv[1] && process.argv[1].endsWith("scraper.js")) {
  main().catch(console.error);
}

/**
 * Module Exports
 * Export functions and constants for use in other modules
 */
export { scrapeDoc, SOURCES };
