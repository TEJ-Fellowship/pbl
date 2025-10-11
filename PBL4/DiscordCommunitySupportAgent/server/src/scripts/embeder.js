import fs from "fs-extra";
import RAGService from "../services/RAGService.js";

class EmbedderScript {
  constructor() {
    this.RAGService = new RAGService();
  }

  async run() {
    try {
      console.log("Discord support embedder");

      const scrapedDataDir = "./scraped_data";
      if (!(await fs.pathExists(scrapedDataDir))) {
        console.log(
          "No scraped_data directory found, please run the scraper first"
        );
        process.exit(1);
      }

      const files = await fs.readdir(scrapedDataDir);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      if (jsonFiles.length === 0) {
        console.log(
          Formatters.formatError(
            "No JSON files found in scraped_data directory. Please run the scraper first."
          )
        );
        process.exit(1);
      }

      await this.RAGService.initialize();

      for (const file of jsonFiles) {
        console.log(`Processing ${file}`);
        try {
          const documents = await fs.readJson(`${scrapedDataDir}/${file}`);

          if (!Array.isArray(documents) || documents.length === 0) {
            console.log("No valid documents in ", file);
            continue;
          }

          const result = await this.RAGService.storeDocuments(documents);
          console.log(
            `Processed ${file}: ${result.storedChunks} chunks stored`
          );
        } catch (error) {
          console.error("Failed to process file", error.message);
        }
      }

      const stats = await this.RAGService.getCollectionStats();
      console.log("Final Statistics");
      console.log(`Total documents in database: ${stats.totalDocuments}`);
      console.log("Embedding process completed!");
    } catch (error) {
      console.error(`Embedding failed: ${error.message}`);
      process.exit(1);
    }
  }
}

const embedder = new EmbedderScript();
embedder.run();
