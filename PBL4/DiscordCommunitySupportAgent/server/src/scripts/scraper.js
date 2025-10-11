#!/usr/bin/env node

import ScraperService from "../services/scraperService.js";

class ScraperScript {
  constructor() {
    this.scraperService = new ScraperService();
  }

  async run() {
    try {
      console.log("Discord Support Scraper");
      console.log("This script will scrape Discord support documentation");

      // Start scraping
      const scrapedData = await this.scraperService.scrapeAllPages();

      console.log(`Scraping completed! Scraped ${scrapedData.length} pages`);

      // Display summary
      console.log("Scraping Summary");
      scrapedData.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   URL: ${doc.url}`);
        console.log(`   Type: ${doc.type}`);
        console.log(`   Content Length: ${doc.content.length} characters`);
        console.log("");
      });
    } catch (error) {
      console.error(`Scraping failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the scraper
const scraper = new ScraperScript();
scraper.run();
