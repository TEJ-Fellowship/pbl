import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import puppeteer from "puppeteer";
import { cleanHtmlText, sanitizeFilename } from "./utils/cleaner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Focus on key Shopify sections for Tier 1
const SOURCES = {
  getting_started:
    "https://help.shopify.com/en/manual/intro-to-shopify/getting-started",
  products: "https://help.shopify.com/en/manual/products",
  orders: "https://help.shopify.com/en/manual/orders",
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeDoc(url, section, browser) {
  // Render via Puppeteer to avoid 403 and JS-rendered content
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page
    .waitForSelector("main, article, body", { timeout: 15000 })
    .catch(() => {});
  const html = await page.content();
  const $ = cheerio.load(html);
  $("nav, footer, header, .site-nav, .sidebar, .toc, .breadcrumb").remove();
  const mainContent =
    $("main").text() || $("article").text() || $("body").text();
  const title = $("h1").first().text() || $("title").text();
  const cleaned = cleanHtmlText(mainContent);
  await page.close();
  return {
    url,
    section,
    title: (title || section).trim(),
    content: cleaned,
    merchant_level: "beginner",
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
  const outDir = path.join(__dirname, "../data/shopify_docs");
  await fs.mkdir(outDir, { recursive: true });
  const docs = [];
  const browser = await puppeteer.launch({ headless: "new" });
  for (const [section, url] of Object.entries(SOURCES)) {
    console.log(`Scraping ${section} -> ${url}`);
    try {
      const doc = await scrapeDoc(url, section, browser);
      docs.push(doc);
      const fname = sanitizeFilename(section) + ".json";
      await fs.writeFile(
        path.join(outDir, fname),
        JSON.stringify(doc, null, 2),
        "utf-8"
      );
      console.log(`Saved ${fname} (${doc.content.length} chars)`);
    } catch (err) {
      console.error(
        `Failed to scrape ${section}:`,
        err?.response?.status || err.message
      );
    }
  }
  await browser.close();
  await fs.writeFile(
    path.join(outDir, "scraped.index.json"),
    JSON.stringify(docs, null, 2),
    "utf-8"
  );
  console.log(`✅ Scraped ${docs.length} documents`);
}

if (import.meta.url === pathToFileURL(__filename).href) {
  console.log("Starting scraper...");
  main().catch((e) => {
    console.error("Scraper failed:", e?.message || e);
    process.exit(1);
  });
}
