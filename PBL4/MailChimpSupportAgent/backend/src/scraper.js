import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const SOURCES = {
  gettingstarted: "https://mailchimp.com/help/getting-started-with-mailchimp/",
  campaigncreation:
    "https://mailchimp.com/help/getting-started-with-campaigns/",
  listmanage: "https://mailchimp.com/help/getting-started-audience/",
};

async function scrapeDoc(url, category) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limit

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  $("nav, footer, .sidebar, .header, aside").remove();
  const mainContent =
    $(".content--main").first() || $("main").text() || $("article").text();

  const title = mainContent.find("h1").first().text().trim();

  let sections = [];
  mainContent.find("h2, h3").each((_, heading) => {
    const headingText = $(heading).text().trim();
    let content = "";
    let next = $(heading).next();
    while (next.length && !next.is("h2, h3")) {
      content += next.text().trim();
      next = next.next();
    }
    if (headingText && content.trim()) {
      sections.push({
        heading: headingText,
        content: content.trim(),
      });
    }
  });

  return {
    url,
    category,
    title,
    sections,
    scrapedAt: new Date().toISOString(),
  };
}

async function main() {
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

  const dir = path.resolve("../data/mailerbyte_docs");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "scraped.json"),
    JSON.stringify(docs, null, 2),
    "utf-8"
  );

  console.log(`✅ Scraped ${docs.length} documents`);
}

main();
