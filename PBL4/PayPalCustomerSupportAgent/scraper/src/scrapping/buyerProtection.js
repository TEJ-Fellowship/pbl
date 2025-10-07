// scrape_buyer_protection.js
const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrape Buyer Protection page (text + FAQs)
 * @param {string} url - Page URL
 * @param {string} outputFile - JSON file to save
 */
async function scrapeBuyerProtection(url, outputFile) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (compatible; ScraperBot/1.0)');
  await page.goto(url, { waitUntil: 'networkidle2' });

  const html = await page.content();
  const $ = cheerio.load(html);

  const result = { page: url, sections: [] };
  let faqMode = false;
  let currentSection = null;

  $('body').find('h2, h3, h4, p, ul, ol').each((i, elem) => {
    const tag = elem.tagName.toLowerCase();
    const text = $(elem).text().trim();
    if (!text) return;

    // Detect FAQ section
    if (tag.startsWith('h') && text.toLowerCase().includes('frequently asked questions')) {
      faqMode = true;
      currentSection = { title: text, type: 'faq', content: [] };
      result.sections.push(currentSection);
      return;
    }

    // FAQ mode: capture Q/A
    if (faqMode) {
      if (tag.startsWith('h3') || tag.startsWith('h4')) {
        // Treat as question
        currentSection.content.push({ question: text, answer: '' });
      } else if (tag === 'p' || tag === 'ul' || tag === 'ol') {
        if (currentSection.content.length > 0) {
          const lastQA = currentSection.content[currentSection.content.length - 1];
          lastQA.answer += $(elem).text().trim() + '\n';
        }
      }
      return;
    }

    // Normal text sections
    if (tag.startsWith('h2') || tag.startsWith('h3') || tag.startsWith('h4')) {
      currentSection = { title: text, type: 'text', content: '' };
      result.sections.push(currentSection);
    } else if (tag === 'p' || tag === 'ul' || tag === 'ol') {
      if (!currentSection) {
        currentSection = { title: 'Introduction', type: 'text', content: '' };
        result.sections.push(currentSection);
      }
      currentSection.content += $(elem).text().trim() + '\n';
    }
  });

  await browser.close();

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`✅ Buyer Protection data saved to ${outputFile}`);
}

// Example usage
(async () => {
  await scrapeBuyerProtection(
    'https://www.paypal.com/us/digital-wallet/buyer-purchase-protection',
    'buyer_protection.json'
  );
})();
