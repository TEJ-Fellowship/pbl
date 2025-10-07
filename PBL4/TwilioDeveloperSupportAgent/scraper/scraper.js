import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const SOURCES = {
  api: "https://www.twilio.com/docs/usage/api",
  sms_quickstart: "https://www.twilio.com/docs/sms/quickstart",
  errors: "https://www.twilio.com/docs/api/errors",
  webhooks: "https://www.twilio.com/docs/usage/webhooks",
};

async function scrapeDoc(url, category) {
  // Delay between requests to avoid hitting rate limits
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (TwilioDocScraper/1.0)",
    },
  });

  const $ = cheerio.load(response.data);

  // Remove non-content sections
  $("nav, footer, .sidebar, header, .site-footer, .site-header").remove();

  // Extract main content (Twilio uses <main> or .docs-content)
  const mainContent =
    $("main").text() || $(".docs-content").text() || $("article").text();

  const title = $("h1").first().text();

  // Extract code snippets (helpful for quickstart)
  const codeBlocks = $("pre code")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  // Extract paragraphs for better readability
  const paragraphs = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  return {
    url,
    category,
    title: title.trim(),
    content: mainContent.trim(),
    codeBlocks,
    paragraphs,
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
  const docs = [];

  for (const [category, url] of Object.entries(SOURCES)) {
    console.log(`📄 Scraping ${category}...`);
    const doc = await scrapeDoc(url, category);
    docs.push(doc);
  }

  const dir = path.resolve("./data/twilio_docs");
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(
    path.join(dir, "scraped.json"),
    JSON.stringify(docs, null, 2),
    "utf-8"
  );

  console.log(`✅ Scraped ${docs.length} Twilio documents`);
  console.log(`📁 Saved to: ${path.join(dir, "scraped.json")}`);
}

main().catch((err) => {
  console.error("❌ Scraping failed:", err.message);
});
