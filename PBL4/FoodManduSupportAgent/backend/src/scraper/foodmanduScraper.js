import axios from "axios";
import { load as loadHtml } from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE_URL = "https://www.foodmandu.com/";
const DATA_SOURCES = [
  // Core pages
  "https://foodmandu.com/",
  "https://foodmandu.com/Home/About",
  "https://foodmandu.com/Home/AboutUs",

  // Help & Support (High Priority)
  "https://foodmandu.com/Help",
  "https://foodmandu.com/Home/Help",
  "https://foodmandu.com/FAQ",
  "https://foodmandu.com/Home/Faqs",
  "https://foodmandu.com/FAQs",

  // Delivery & Coverage
  "https://foodmandu.com/page/coverage",
  "https://foodmandu.com/Home/AvailableAreas",
  "https://foodmandu.com/Home/DeliveryCharge",
  "https://foodmandu.com/Home/DeliveryCharges",

  // Payment Methods (High Priority for intent classification)
  "https://foodmandu.com/page/payment-options",

  // Refund Policy (High Priority for refund requests)
  "https://foodmandu.com/page/refund-policy",

  // How to Order (High Priority for new users)
  "https://foodmandu.com/page/how-to-order",
  "https://foodmandu.com/Home/HowToOrder",

  // Restaurant Partners (for restaurant queries)
  "https://foodmandu.com/page/restaurant-partners",
  "https://foodmandu.com/Restaurant/",

  // Contact Information (for escalations)
  "https://foodmandu.com/Contact",

  // Policies
  "https://foodmandu.com/Home/TermsOfUse",
  "https://foodmandu.com/Home/TermsAndPrivacy",
  "https://foodmandu.com/Home/PrivacyPolicy",

  // Blog (optional - may have updates)
  "https://blog.foodmandu.com/",
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
