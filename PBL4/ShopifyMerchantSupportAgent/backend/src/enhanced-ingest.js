// Enhanced data ingestion script with improved scraping and chunking
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { processDocuments } from "./utils/enhanced-chunker.js";
import { connectDB } from "../config/db.js";
import { getPineconeIndex } from "../config/pinecone.js";
import { embedTexts } from "./utils/embeddings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced Shopify documentation sources
const ENHANCED_SOURCES = {
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

async function scrapeEnhancedData() {
  console.log("🚀 Starting enhanced Shopify data scraping...");

  const { default: puppeteer } = await import("puppeteer");
  const { default: cheerio } = await import("cheerio");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const documents = [];

  for (const [section, url] of Object.entries(ENHANCED_SOURCES)) {
    console.log(`📄 Scraping ${section}: ${url}`);

    try {
      const page = await browser.newPage();

      // Enhanced request blocking
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const type = req.resourceType();
        if (
          [
            "image",
            "media",
            "font",
            "stylesheet",
            "websocket",
            "other",
          ].includes(type)
        ) {
          req.abort();
        } else req.continue();
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
      );

      await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
      await page.waitForSelector("main, article, body, .content", {
        timeout: 20000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      // Enhanced noise removal
      $(
        "nav, footer, header, .site-nav, .sidebar, .toc, .breadcrumb, .search-bar, .cookie-banner, .advertisement, script, style"
      ).remove();
      $(
        ".navigation, .nav, .menu, .header, .footer, .sidebar, .toc, .breadcrumb"
      ).remove();
      $(
        ".site-header, .site-footer, .site-nav, .breadcrumb, .toc, .search, .cookie-notice"
      ).remove();

      let title = "";
      let mainContent = "";
      const contentBlocks = [];
      const structuredContent = [];

      // Enhanced content extraction
      if (url.includes("shopify.dev")) {
        title = $("h1").first().text().trim() || $("title").text().trim();

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

        // Extract structured content
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

        // Extract code examples
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
      } else if (url.includes("help.shopify.com")) {
        title = $("h1").first().text().trim() || $("title").text().trim();

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
        mainContent =
          $("main").text() || $("article").text() || $("body").text();
      }

      // Enhanced text cleaning
      let cleaned = mainContent
        .replace(/Skip to main content/g, "")
        .replace(/Collapse sidebar/g, "")
        .replace(/Assistant/g, "")
        .replace(/Shopify uses cookies.*?functionality and improv[^.]*\./g, "")
        .replace(/window\.__[^;]*;/g, "")
        .replace(/import\s+[^;]*;/g, "")
        .replace(/console\.log\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // Determine merchant level
      const merchant_level = determineMerchantLevel({
        content: cleaned,
        section,
        url,
      });

      const document = {
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

      documents.push(document);

      // Save individual document
      const outDir = path.join(__dirname, "../data/shopify_docs");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(
        path.join(outDir, `${section}.json`),
        JSON.stringify(document, null, 2),
        "utf-8"
      );

      console.log(
        `✅ Saved ${section}: ${cleaned.length} chars, ${document.word_count} words`
      );

      await page.close();

      // Delay between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to scrape ${section}:`, error.message);
    }
  }

  await browser.close();

  // Save comprehensive index
  const outDir = path.join(__dirname, "../data/shopify_docs");
  await fs.writeFile(
    path.join(outDir, "enhanced-scraped.index.json"),
    JSON.stringify(documents, null, 2),
    "utf-8"
  );

  console.log(`📊 Enhanced scraping completed: ${documents.length} documents`);
  return documents;
}

function determineMerchantLevel({ content, section, url }) {
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

  if (sec === "getting_started" || sec.includes("getting-started")) {
    return "beginner";
  }

  const advHits = advancedKeywords.reduce(
    (n, k) => n + (lower.includes(k) ? 1 : 0),
    0
  );
  const begHits = beginnerKeywords.reduce(
    (n, k) => n + (lower.includes(k) ? 1 : 0),
    0
  );

  if (advHits >= 2 || (advHits >= 1 && !begHits)) {
    return "advanced";
  }

  if (begHits >= 1 && advHits === 0) {
    return "beginner";
  }

  return "intermediate";
}

async function createEnhancedChunks(documents) {
  console.log("🔧 Creating enhanced chunks...");

  const chunks = processDocuments(documents, {
    chunkSizeTokens: 1200, // Larger chunks for better context
    chunkOverlapTokens: 200,
    preserveCodeBlocks: true,
    preserveHeadings: true,
    preserveLists: true,
    minChunkSize: 200,
  });

  // Save chunks
  const chunksDir = path.join(__dirname, "../data/chunks");
  await fs.mkdir(chunksDir, { recursive: true });

  // Group chunks by section
  const chunksBySection = {};
  chunks.forEach((chunk) => {
    const section = chunk.metadata.section;
    if (!chunksBySection[section]) {
      chunksBySection[section] = [];
    }
    chunksBySection[section].push(chunk);
  });

  // Save individual chunk files
  for (const [section, sectionChunks] of Object.entries(chunksBySection)) {
    await fs.writeFile(
      path.join(chunksDir, `chunks_${section}.json`),
      JSON.stringify(sectionChunks, null, 2),
      "utf-8"
    );
    console.log(`📄 Saved ${sectionChunks.length} chunks for ${section}`);
  }

  console.log(`📊 Total chunks created: ${chunks.length}`);
  return chunks;
}

async function ingestToPinecone(chunks) {
  console.log("🌲 Ingesting chunks to Pinecone...");

  const index = await getPineconeIndex();

  // Process in batches
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `📦 Processing batch ${i + 1}/${batches.length} (${batch.length} chunks)`
    );

    // Create embeddings for batch
    const texts = batch.map((chunk) => chunk.text);
    const embeddings = await embedTexts(texts);

    // Prepare vectors for Pinecone
    const vectors = batch.map((chunk, index) => ({
      id: chunk.id,
      values: embeddings[index],
      metadata: {
        ...chunk.metadata,
        text: chunk.text.substring(0, 1000), // Truncate for metadata
      },
    }));

    // Upsert to Pinecone
    await index.upsert(vectors);

    console.log(`✅ Upserted batch ${i + 1}/${batches.length}`);

    // Delay between batches
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("🎉 Pinecone ingestion completed!");
}

async function main() {
  try {
    console.log("🚀 Starting enhanced Shopify data ingestion...");

    // Step 1: Scrape enhanced data
    const documents = await scrapeEnhancedData();

    // Step 2: Create enhanced chunks
    const chunks = await createEnhancedChunks(documents);

    // Step 3: Ingest to Pinecone
    await ingestToPinecone(chunks);

    console.log("🎉 Enhanced data ingestion completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Chunks: ${chunks.length}`);
    console.log(
      `   Categories: ${
        [...new Set(chunks.map((c) => c.metadata.category))].length
      }`
    );
  } catch (error) {
    console.error("❌ Enhanced ingestion failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
