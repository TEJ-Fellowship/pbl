import ScraperService from "../services/scraperService.js";
import RAGService from "../services/RAGService.js";

class DataController {
  constructor() {
    this.scraperService = new ScraperService();
    this.ragService = new RAGService();
  }

  async initialize() {
    try {
      await this.ragService.initialize();
      console.log("Data controller initialized");
    } catch (error) {
      console.error(`Failed to initialize data controller: ${error.message}`);
      throw error;
    }
  }

  async scrapeAllData() {
    try {
      console.log("Starting Data Scraping Process");

      // Scrape all Discord support pages
      const scrapedData = await this.scraperService.scrapeAllPages();

      console.log(`Scraped ${scrapedData.length} pages successfully`);

      return {
        success: true,
        message: `Successfully scraped ${scrapedData.length} pages`,
        data: scrapedData,
      };
    } catch (error) {
      console.error(`Scraping failed: ${error.message}`);
      return {
        success: false,
        message: `Scraping failed: ${error.message}`,
        data: [],
      };
    }
  }

  async processAndStoreData(documents) {
    try {
      console.log("Processing and Storing Data");

      if (!documents || documents.length === 0) {
        throw new Error("No documents provided for processing");
      }

      // Store documents in vector database
      const result = await this.ragService.storeDocuments(documents);

      console.log(`Processed and stored ${result.storedChunks} chunks`);

      return {
        success: true,
        message: `Successfully processed and stored ${result.storedChunks} chunks`,
        stats: result,
      };
    } catch (error) {
      console.error(`Processing failed: ${error.message}`);
      return {
        success: false,
        message: `Processing failed: ${error.message}`,
        stats: null,
      };
    }
  }

  async loadAndProcessData(filename) {
    try {
      console.log(`Loading data from ${filename}`);

      // Load scraped data
      const documents = await this.scraperService.loadScrapedData(filename);

      // Process and store
      const result = await this.processAndStoreData(documents);

      return result;
    } catch (error) {
      console.error(`Failed to load and process data: ${error.message}`);
      return {
        success: false,
        message: `Failed to load and process data: ${error.message}`,
        stats: null,
      };
    }
  }

  async getDatabaseStats() {
    try {
      const stats = await this.ragService.getCollectionStats();

      return {
        success: true,
        stats: stats,
      };
    } catch (error) {
      console.error(`Failed to get database stats: ${error.message}`);
      return {
        success: false,
        stats: null,
      };
    }
  }

  async searchDocuments(query, nResults = 5) {
    try {
      const results = await this.ragService.search(query, nResults);

      return {
        success: true,
        results: results,
        count: results.length,
      };
    } catch (error) {
      console.error(`Search failed: ${error.message}`);
      return {
        success: false,
        results: [],
        count: 0,
      };
    }
  }

  async clearDatabase() {
    try {
      await this.ragService.clearCollection();

      return {
        success: true,
        message: "Database cleared successfully",
      };
    } catch (error) {
      console.error(`Failed to clear database: ${error.message}`);
      return {
        success: false,
        message: `Failed to clear database: ${error.message}`,
      };
    }
  }
}

export default DataController;
