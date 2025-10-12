import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOC_URLS = [
  // Core Discord Support Articles
  "https://support.discord.com/hc/en-us/articles/360045138571", // Discord Beginner's Guide
  "https://support.discord.com/hc/en-us/articles/206029707",    // Discord Permissions Guide
  "https://support.discord.com/hc/en-us/articles/228383668",    // Bot Integration Guide
  
  // Additional Discord Support Articles (we'll find valid ones)
  "https://support.discord.com/hc/en-us/articles/115004077663-Discord-Server-Setup-Guide",
  "https://support.discord.com/hc/en-us/articles/115004077663-Discord-Community-Guidelines",
  
  // Discord Developer Documentation
  "https://discord.com/developers/docs/intro",
  "https://discord.com/developers/docs/resources/webhook",
  "https://discord.com/developers/docs/topics/oauth2",
  
  // Discord Policies
  "https://discord.com/guidelines",
  "https://support.discord.com/hc/en-us/sections/360000045712-Safety-Privacy"
];

async function scrapeDiscordDocs() {
  const outputDir = path.join(__dirname, "../data/raw");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({ 
    headless: false, // Set to false to bypass Cloudflare
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set user agent to mimic a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Set viewport
  await page.setViewport({ width: 1366, height: 768 });

  for (const url of DOC_URLS) {
    console.log(`🕷️  Scraping: ${url}`);
    try {
      // Navigate with longer timeout and wait for network to be idle
      await page.goto(url, { 
        waitUntil: "networkidle2",
        timeout: 30000 
      });
      
      // Wait a bit more for Cloudflare to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if we got past Cloudflare
      const pageContent = await page.content();
      if (pageContent.includes("Just a moment") || pageContent.includes("Enable JavaScript")) {
        console.log(`⚠️  Cloudflare challenge detected for ${url}, waiting longer...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      const text = await page.evaluate(() => {
        // Try to get the main content area
        const mainContent = document.querySelector('.article-body') || 
                           document.querySelector('.article-content') ||
                           document.querySelector('main') ||
                           document.querySelector('.content') ||
                           document.body;
        return mainContent.innerText;
      });
      
      const fileName = url.split("/").pop().replace(/\W+/g, "_") + ".txt";
      fs.writeFileSync(path.join(outputDir, fileName), text);
      console.log(`✅ Saved: ${fileName} (${text.length} characters)`);
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.error(`❌ Failed to scrape ${url}:`, err.message);
    }
  }

  await browser.close();
  console.log("🎉 Scraping completed!");
}

scrapeDiscordDocs();
