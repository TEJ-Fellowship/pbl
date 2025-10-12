import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import puppeteer from "puppeteer";
import { cleanHtmlText, sanitizeFilename } from "./utils/cleaner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Shopify documentation sources with comprehensive coverage
const SOURCES = {
  // Core Shopify Concepts
  getting_started:
    "https://help.shopify.com/en/manual/intro-to-shopify/getting-started",
  what_is_shopify:
    "https://help.shopify.com/en/manual/intro-to-shopify/what-is-shopify",
  shopify_overview: "https://help.shopify.com/en/manual/intro-to-shopify",

  // Product Management
  products: "https://help.shopify.com/en/manual/products",
  product_creation:
    "https://help.shopify.com/en/manual/products/adding-products",
  product_variants: "https://help.shopify.com/en/manual/products/variants",
  product_inventory: "https://help.shopify.com/en/manual/products/inventory",

  // Order Management
  orders: "https://help.shopify.com/en/manual/orders",
  order_fulfillment: "https://help.shopify.com/en/manual/orders/fulfill-orders",
  order_shipping: "https://help.shopify.com/en/manual/shipping",

  // Store Setup & Configuration
  store_setup: "https://help.shopify.com/en/manual/shopify-admin/setup",
  payment_setup: "https://help.shopify.com/en/manual/payments",
  tax_setup: "https://help.shopify.com/en/manual/taxes",

  // Themes & Customization
  themes: "https://help.shopify.com/en/manual/online-store/themes",
  theme_customization:
    "https://help.shopify.com/en/manual/online-store/themes/customize-theme",
  liquid_templates: "https://shopify.dev/docs/themes/liquid",

  // API Documentation - Comprehensive coverage
  api_overview: "https://shopify.dev/docs/api",
  api_admin_graphql: "https://shopify.dev/docs/api/admin-graphql",
  api_admin_rest: "https://shopify.dev/docs/api/admin-rest",
  api_storefront: "https://shopify.dev/docs/api/storefront",

  // Specific API Objects
  api_products:
    "https://shopify.dev/docs/api/admin-graphql/latest/objects/product",
  api_orders: "https://shopify.dev/docs/api/admin-graphql/latest/objects/order",
  api_customers:
    "https://shopify.dev/docs/api/admin-graphql/latest/objects/customer",
  api_inventory:
    "https://shopify.dev/docs/api/admin-graphql/latest/objects/inventoryitem",

  // App Development
  app_development: "https://shopify.dev/docs/apps",
  webhooks: "https://shopify.dev/docs/apps/webhooks",

  // Help Center
  help_center: "https://help.shopify.com/en",
  community_forum: "https://community.shopify.com/",
};

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function determineMerchantLevel({ content, section }) {
  const advancedKeywords = [
    "api",
    "graphql",
    "liquid",
    "webhook",
    "metafield",
    "script tag",
    "theme development",
    "javascript",
    "css",
    "html",
    "custom code",
    "integration",
    "automation",
    "bulk operations",
    "csv import",
    "developer",
    "programming",
    "customize theme",
  ];
  const beginnerKeywords = [
    "getting started",
    "setup",
    "basic",
    "simple",
    "first time",
    "new to",
    "introduction",
    "overview",
    "getting set up",
    "checklist",
    "tutorial",
  ];
  const lower = (content || "").toLowerCase();
  const sec = (section || "").toLowerCase();

  // Explicit section priority
  if (
    sec === "getting_started" ||
    sec.includes("getting-started") ||
    sec.includes("getting_started")
  ) {
    return "beginner";
  }

  // Score content signals
  const advHits = advancedKeywords.reduce(
    (n, k) => n + (lower.includes(k) ? 1 : 0),
    0
  );
  const begHits = beginnerKeywords.reduce(
    (n, k) => n + (lower.includes(k) ? 1 : 0),
    0
  );

  // Section-based defaults for core operational docs
  const isOpsSection = sec.includes("products") || sec.includes("orders");

  // If there are strong advanced signals, classify as advanced regardless of beginner mentions
  if (advHits >= 2 || (advHits >= 1 && !begHits)) {
    return "advanced";
  }

  // Beginner-only content
  if (begHits >= 1 && advHits === 0) {
    return "beginner";
  }

  // Default to intermediate for operational sections when signals are mixed/neutral
  if (isOpsSection) {
    return "intermediate";
  }

  // Fallback
  return "beginner";
}

