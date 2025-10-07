const fs = require("fs");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

/**
 * Scrape PayPal legal page (Seller Protection)
 * @param {string} url - Page URL
 * @param {string} outputFile - JSON file to save
 */
async function scrapeLegalPage(url, outputFile) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (compatible; ScraperBot/1.0)");

  // Navigate and wait for page HTML
  await page.goto(url, { timeout: 0, waitUntil: "domcontentloaded" });

  // Wait for first heading to appear (ensures main content loaded)
  await page.waitForSelector("h2", { timeout: 60000 });

  // Auto-scroll to load any lazy content
  await autoScroll(page);

  // Get HTML content
  const html = await page.content();
  const $ = cheerio.load(html);

  const result = { page: url, sections: [] };
  let currentTitle = "";
  let currentContent = "";

  $("body")
    .find("h2, h3, p, ul, ol")
    .each((i, elem) => {
      const tag = elem.tagName.toLowerCase();
      const text = $(elem).text().trim();
      if (!text) return;

      // Treat headings as new section
      if (tag === "h2" || tag === "h3") {
        if (currentContent) {
          result.sections.push({
            title: currentTitle,
            type: "text",
            content: currentContent.trim(),
          });
        }
        currentTitle = text;
        currentContent = "";
      } else if (tag === "p" || tag === "ul" || tag === "ol") {
        currentContent += text + "\n";
      }
    });

  // Push last section
  if (currentContent) {
    result.sections.push({
      title: currentTitle,
      type: "text",
      content: currentContent.trim(),
    });
  }

  await browser.close();

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`✅ sellerProtection page data saved to ${outputFile}`);
}

/**
 * Auto-scroll page to load lazy content
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Example usage
(async () => {
  await scrapeLegalPage(
    "https://www.paypal.com/us/webapps/mpp/security/seller-protection",
    "seller_protection.json"
  );
})();
