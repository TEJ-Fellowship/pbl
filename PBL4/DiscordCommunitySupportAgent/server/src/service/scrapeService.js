import puppeteer, { TargetType } from "puppeteer";
import fs from "fs-extra";
import * as cheerio from "cheerio";
import { config } from "../config/index.js";

class ScraperService {
  constructor() {
    this.browser = null;
    this.scrapedData = [];
  }

  async initialize() {
    try {
      console.log("Initilizing puppeteer browser...");
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });
      console.log("Browser initilized successfully");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async scrapeAllPages() {
    try {
      await this.initialize();
      console.log("Starting Scrapping!....");

      const urls = [
        {
          url: config.urls.supportCenter,
          type: "support-center",
          name: "Discord Support Center",
        },
        {
          url: config.urls.serverSetup,
          type: "support",
          name: "Server Setup Guide",
        },
        {
          url: config.urls.rolesPermissions,
          type: "support",
          name: "Roles & Permissions",
        },
        {
          url: config.urls.moderation,
          type: "support-section",
          name: "Moderation Tools",
        },
        {
          url: config.urls.botIntegration,
          type: "support",
          name: "Bot Integration",
        },
        {
          url: config.urls.developerDocs,
          type: "developer",
          name: "Discord Developer Docs",
        },
        {
          url: config.urls.webhooks,
          type: "developer",
          name: "Webhooks Guide",
        },
        {
          url: config.urls.botAPI,
          type: "developer",
          name: "Bot API Reference",
        },
        {
          url: config.urls.guidelines,
          type: "guidelines",
          name: "Community Guidelines",
        },
        {
          url: config.urls.safetyPrivacy,
          type: "support-section",
          name: "Safety & Privacy",
        },
      ];

      for (const { url, type, name } of urls) {
        try {
          console.log(`Scrapping ${name}`);
          const data = await this.scrapePage(url, type, name);
          this.scrapedData.push(data);

          console.log(`Scrapped: ${data.title}`);
          await this.delay(config.scraper.delay);
        } catch (error) {
          console.error(`Scraping failed`, error.message);
          throw error;
        }
      }

      await this.saveScrapedData();
      console.log(
        `Scrapping complete, scraped ${this.scrapedData.length} pages`
      );
      return this.scrapedData;
    } catch (error) {
      console.error(`Scraping failed: ${error.message}`);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async scrapePage(url, pageType, pageName) {
    let page = null;

    try {
      page = await this.browser.newPage();

      await page.setUserAgent(config.scraper.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: config.scraper.timeout,
      });

      const content = await page.content();
      const $ = cheerio.load(content);

      let extractedData = this.extractContent($, url, pageType, pageName);

      console.log(`Scrapped ${extractedData.title}`);
      return extractedData;
    } catch (error) {
      console.error(`Failed to scrape data ${url}: ${error.message}`);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  extractContent($, url, pageType = "support", pageName = "") {
    const title =
      $("h1").first().text().trim() ||
      $(".article-title").text().trim() ||
      $(".page-title").text().trim() ||
      $("title").text().trim() ||
      pageName;

    let content = "";

    switch (pageType) {
      case "support-center":
        content = this.extractSupportCenterContent($);
        break;
      case "support":
        content = this.extractSupportArticleContent($);
        break;
      case "support-section":
        content = this.extractSupportSectionContent($);
        break;
      case "developer":
        content = this.extractDeveloperContent($);
        break;
      case "guidelines":
        content = this.extractGuidelinesContent($);
        break;
      default:
        content = this.extractGenericContent($);
    }

    content = this.cleanContent(content);

    return {
      title,
      content,
      url,
      type: pageType,
      pageName,
      scrapedAt: new Date().toISOString(),
    };
  }

  extractSupportCenterContent($) {
    let content = "";

    const contentSelectors = [
      ".hero-content",
      ".main-content",
      ".content",
      "main",
      ".page-content",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  extractSupportArticleContent($) {
    let content = "";

    const contentSelector = [
      ".article-body",
      ".article-content",
      ".content",
      ".main-content",
      "article",
      ".post-content",
    ];

    for (const selector of contentSelector) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  extractSupportSectionContent($) {
    let content = "";

    const contentSelectors = [
      ".section-content",
      ".content",
      ".main-content",
      "main",
      ".page-content",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  extractDeveloperContent($) {
    let content = "";

    const contentSelectors = [
      ".content",
      ".markdown-body",
      ".documentation-content",
      "main",
      ".doc-content",
      ".article-body",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  // Guidelines
  extractGuidelinesContent($) {
    let content = "";

    const contentSelectors = [
      ".content",
      ".guidelines-content",
      "main",
      ".page-content",
      ".article-body",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  extractGenericContent($) {
    let content = "";

    const contentSelectors = [
      ".content",
      ".main-content",
      "main",
      ".article-body",
      ".article-content",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    if (!content) {
      content = $("body").text().trim();
    }

    return content;
  }

  // Enhanced content cleaning
  cleanContent(content) {
    return content
      .replace(/\s+/g, " ")
      .replace(/Skip to main content|Skip to navigation|Menu|Navigation/g, "")
      .replace(/©.*?All rights reserved.*?$/g, "")
      .replace(/Follow us on.*?$/g, "")
      .replace(/Discord Support Center|Help Center|Support/g, "")
      .replace(/Search|Login|Sign in|Sign up/g, "")
      .replace(/Home|Back to top|Previous|Next/g, "")
      .trim();
  }

  async saveScrapedData() {
    try {
      await fs.ensureDir("./scraped_data");
      const filename = `discord_support.json`;
      await fs.writeJson(`./scraped_data/${filename}`, this.scrapedData, {
        spaces: 2,
      });
      console.log(`Data saved to ./scraped_data/${filename}`);

      const summary = {
        totalPages: this.scrapedData.length,
        scrapedAt: new Date().toISOString(),
        pagesBytype: this.scrapedData.reduce((acc, page) => {
          acc[page.type] = (acc[page.type] || 0) + 1;
          return acc;
        }, {}),
        pages: this.scrapedData.map((page) => ({
          name: page.pageName,
          type: page.pageType,
          url: page.url,
        })),
      };

      await fs.writeJson(`./scraped_data/summary.json`, summary, { spaces: 2 });
      console.log(`Summary saved`);
    } catch (error) {
      console.error("Couldn't save the data", error.message);
      throw error;
    }
  }

  async loadScrapedData(filename) {
    try {
      const data = await fs.readJson(`./scraped_data/${filename}`);
      console.log(
        Formatters.formatSuccess(
          `Loaded ${data.length} documents from ${filename}`
        )
      );
      return data;
    } catch (error) {
      console.error(
        Formatters.formatError(`Failed to load data: ${error.message}`)
      );
      throw error;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ScraperService;
