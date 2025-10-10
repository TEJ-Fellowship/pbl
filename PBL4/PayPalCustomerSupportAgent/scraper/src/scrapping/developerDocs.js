import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";

// Minimal crawler for key PayPal Developer Docs pages.
// Produces ./src/data/developer_docs.json compatible with chunk.js (expects an array of objects with a text/content field).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "../data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "developer_docs.json");

// Seed pages covering common Tier 2 topics
const SEEDS = [
  {
    title: "API Overview",
    url: "https://developer.paypal.com/docs/api/overview/"
  },
  {
    title: "Disputes Overview",
    url: "https://developer.paypal.com/docs/disputes/"
  },
  {
    title: "Payouts Overview",
    url: "https://developer.paypal.com/docs/payouts/"
  },
  {
    title: "Orders v2",
    url: "https://developer.paypal.com/docs/api/orders/v2/"
  },
  {
    title: "Payments v2",
    url: "https://developer.paypal.com/docs/api/payments/v2/"
  }
];

function cleanText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
}

async function fetchAndExtract(url) {
  const res = await axios.get(url, { timeout: 30000 });
  const $ = cheerio.load(res.data);
  // Developer docs generally have rich content within main/article; fallback to body
  const main = $("main, article, #main-content, .content, body").first();
  const title = cleanText($("h1").first().text()) || cleanText($("title").text());

  // Extract headings and paragraphs, code blocks are skipped for now
  const parts = [];
  main.find("h1, h2, h3, h4, p, li, table").each((_, el) => {
    if (el.tagName === "table") {
      const tableText = cleanText($(el).text());
      if (tableText) parts.push(tableText);
      return;
    }
    const t = cleanText($(el).text());
    if (t) parts.push(t);
  });

  const text = [title, ...parts].filter(Boolean).join("\n");
  return { title: title || url, url, text };
}

async function run() {
  const out = [];
  for (const seed of SEEDS) {
    try {
      console.log(`Scraping developer docs: ${seed.title}`);
      const doc = await fetchAndExtract(seed.url);
      out.push({
        source: "developer_docs",
        title: doc.title,
        url: doc.url,
        text: doc.text
      });
    } catch (e) {
      console.warn(`Failed: ${seed.url} → ${e.message}`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2), "utf8");
  console.log(`Saved developer docs to ${OUTPUT_FILE}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


