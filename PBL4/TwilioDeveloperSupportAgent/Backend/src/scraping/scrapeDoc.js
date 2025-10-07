import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const urls = [
  "https://www.twilio.com/docs/sms",
  "https://www.twilio.com/docs/api/errors",
  "https://www.twilio.com/docs/usage/webhooks",
];

async function scrapeDocs() {
  const docs = [];

  for (const url of urls) {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const text = $("body").text();
    docs.push({ url, text });
  }

  fs.writeFileSync("./data/rawDocs.json", JSON.stringify(docs, null, 2));
  console.log("✅ Docs scraped and saved!");
}

scrapeDocs();
