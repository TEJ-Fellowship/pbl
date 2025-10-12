import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import config from "../config/config.js";

const SOURCES = {
  gettingstarted: "https://mailchimp.com/help/getting-started-with-mailchimp/",
  campaigncreation:
    "https://mailchimp.com/help/getting-started-with-campaigns/",
  listmanage: "https://mailchimp.com/help/getting-started-audience/",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeDoc(url, category) {
  console.log(`🔍 Scraping ${category}: ${url}`);

  try {
    await delay(parseInt(config.RATE_LIMIT_DELAY) || 1000);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    $("nav, footer, .sidebar, .header, aside").remove();

    // Extract main content
    let mainContent = $(".content--main").first();

    if (!mainContent.length) {
      console.log("No .content--main found, trying alternative selectors");
      mainContent = $("main").first();
    }

    if (!mainContent.length) {
      console.log("No main found, trying article");
      mainContent = $("article").first();
    }

    if (!mainContent.length) {
      console.log("No suitable content container found");
      return null;
    }

    const title = mainContent.find("h1").first().text().trim();

    console.log("content before cleaning", mainContent.html());

    let sections = [];

    // First, extract sections without headings (like the introduction)
    mainContent.find("section").each((_, section) => {
      const $section = $(section);
      const hasHeading = $section.find("h2, h3").length > 0;

      if (!hasHeading) {
        const content = $section.text().trim();
        if (content && content.length > 50) {
          sections.push({
            heading: title,
            content: content.replace(/\s+/g, " "),
          });
        }
      }
    });

    // Now extracting all h2/h3 sections
    mainContent.find("h2, h3").each((_, heading) => {
      const headingText = $(heading).text().trim();
      let content = "";
      let next = $(heading).next();
      while (next.length && !next.is("h2, h3")) {
        content += " " + next.text().trim();
        next = next.next();
      }
      if (headingText && content.trim()) {
        sections.push({
          heading: headingText,
          content: content.trim().replace(/\s+/g, " "),
        });
      }
    });

    return {
      id: `${category}_${Date.now()}`,
      url,
      category,
      title,
      sections,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping ${category}:`, error.message);
  }
}

async function main() {
  console.log("Scraping the data...\n");

  const docs = [];

  for (const [category, url] of Object.entries(SOURCES)) {
    console.log(`Scraping ${category}...`);
    try {
      const doc = await scrapeDoc(url, category);
      docs.push(doc);
    } catch (err) {
      console.error("Error in scraping", err.message);
    }
  }

  const dir = path.resolve("./data/mailerbyte_docs");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "scraped.json"),
    JSON.stringify(docs, null, 2),
    "utf-8"
  );

  console.log(`✅ Scraped ${docs.length} documents`);
}

main();