// async function scrapeDoc(url, section, browser) {
//   // Render via Puppeteer to avoid 403 and JS-rendered content
//   const page = await browser.newPage();
//   // Block non-essential resources for performance
//   await page.setRequestInterception(true);
//   page.on("request", (req) => {
//     const type = req.resourceType();
//     if (
//       type === "image" ||
//       type === "media" ||
//       type === "font" ||
//       type === "stylesheet" ||
//       type === "websocket"
//     ) {
//       req.abort();
//     } else {
//       req.continue();
//     }
//   });
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
//   );
//   await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
//   await page
//     .waitForSelector("main, article, body", { timeout: 15000 })
//     .catch(() => {});
//   const html = await page.content();
//   const $ = cheerio.load(html);
//   $("nav, footer, header, .site-nav, .sidebar, .toc, .breadcrumb").remove();

//   const mainContent =

//     $("main").text() ||

//     $(".ProseMirror, .Docs__Content").text() || // Dev docs
//     $("#main-content").text() ||   //forums
//     $("article").text() ||
//     $("body").text();

//   const title = $("h1").first().text() || $("title").text();
//   const cleaned = cleanHtmlText(mainContent);
//   await page.close();
//   const merchant_level = determineMerchantLevel({ content: cleaned, section });
//   return {
//     url,
//     section,
//     title: (title || section).trim(),
//     content: cleaned,
//     merchant_level,
//     scrapedAt: new Date().toISOString(),
//   };
// }

