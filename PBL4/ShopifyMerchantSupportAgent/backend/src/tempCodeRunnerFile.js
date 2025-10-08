// scraper.js
import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';

const SOURCES = [
   { category: "helpCenter", url: "https://help.shopify.com/"},
   {category: "manual", url:"https://help.shopify.com/manual"},
  ];

const OUTPUT_DIR = './data/shopify_docs/';

async function scrapePage(url, category) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log(`🔗 Visiting ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Remove unwanted elements using JS in the page
  await page.evaluate(() => {
    const selectors = ['nav', 'footer', '.stripe-header', '.stripe-footer', '.sidebar'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });
  });

  // Extract main content
  const content = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText : document.body.innerText;
  });

  const title = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? h1.innerText : document.title;
  });

  await browser.close();

  return {
    url,
    category,
    title: title.trim(),
    content: content.trim(),
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
  await fs.ensureDir(OUTPUT_DIR);

  const results = [];

  for (const { category, url } of SOURCES) {
    try {
      const pageData = await scrapePage(url, category);
      results.push(pageData);

      const fileName = url.replace(/https:\/\/stripe.com\/docs\//, '').replace(/\//g, '_') || 'index';
      await fs.writeJson(path.join(OUTPUT_DIR, `${fileName}.json`), pageData, { spaces: 2 });

      console.log(`✅ Saved ${fileName}.json`);
    } catch (error) {
      console.error(`❌ Failed to scrape ${url}:`, error.message);
    }
  }

  console.log(`🎉 Scraped ${results.length} pages.`);
}

main();

