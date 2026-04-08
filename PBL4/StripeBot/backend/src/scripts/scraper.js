require("dotenv").config();
const crypto = require("node:crypto"); // use for create unique id
/**
 * cheerio: library for parsing HTML to extract data
 * *: asterisk to import all functions from cheerio
 */
const cheerio = require("cheerio");
/** fs: File system module for reading and writing files */
const fs = require("fs/promises");
/** path: Path module for working with file paths */
const path = require("path");
/** undici: Fetch API for making HTTP requests
 */
const { fetch } = require("undici");

/** Stripe documentation entry points.
 * sources: from where data is scraped
 */

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

const DOC_TYPE_BY_CATEGORY = {
  api: "api",
  webhooks: "webhook",
  errors: "error_code",
  payments: "payment",
  billing: "billing",
  disputes: "dispute",
  integration: "integration",
  support: "support",
  connect: "connect",
};

/** Default user agent for the scraper */
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

/** Delay for the scraper
 * @param {number} ms - The delay in milliseconds
 * @returns {Promise<void>} - A promise that resolves after the delay
 * Pause async execution for `ms` milliseconds (non-blocking sleep).
 * Used with `rateLimitMs()` so we wait between HTTP requests.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @returns {number} - The rate limit in milliseconds
 * How long to wait between scrape requests (politeness / rate limiting).
 * Set via env `RATE_LIMIT_DELAY` (milliseconds). Invalid or missing → 1000.
 * 1000ms is the default rate limit
 */
function rateLimitMs() {
  const raw = process.env.RATE_LIMIT_DELAY;
  /** parseInt: convert the string to a number
   */
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 1000;
}
/**
 * Max time to wait for one HTTP response before aborting the fetch.
 * Env `SCRAPE_FETCH_TIMEOUT_MS` (ms). Invalid or missing → 30000.
 * @returns {number}
 */
function fetchTimeoutMs() {
  const raw = process.env.SCRAPE_FETCH_TIMEOUT_MS;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 30_000;
}

/** Abort fetch after ms (Node 16–compatible; avoids AbortSignal.timeout).
 * Returns an AbortSignal that fires after `ms`, plus a `cancel()` to clear the timer.
 * Used so `fetch` does not hang forever on slow/broken networks.
 */