async function scrapeDoc(url, section, browser) {
  const page = await browser.newPage();

  // 🚀 Block non-essential requests for faster scraping
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (
      ["image", "media", "font", "stylesheet", "websocket", "other"].includes(
        type
      )
    ) {
      req.abort();
    } else req.continue();
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForSelector("main, article, body, .content", {
      timeout: 20000,
    });
  } catch (error) {
    console.log(`⚠️ Timeout for ${url}, proceeding with available content`);
  }

  const html = await page.content();
  const $ = cheerio.load(html);

  // 🧹 Enhanced noise removal
  $(
    "nav, footer, header, .site-nav, .sidebar, .toc, .breadcrumb, .search-bar, .cookie-banner, .advertisement, script, style"
  ).remove();

  // Remove common navigation elements
  $(
    ".navigation, .nav, .menu, .header, .footer, .sidebar, .toc, .breadcrumb"
  ).remove();

  // Remove Shopify-specific navigation
  $(
    ".site-header, .site-footer, .site-nav, .breadcrumb, .toc, .search, .cookie-notice"
  ).remove();

  let title = "";
  let mainContent = "";
  const contentBlocks = [];
  const structuredContent = [];

  // 🎯 Enhanced content extraction based on site type
  if (url.includes("shopify.dev")) {
    // Developer documentation
    title = $("h1").first().text().trim() || $("title").text().trim();

    // Extract main content with better selectors
    const contentSelectors = [
      ".Docs__Content",
      ".content",
      "main",
      "article",
      ".prose",
      ".markdown-body",
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }

    // Extract structured content (headings, lists, etc.)
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const heading = $(el).text().trim();
      if (heading) {
        structuredContent.push({
          type: "heading",
          level: el.tagName.toLowerCase(),
          content: heading,
        });
      }
    });

    // Extract code examples with better detection
    $("pre code, code").each((_, el) => {
      const code = $(el).text().trim();
      if (code && code.length > 10) {
        const language =
          $(el)
            .attr("class")
            ?.match(/language-(\w+)/)?.[1] || "javascript";
        contentBlocks.push({ type: "code", language, content: code });
      }
    });

    // Extract API examples
    $("pre").each((_, el) => {
      const preText = $(el).text().trim();
      if (
        preText.includes("curl") ||
        preText.includes("POST") ||
        preText.includes("GET") ||
        preText.includes("mutation")
      ) {
        contentBlocks.push({ type: "api", content: preText });
      }
    });
  } else if (url.includes("help.shopify.com")) {
    // Help center documentation
    title = $("h1").first().text().trim() || $("title").text().trim();

    // Extract help content
    const helpSelectors = [
      ".help-content",
      ".content",
      "main",
      "article",
      ".help-article",
    ];

    for (const selector of helpSelectors) {
      const content = $(selector).text().trim();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }

    // Extract step-by-step instructions
    $("ol li, ul li").each((_, el) => {
      const step = $(el).text().trim();
      if (step && step.length > 20) {
        structuredContent.push({ type: "step", content: step });
      }
    });
  } else if (url.includes("community.shopify.com")) {
    // Community forum
    title =
      $(".lia-message-subject").first().text().trim() ||
      $("title").text().trim();

    const question = $(".lia-message-body-content").first().text().trim();
    const acceptedAnswer = $(
      ".lia-message-body-content:contains('Accepted Solution')"
    )
      .text()
      .trim();
    const replies = $(".lia-message-body-content")
      .slice(1, 4)
      .map((_, el) => $(el).text().trim())
      .get();

    mainContent = [question, acceptedAnswer, ...replies]
      .filter(Boolean)
      .join("\n\n---\n\n");
  }

  // Fallback content extraction
  if (!mainContent) {
    mainContent = $("main").text() || $("article").text() || $("body").text();
  }

  // ✨ Enhanced text cleaning
  let cleaned = cleanHtmlText(mainContent);

  // Remove common noise patterns
  cleaned = cleaned
    .replace(/Skip to main content/g, "")
    .replace(/Collapse sidebar/g, "")
    .replace(/Assistant/g, "")
    .replace(/Shopify uses cookies.*?functionality and improv[^.]*\./g, "")
    .replace(/window\.__[^;]*;/g, "")
    .replace(/import\s+[^;]*;/g, "")
    .replace(/console\.log\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Determine merchant level with enhanced logic
  const merchant_level = determineMerchantLevel({
    content: cleaned,
    section,
    url,
  });

  await page.close();

  return {
    url,
    section,
    title: (title || section).trim(),
    content: cleaned,
    code_blocks: contentBlocks.length ? contentBlocks : undefined,
    structured_content: structuredContent.length
      ? structuredContent
      : undefined,
    merchant_level,
    scrapedAt: new Date().toISOString(),
    content_length: cleaned.length,
    word_count: cleaned.split(/\s+/).length,
  };
}

async function main() {
  const outDir = path.join(__dirname, "../data/shopify_docs");
  await fs.mkdir(outDir, { recursive: true });
  const docs = [];
  const browser = await puppeteer.launch({ headless: "new" });
  for (const [section, url] of Object.entries(SOURCES)) {
    console.log(`Scraping ${section} -> ${url}`);
    try {
      const doc = await scrapeDoc(url, section, browser);
      docs.push(doc);
      const fname = sanitizeFilename(section) + ".json";
      await fs.writeFile(
        path.join(outDir, fname),
        JSON.stringify(doc, null, 2),
        "utf-8"
      );
      console.log(`Saved ${fname} (${doc.content.length} chars)`);
    } catch (err) {
      console.error(
        `Failed to scrape ${section}:`,
        err?.response?.status || err.message
      );
    }
  }
  await browser.close();
  await fs.writeFile(
    path.join(outDir, "scraped.index.json"),
    JSON.stringify(docs, null, 2),
    "utf-8"
  );
  console.log(`✅ Scraped ${docs.length} documents`);
}

if (import.meta.url === pathToFileURL(__filename).href) {
  console.log("Starting scraper...");
  main().catch((e) => {
    console.error("Scraper failed:", e?.message || e);
    process.exit(1);
  });
}
