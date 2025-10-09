import axios from "axios";
import { load as loadHtml } from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE_URL = "https://www.foodmandu.com/";
const DATA_SOURCES = [
  "https://foodmandu.com/",
  "https://foodmandu.com/Home/About",
  "https://foodmandu.com/Home/AvailableAreas",
  "https://foodmandu.com/Home/DeliveryCharge",
  "https://foodmandu.com/page/payment-options",
  "https://foodmandu.com/Home/HowToOrder",
  "https://foodmandu.com/Home/Faqs",
  "https://foodmandu.com/Contact",
  "https://foodmandu.com/Home/TermsOfUse",
  "https://foodmandu.com/Home/PrivacyPolicy",
  "https://blog.foodmandu.com/",
  "https://foodmandu.com/Restaurant/",
  `${BASE_URL}Home/TermsAndPrivacy`,
  `${BASE_URL}Home/DeliveryCharges`,
  `${BASE_URL}FAQs`,
  `${BASE_URL}Home/Help`,
  `${BASE_URL}page/restaurant-partners`,
  `${BASE_URL}Home/AboutUs`,
  `${BASE_URL}Help`,
  `${BASE_URL}FAQ`,
  `${BASE_URL}page/coverage`,
  `${BASE_URL}page/payment-options`,
  `${BASE_URL}page/refund-policy`,
  `${BASE_URL}page/how-to-order`,
  `${BASE_URL}Contact`,
];

function cleanText(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\t\n\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function scrapeFoodmandu() {
  let allContent = [];

  for (const url of DATA_SOURCES) {
    try {
      const { data } = await axios.get(url, { responseType: "text" });
      const $ = loadHtml(data);

      // Remove unwanted elements
      $("header, footer, nav, script, style, noscript").remove();

      // Extract and clean main content
      const rawSections = [];
      $(".hero, .section, .container").each((i, el) => {
        const cleaned = cleanText($(el).text());
        if (cleaned.length >= 30) rawSections.push(cleaned);
      });

      // Deduplicate while preserving order
      const seen = new Set();
      const uniqueSections = rawSections.filter((section) => {
        if (seen.has(section)) return false;
        seen.add(section);
        return true;
      });

      allContent.push({ url, content: uniqueSections });
      console.log(`Scraped ${uniqueSections.length} sections from ${url}`);
    } catch (err) {
      console.error(`Error scraping ${url}:`, err.message);
    }
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputPath = path.join(__dirname, "foodmanduDocs.json");

  fs.writeFileSync(outputPath, JSON.stringify(allContent, null, 2));
  console.log(`✅ Finished scraping all sources!`);
}

// Run directly
if (process.argv[1].endsWith("foodmanduScraper.js")) {
  scrapeFoodmandu();
}

export { scrapeFoodmandu };
