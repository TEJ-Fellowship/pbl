// backend/src/scraper.js
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import url from "url";
import crypto from "crypto";
import config from "../config/config.js";

const BASE_DOMAIN = "https://www.twilio.com";

// Twilio documentation base sources
const SOURCES = {
  api: "https://www.twilio.com/docs/usage/api",
  sms_quickstart: "https://www.twilio.com/docs/sms/quickstart",
  errors: "https://www.twilio.com/docs/api/errors",
  webhooks: "https://www.twilio.com/docs/usage/webhooks",
  voice_quickstart: "https://www.twilio.com/docs/voice/quickstart",
  whatsapp_api: "https://www.twilio.com/docs/whatsapp",
  video_api: "https://www.twilio.com/docs/video",
  node_SDK: "https://www.twilio.com/docs/libraries/node",
};

// Rate limiting
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Deduplication stores
const visitedUrls = new Set();
const contentHashes = new Set();

/**
 * Normalize URLs for consistent comparison
 */
function normalizeUrl(href, base) {
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("mailto:")) return null;

  const absUrl = new URL(href, base).toString().split("#")[0];
  if (!absUrl.startsWith(BASE_DOMAIN)) return null;
  return absUrl.replace(/\/$/, "");
}

/**
 * Generate SHA-256 hash of content to detect duplicates
 */
function hashContent(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Scrape a single Twilio documentation page
 */
async function scrapePage(urlStr, category) {
  if (visitedUrls.has(urlStr)) return null;
  visitedUrls.add(urlStr);

  console.log(`🔍 Scraping: ${urlStr}`);
  await delay(parseInt(config.RATE_LIMIT_DELAY) || 1000);

  try {
    const res = await axios.get(urlStr, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(res.data);

    // Remove irrelevant parts
    $("nav, footer, script, style, .sidebar, .cookie-banner, .ad, .footer").remove();

    // Extract code blocks
    const codeBlocks = [];
    $("pre code, pre, code").each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 15 && !codeBlocks.includes(t)) codeBlocks.push(t);
    });

    // Remove code before text extraction
    $("pre, code").remove();

    const content = $("main").text() || $("article").text() || $("body").text();
    const title = $("h1").first().text() || $("title").text();
    const cleanContent = content
      .replace(/\s+/g, " ")
      .replace(/sk_(live|test)_[A-Za-z0-9]+/g, "sk_[REDACTED]")
      .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[REDACTED]")
      .trim();

    // Content deduplication via hash
    const hash = hashContent(cleanContent);
    if (contentHashes.has(hash)) {
      console.log(`⚠️ Skipping duplicate content: ${urlStr}`);
      return null;
    }
    contentHashes.add(hash);

    const wordCount = cleanContent.split(/\s+/).length;

    // Extract links for recursive crawl
    const links = [];
    $("a").each((_, el) => {
      const href = normalizeUrl($(el).attr("href"), urlStr);
      if (href) links.push(href);
    });

    return {
      id: `${category}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      url: urlStr,
      title,
      content: cleanContent,
      codeBlocks,
      wordCount,
      category,
      scrapedAt: new Date().toISOString(),
      metadata: {
        source: BASE_DOMAIN,
        contentType: res.headers["content-type"] || "text/html",
      },
      links,
    };
  } catch (err) {
    console.error(`❌ Error scraping ${urlStr}: ${err.message}`);
    return null;
  }
}

/**
 * Recursive crawler for Twilio documentation
 */
async function crawlDocs(startUrl, category, maxDepth = 2) {
  const toVisit = [{ url: startUrl, depth: 0 }];
  const results = [];

  while (toVisit.length > 0) {
    const { url: currentUrl, depth } = toVisit.shift();

    if (depth > maxDepth) continue;
    const page = await scrapePage(currentUrl, category);
    if (!page) continue;

    results.push(page);

    for (const link of page.links) {
      if (
        !visitedUrls.has(link) &&
        link.startsWith(BASE_DOMAIN + "/docs")
      ) {
        toVisit.push({ url: link, depth: depth + 1 });
      }
    }
  }
  return results;
}

/**
 * CLI entry point
 */
async function main() {
  console.log("🚀 Starting Twilio full documentation scraper...");

  const args = process.argv.slice(2);
  const sourcesArg = args.find((a) => a.startsWith("--sources="))?.split("=")[1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const depthArg = args.find((a) => a.startsWith("--depth="))?.split("=")[1];

  const limit = limitArg ? parseInt(limitArg) : null;
  const maxDepth = depthArg ? parseInt(depthArg) : 2;

  let sourcesToScrape = Object.keys(SOURCES);
  if (sourcesArg && sourcesArg !== "all") {
    sourcesToScrape = sourcesArg.split(",").map((s) => s.trim());
  }

  const allDocs = [];
  let totalWords = 0;

  for (const category of sourcesToScrape) {
    const baseUrl = SOURCES[category];
    if (!baseUrl) continue;

    console.log(`\n🌐 Crawling category: ${category}`);
    const docs = await crawlDocs(baseUrl, category, maxDepth);

    allDocs.push(...docs);
    totalWords += docs.reduce((sum, d) => sum + d.wordCount, 0);
    console.log(`✅ ${category}: scraped ${docs.length} unique pages`);
  }

  // Save output
  const outDir = path.join(process.cwd(), "data", "twilio_docs_full");
  await fs.mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, "scraped_full.json");
  await fs.writeFile(filePath, JSON.stringify(allDocs, null, 2));

  console.log(`\n🎉 Done!`);
  console.log(`📊 Total pages: ${allDocs.length}`);
  console.log(`📝 Total words: ${totalWords.toLocaleString()}`);
  console.log(`💾 Output saved to: ${filePath}`);
  console.log(`💡 Next: Run 'npm run chunk' → 'npm run ingest' → 'npm run chat'`);
}

if (process.argv[1].endsWith("scraper.js")) {
  main().catch(console.error);
}

export { scrapePage, crawlDocs, SOURCES };
