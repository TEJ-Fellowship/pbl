const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const DOC_URLS = [
  "https://support.discord.com/hc/en-us/articles/360045138571",
  "https://support.discord.com/hc/en-us/articles/206029707",
  "https://support.discord.com/hc/en-us/sections/360008589993"
];

async function scrapeDiscordDocs() {
  const outputDir = path.join(__dirname, "../data/raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const url of DOC_URLS) {
    console.log(`🕷️  Scraping: ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const text = await page.evaluate(() => document.body.innerText);
      const fileName = url.split("/").pop().replace(/\W+/g, "_") + ".txt";
      fs.writeFileSync(path.join(outputDir, fileName), text);
      console.log(`✅ Saved: ${fileName}`);
    } catch (err) {
      console.error(`❌ Failed to scrape ${url}:`, err.message);
    }
  }

  await browser.close();
  console.log("🎉 Scraping completed!");
}

scrapeDiscordDocs();