function abortAfter(ms) {
  /** AbortController: built-in object used to cancel an async operation (fetch)
   * creates a controller that can signal "stop" later
   */
  const controller = new AbortController();
  /** setTimeout: set a timer to abort the fetch after `ms` */
  const id = setTimeout(() => controller.abort(), ms);
  /**
   * signal: a small AbortSignal object pass into fetch(), fetch API listens to that signal
   * like wire hand to fetch so another part of code can cancel that request
   */
  const signal = controller.signal;
  /** cancel: function to clear the timer
   * id: timer id to clear the timer
   */
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
async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    /** Space out requests so, do not hammer Stripe (see RATE_LIMIT_DELAY).
     * wait for the rate limit delay before making the next request
     *
     */
    await delay(rateLimitMs());
    const { html, contentType } = await fetchHtml(url);
    // Load the HTML into cheerio to parse it
    const parsedHtml = cheerio.load(html);

    // Remove navigation, footer, ads, and other non-content elements from the parsed HTML
    parsedHtml(
      "nav, footer, .sidebar, .header, .advertisement, .cookie-banner, script, style",
    ).remove();

    const content =
      parsedHtml("main").text() ||
      parsedHtml("article").text() ||
      parsedHtml("body").text();

    let title = "";
    // Find all <h1> elements in the parsed document.
    if (parsedHtml("h1").length > 0) {
      /**
       * .first(): Take only the first match (in case there are several).
       * .text():	Get the plain text inside that element (no HTML tags).
       * .trim():	Remove leading/trailing spaces and line breaks.
       *  */
      title = parsedHtml("h1").first().text().trim();
      /**
       * in case of no <h1>, you usually get "" (empty string), and the scraper’s later code falls back to other selectors (<title>, h2, etc.) or a default title.
       */
    } else if (parsedHtml("title").length > 0) {
      title = parsedHtml("title").text().trim();
    } else if (parsedHtml("h2").length > 0) {
      title = parsedHtml("h2").first().text().trim();
    } else if (parsedHtml(".page-title").length > 0) {
      title = parsedHtml(".page-title").first().text().trim();
      /**
       * parsedHtml("[data-testid='page-title']"): (Cheerio) selects elements that have HTML attribute data-testid equal to page-title.
       * why: some pages use data-testid for the title instead of h1, and it's more reliable than h1.
       */
    } else if (parsedHtml("[data-testid='page-title']").length > 0) {
      title = parsedHtml("[data-testid='page-title']").first().text().trim();
    }
    title = title
      /**
       * /\s+/g with " ": replace every run of whitespace with a single space.
       * \s: any whitespace (spaces, tabs, newlines, etc.)
       * +: one or more in a row
       * g: do it everywhere in the string, not just the first match
       * " ": replace that whole run with one normal space
       * e.g.: "Hello world\n\nfoo" → "Hello world foo"
       */
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
      title = categoryTitles[category] ?? "Documentation";
    }
    console.log("hello");
    console.log("this is not ");
    /**
     * content: raw text from the page
     * replace multiple whitespace with single space
     * replace API keys with [REDACTED] to protect sensitive information
     * trim leading/trailing spaces and line breaks
     */
    const cleanContent = content
      .replace(/\s+/g, " ")
      .replace(/sk_test_[A-Za-z0-9]+/g, "sk_test_[REDACTED]")
      .replace(/sk_live_[A-Za-z0-9]+/g, "sk_live_[REDACTED]")
      .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[REDACTED]")
      .replace(/pk_test_[A-Za-z0-9]+/g, "pk_test_[REDACTED]")
      .replace(/pk_live_[A-Za-z0-9]+/g, "pk_live_[REDACTED]")
      .trim();

    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
    const normalizeUrl = (url) => {
      try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
      } catch {
        return url;
      }
    };
    /** normalizeUrl: normalize the url to a stable id
     * treat same page as one entity
     * avoid duplicate scraping for the same page
     * example: https://stripe.com/docs/api/customers/create?lang=node
     * after: ?lang=node is ignored
     */

    const normalizedUrl = normalizeUrl(url);
    const stableId = `${category}_${crypto.createHash("sha1").update(normalizedUrl).digest("hex").slice(0, 12)}`;
    return {
      id: stableId,
      url,
      normalizedUrl,
      category,
      title: title.trim(),
      content: cleanContent,
      wordCount,
      scrapedAt: new Date().toISOString(),
      docType: DOC_TYPE_BY_CATEGORY[category] ?? "documentation",
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

/**
 * Write the scraped documents to a JSON file
 * @param {Object[]} docs - The documents to write
 * @returns {Promise<string>} - The path to the output file
 */
async function writeScrapedJson(docs) {
  /**
   * path.join(process.cwd(), "data", "stripe_docs"): join the current working directory with the data/stripe_docs folder
   */
  const outputDir = path.join(process.cwd(), "data", "stripe_docs");
  await fs.mkdir(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, "scraped.json");
  /**
   * JSON.stringify(docs, null, 2): convert the documents to a JSON string
   * "utf8": the encoding of the output file
   */
  await fs.writeFile(outputFile, JSON.stringify(docs, null, 2), "utf8");
  console.log(`💾 Saved ${docs.length} document(s) to: ${outputFile}`);
  return outputFile;
}

async function main() {
  console.log(
    "🚀 Starting Stripe documentation scraper (fetch + cheerio, JSON output only)…",
  );

  /**
   * process.argv: an array of command line arguments passed to the script
   * e.g.: ["node", "path/to/scraper.js", "--sources=api", "--limit=2"]
   * slice(2): remove the first two arguments (node and the script name)
   * args: ["--sources=api", "--limit=2"]
   */
  const args = process.argv.slice(2);
  const sourcesArg = args
    .find((arg) => arg.startsWith("--sources="))
    ?.split("=")[1];
  const limitArg = args
    .find((arg) => arg.startsWith("--limit="))
    ?.split("=")[1];
  /**
   * starts as every key in SOURCES (api, webhooks, errors, …).
   */
  let sourcesToScrape = Object.keys(SOURCES);
  /**
   * if limitArg is set, parse it as an integer, otherwise set limit to null
   * parseInt(limitArg, 10): parse the limit argument as an integer
   * 10: the radix (base) of the number system to use
   */
  const limit = limitArg ? parseInt(limitArg, 10) : null;
  /** if sourcesArg is "all", set sourcesToScrape to every key in SOURCES*/
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

module.exports = { SOURCES, scrapeDoc };
