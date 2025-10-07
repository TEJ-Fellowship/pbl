const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrape PayPal Buyer Protection Legal page
 * @param {string} url - Page URL
 * @param {string} outputFile - JSON file to save
 * @param {number} chunkSize - Optional: max words per section chunk
 */
async function scrapeBuyerProtectionLegal(url, outputFile, chunkSize = 500) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (compatible; ScraperBot/1.0)');
  await page.goto(url, { waitUntil: 'networkidle2' });

  const html = await page.content();
  const $ = cheerio.load(html);

  const result = { page: url, sections: [] };

  let currentTitle = '';
  let currentContent = '';

  $('body').find('h2, h3, p, ul, ol').each((i, elem) => {
    const tag = elem.tagName.toLowerCase();
    const text = $(elem).text().trim();
    if (!text) return;

    // Treat headings as new section
    if (tag === 'h2' || tag === 'h3') {
      if (currentContent) {
        // Split large content into chunks if needed
        const chunks = splitContent(currentContent, chunkSize);
        chunks.forEach((chunk, idx) => {
          result.sections.push({
            title: currentTitle + (idx > 0 ? ` (Part ${idx + 1})` : ''),
            type: 'text',
            content: chunk
          });
        });
      }
      currentTitle = text;
      currentContent = '';
    } else if (tag === 'p' || tag === 'ul' || tag === 'ol') {
      currentContent += text + '\n';
    }
  });

  // Push last section
  if (currentContent) {
    const chunks = splitContent(currentContent, chunkSize);
    chunks.forEach((chunk, idx) => {
      result.sections.push({
        title: currentTitle + (idx > 0 ? ` (Part ${idx + 1})` : ''),
        type: 'text',
        content: chunk
      });
    });
  }

  await browser.close();

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`✅ Buyer Protection Legal data saved to ${outputFile}`);
}

/**
 * Split text content into chunks of approx maxWords each
 */
function splitContent(text, maxWords) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

// Example usage
(async () => {
  await scrapeBuyerProtectionLegal(
    'https://www.paypal.com/us/legalhub/paypal/buyer-protection',
    'legalTerms_buyer_protection.json'
  );
})();
