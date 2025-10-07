import fs from "fs";
import { chromium } from "playwright";

const inputPath = "../data/scrapedData.json";
const outputPath = "../data/cleanHelpCenter.json";

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
      return true;
    } catch (err) {
      console.warn(`[${i + 1}/${retries}] Failed to load ${url}: ${err.message}`);
      if (i === retries - 1) return false;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  return false;
}

async function extractContent(page) {
  try {
    await page.waitForSelector('[data-testid="hc-article-content-body"]', { timeout: 10000 });
    const text = await page.$eval('[data-testid="hc-article-content-body"]', el => el.innerText.trim());
    return text || null;
  } catch (err) {
    console.warn(`Content extraction failed: ${err.message}`);
    return null;
  }
}

async function cleanHelpCenter() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const scrapedData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const cleanedResults = [];

  for (const topicData of scrapedData) {
    for (const section of topicData.sections) {
      const cleanQuestions = [];

      for (const q of section.questions) {
        console.log(`Extracting: ${q.question}`);

        const ok = await safeGoto(page, q.url);
        if (!ok) {
          console.warn(`Skipped (failed to load): ${q.url}`);
          cleanQuestions.push({ question: q.question, content: null });
          continue;
        }

        const content = await extractContent(page);
        if (!content) console.warn(`Empty content for: ${q.url}`);

        cleanQuestions.push({
          question: q.question,
          content,
          url: q.url,
        });
        await new Promise(res => setTimeout(res, 1500));
      }

      cleanedResults.push({
        topic: topicData.topic,
        title: section.title,
        questions: cleanQuestions,
      });
    }
  }

  await browser.close();

  fs.mkdirSync("../data", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(cleanedResults, null, 2));
  console.log(`Cleaned data saved to ${outputPath}`);
}

cleanHelpCenter().catch(err => {
  console.error("Script crashed:", err);
});
