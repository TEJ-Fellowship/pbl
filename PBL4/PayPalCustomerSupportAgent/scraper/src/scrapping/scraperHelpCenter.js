import fs from "fs";
import { chromium } from "playwright";
import { HELP_TOPICS } from "./topics.js";

const outputPath = "../data/scrapedData.json";

async function scrapeHelpCenter() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const topic of HELP_TOPICS) {
    console.log(`Scraping: ${topic.topic}`);
    await page.goto(topic.url, { waitUntil: "domcontentloaded" });

    try {
      await page.waitForSelector("[data-testid='hc-topic-accordion-list']", { timeout: 20000 });
    } catch {
      console.warn(`Skipped ${topic.topic}: accordion list not found`);
      continue;
    }

    const sections = await page.$$("[data-testid='hc-topic-accordion-list'] > div");
    const sectionData = [];

    for (const section of sections) {
      const title = await section.$eval("button, h3, h2, div", el => el.innerText.trim()).catch(() => null);
      if (!title) continue;

      try {
        const btn = await section.$("button");
        if (btn) await btn.click();
      } catch {}

      const questionLinks = await section.$$eval("a[href*='/cshelp/article/']", links =>
        links.map(link => ({
          question: link.innerText.trim(),
          url: link.href
        }))
      );

      if (questionLinks.length > 0) {
        sectionData.push({ title, questions: questionLinks });
      }
    }

    results.push({
      topic: topic.topic,
      url: topic.url,
      sections: sectionData,
    });
  }

  await browser.close();
  fs.mkdirSync("../data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved to ${outputPath}`);
}

scrapeHelpCenter().catch(console.error);
