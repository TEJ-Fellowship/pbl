import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { fetch } from "undici";

/** Stripe documentation entry points (same set as StripeCustomerSupportAgent reference). */
export const SOURCES = {
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

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rateLimitMs() {
  const raw = process.env.RATE_LIMIT_DELAY;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 1000;
}

function fetchTimeoutMs() {
  const raw = process.env.SCRAPE_FETCH_TIMEOUT_MS;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 30_000;
}

/** Abort fetch after ms (Node 16–compatible; avoids AbortSignal.timeout). */
function abortAfter(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const signal = controller.signal;
  return { signal, cancel: () => clearTimeout(id) };
}

/**
 * Fetch HTML with native fetch (no axios).
 * @param {string} url
 * @returns {Promise<{ html: string, contentType: string }>}
 */
async function fetchHtml(url) {
  const { signal, cancel } = abortAfter(fetchTimeoutMs());
  let res;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": process.env.SCRAPE_USER_AGENT || DEFAULT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal,
    });
  } finally {
    cancel();
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const contentType = res.headers.get("content-type") || "text/html";
  return { html, contentType };
}

/**
 * Scrape a single Stripe docs URL into a plain document object (JSON-serializable).
 * @param {string} url
 * @param {string} category
 */
export async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    await delay(rateLimitMs());

    const { html, contentType } = await fetchHtml(url);
    const $ = cheerio.load(html);

    $(
      "nav, footer, .sidebar, .header, .advertisement, .cookie-banner, script, style"
    ).remove();

    const content =
      $("main").text() || $("article").text() || $("body").text();

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

    title = title
      .replace(/\s+/g, " ")
      .replace(/^\s*-\s*Stripe\s*$/, "")
      .replace(/^\s*Stripe\s*-\s*/, "")
      .trim();

    if (!title) {
      const categoryTitles = {
        api: "API Reference",
        webhooks: "Webhooks",
        errors: "Error Codes",
        payments: "Payment Methods",
        billing: "Billing",
        disputes: "Disputes",
        integration: "Integration Guide",
        support: "Support",
        connect: "Connect",
      };
      title = categoryTitles[category] || "Documentation";
    }

    const cleanContent = content
      .replace(/\s+/g, " ")
      .replace(/sk_test_[A-Za-z0-9]+/g, "sk_test_[REDACTED]")
      .replace(/sk_live_[A-Za-z0-9]+/g, "sk_live_[REDACTED]")
      .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[REDACTED]")
      .replace(/pk_test_[A-Za-z0-9]+/g, "pk_test_[REDACTED]")
      .replace(/pk_live_[A-Za-z0-9]+/g, "pk_live_[REDACTED]")
      .trim();

    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

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
        contentType,
      },
    };
  } catch (error) {
    console.error(`❌ Error scraping ${category}:`, error.message);
    return null;
  }
}

async function writeScrapedJson(docs) {
  const outputDir = path.join(process.cwd(), "data", "stripe_docs");
  await fs.mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "scraped.json");
  await fs.writeFile(outputFile, JSON.stringify(docs, null, 2), "utf8");
  console.log(`💾 Saved ${docs.length} document(s) to: ${outputFile}`);
  return outputFile;
}

async function main() {
  console.log("🚀 Starting Stripe documentation scraper (fetch + cheerio, JSON output only)…");

  const args = process.argv.slice(2);
  const sourcesArg = args
    .find((arg) => arg.startsWith("--sources="))
    ?.split("=")[1];
  const limitArg = args
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")[1];

  let sourcesToScrape = Object.keys(SOURCES);
  const limit = limitArg ? parseInt(limitArg, 10) : null;

  if (sourcesArg) {
    if (sourcesArg === "all") {
      sourcesToScrape = Object.keys(SOURCES);
    } else {
      sourcesToScrape = sourcesArg.split(",").map((s) => s.trim());
    }
  }

  console.log(`📋 Sources: ${sourcesToScrape.join(", ")}`);
  if (limit) console.log(`🔢 Limit: ${limit} document(s) total`);

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
      console.log(`🛑 Reached limit of ${limit} document(s)`);
      break;
    }
  }

  await writeScrapedJson(docs);

  console.log(`\n🎉 Scraping completed!`);
  console.log(`📊 Total documents: ${docs.length}`);
  console.log(`📝 Total words: ${totalWords.toLocaleString()}`);
  docs.forEach((doc) => {
    console.log(`  • ${doc.category}: ${doc.wordCount} words`);
  });
}

if (process.argv[1] && process.argv[1].endsWith("scraper.js")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
