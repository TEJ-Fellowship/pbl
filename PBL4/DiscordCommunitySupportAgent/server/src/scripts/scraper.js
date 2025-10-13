#!/usr/bin/env node

import ScraperService from "../services/scraperService.js";
import Formatters from "../utils/formatters.js";

class ScraperScript {
  constructor() {
    this.scraperService = new ScraperService();
  }

  async run() {
    try {
      console.log(Formatters.formatHeader("Discord Support Scraper"));
      console.log(
        Formatters.formatInfo(
          "This script will scrape Discord support documentation"
        )
      );

      // Start scraping
      const scrapedData = await this.scraperService.scrapeAllPages();

      console.log(
        Formatters.formatSuccess(
          `Scraping completed! Scraped ${scrapedData.length} pages`
        )
      );

      // Display summary
      console.log(Formatters.formatHeader("Scraping Summary"));
      scrapedData.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title}`);
        console.log(`   URL: ${doc.url}`);
        console.log(`   Type: ${doc.type}`);
        console.log(`   Content Length: ${doc.content.length} characters`);
        console.log("");
      });
    } catch (error) {
      console.error(
        Formatters.formatError(`Scraping failed: ${error.message}`)
      );
      process.exit(1);
    }
  }
}

// Run the scraper
const scraper = new ScraperScript();
scraper.run();
