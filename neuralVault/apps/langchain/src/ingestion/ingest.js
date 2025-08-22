import { DocumentProcessor } from "./processors/documentProcessor.js";
import { VectorStoreManager } from "../storage/vectorStore.js";
import { config } from "../config/index.js";
import chalk from "chalk";

export class DataIngestion {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.vectorStore = new VectorStoreManager();
  }

  async ingestPDF(filePath) {
    console.log(chalk.blue("🔄 Starting PDF ingestion process..."));

    try {
      // Process the PDF
      const processedDocs = await this.documentProcessor.processPDF(filePath);

      // Initialize vector store with processed documents
      await this.vectorStore.initializeFromDocuments(processedDocs);

      console.log(chalk.green("✅ PDF ingestion completed successfully!"));
      return {
        success: true,
        documentCount: processedDocs.length,
        vectorStore: this.vectorStore,
      };
    } catch (error) {
      console.error(chalk.red("❌ PDF ingestion failed:"), error.message);
      throw error;
    }
  }

  async ingestText(filePath) {
    console.log(chalk.blue("🔄 Starting text ingestion process..."));

    try {
      // Process the text document
      const processedDocs = await this.documentProcessor.processText(filePath);

      // Initialize vector store with processed documents
      await this.vectorStore.initializeFromDocuments(processedDocs);

      console.log(chalk.green("✅ Text ingestion completed successfully!"));
      return {
        success: true,
        documentCount: processedDocs.length,
        vectorStore: this.vectorStore,
      };
    } catch (error) {
      console.error(chalk.red("❌ Text ingestion failed:"), error.message);
      throw error;
    }
  }

  async search(query, k = 4) {
    if (!this.vectorStore) {
      throw new Error(
        "Vector store not initialized. Please run ingestion first."
      );
    }

    return await this.vectorStore.similaritySearch(query, k);
  }
}

// Standalone ingestion function
export const ingestDocument = async (filePath, fileType = "pdf") => {
  const ingestion = new DataIngestion();

  if (fileType.toLowerCase() === "pdf") {
    return await ingestion.ingestPDF(filePath);
  } else if (fileType.toLowerCase() === "text") {
    return await ingestion.ingestText(filePath);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
};
