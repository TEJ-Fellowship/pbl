import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const START_URLS = [
  "https://www.twilio.com/docs/usage/api",
  "https://www.twilio.com/docs/sms/quickstart",
  "https://www.twilio.com/docs/api/errors",
  "https://www.twilio.com/docs/usage/webhooks",
];

const DOMAIN = "https://www.twilio.com";
const MAX_PAGES = 100; // Limit to prevent infinite crawl (you can increase if needed)
const DELAY_MS = 1000;

const visited = new Set();
const queue = [...START_URLS];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapePage(url) {
  console.log(`📄 Scraping: ${url}`);
  await delay(DELAY_MS);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (TwilioDocScraper/2.0)",
      },
    });

    const $ = cheerio.load(data);
    $("nav, footer, header, .sidebar, .site-header, .site-footer").remove();

    const title = $("h1").first().text().trim();
    const content =
      $("main").text() || $(".docs-content").text() || $("article").text();

    const codeBlocks = $("pre code")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    // Discover new internal links
    const links = $("a[href]")
      .map((_, a) => $(a).attr("href"))
      .get()
      .filter(
        (href) =>
          href &&
          href.startsWith("/docs/") &&
          !href.includes("#") &&
          !href.includes("?")
      )
      .map((href) => (href.startsWith("/") ? DOMAIN + href : href));

    // Add discovered links to queue
    for (const link of links) {
      if (!visited.has(link) && queue.length < MAX_PAGES) {
        queue.push(link);
      }
    }

    return {
      url,
      title,
      paragraphs,
      codeBlocks,
      content: content.trim(),
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`❌ Failed to scrape ${url}:`, err.message);
    return null;
  }
}

async function main() {
  const results = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    const pageData = await scrapePage(currentUrl);
    if (pageData) results.push(pageData);
  }

  const dir = path.resolve("./data/twilio_docs");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "scraped_all.json");

  await fs.writeFile(filePath, JSON.stringify(results, null, 2));
  console.log(`✅ Scraped ${results.length} Twilio docs pages`);
  console.log(`📁 Saved to: ${filePath}`);
}

main().catch((err) => {
  console.error("🚨 Error:", err.message);
});
