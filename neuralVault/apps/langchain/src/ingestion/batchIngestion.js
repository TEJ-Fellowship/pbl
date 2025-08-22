import { DocumentProcessor } from "./processors/documentProcessor.js";
import { VectorStoreManager } from "../storage/vectorStore.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { FileUtils } from "../utils/fileUtils.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

export class BatchIngestion {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
    this.vectorStore = new VectorStoreManager();
    this.processedFiles = [];
    this.failedFiles = [];
  }

  /**
   * Ingest all documents from a directory
   */
  async ingestDirectory(directoryPath, options = {}) {
    const {
      fileTypes = ["pdf", "txt", "md", "docx", "xlsx", "xls", "csv"],
      recursive = true,
      maxFiles = 100,
    } = options;

    logger.info(`📁 Starting batch ingestion from: ${directoryPath}`);

    try {
      // Get all files from directory
      const files = await this.scanDirectory(directoryPath, {
        fileTypes,
        recursive,
        maxFiles,
      });

      if (files.length === 0) {
        logger.warn("No supported files found in directory");
        return { success: false, message: "No supported files found" };
      }

      logger.info(`📄 Found ${files.length} files to process`);

      // Process each file
      const allProcessedDocs = [];

      for (const file of files) {
        try {
          const processedDocs = await this.processFile(file);
          if (processedDocs && processedDocs.length > 0) {
            allProcessedDocs.push(...processedDocs);
            this.processedFiles.push({
              path: file,
              chunks: processedDocs.length,
              success: true,
            });
            logger.success(
              `✅ Processed: ${path.basename(file)} (${
                processedDocs.length
              } chunks)`
            );
          }
        } catch (error) {
          logger.error(`❌ Failed to process: ${path.basename(file)}`, error);
          this.failedFiles.push({
            path: file,
            error: error.message,
            success: false,
          });
        }
      }

      // Initialize vector store with all processed documents
      if (allProcessedDocs.length > 0) {
        await this.vectorStore.initializeFromDocuments(allProcessedDocs);
        logger.success(
          `🎉 Batch ingestion completed! Processed ${allProcessedDocs.length} total chunks from ${this.processedFiles.length} files`
        );
      }

      return {
        success: true,
        totalChunks: allProcessedDocs.length,
        processedFiles: this.processedFiles,
        failedFiles: this.failedFiles,
        vectorStore: this.vectorStore,
      };
    } catch (error) {
      logger.error("❌ Batch ingestion failed:", error);
      throw error;
    }
  }

  /**
   * Ingest multiple specific files
   */
  async ingestFiles(filePaths, options = {}) {
    logger.info(`📄 Starting batch ingestion of ${filePaths.length} files`);

    try {
      const allProcessedDocs = [];

      for (const filePath of filePaths) {
        try {
          const processedDocs = await this.processFile(filePath);
          if (processedDocs && processedDocs.length > 0) {
            allProcessedDocs.push(...processedDocs);
            this.processedFiles.push({
              path: filePath,
              chunks: processedDocs.length,
              success: true,
            });
            logger.success(
              `✅ Processed: ${path.basename(filePath)} (${
                processedDocs.length
              } chunks)`
            );
          }
        } catch (error) {
          logger.error(
            `❌ Failed to process: ${path.basename(filePath)}`,
            error
          );
          this.failedFiles.push({
            path: filePath,
            error: error.message,
            success: false,
          });
        }
      }

      // Initialize vector store with all processed documents
      if (allProcessedDocs.length > 0) {
        await this.vectorStore.initializeFromDocuments(allProcessedDocs);
        logger.success(
          `🎉 Batch ingestion completed! Processed ${allProcessedDocs.length} total chunks from ${this.processedFiles.length} files`
        );
      }

      return {
        success: true,
        totalChunks: allProcessedDocs.length,
        processedFiles: this.processedFiles,
        failedFiles: this.failedFiles,
        vectorStore: this.vectorStore,
      };
    } catch (error) {
      logger.error("❌ Batch ingestion failed:", error);
      throw error;
    }
  }

  /**
   * Process a single file based on its extension
   */
  async processFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case ".pdf":
        return await this.documentProcessor.processPDF(filePath);

      case ".txt":
      case ".text":
        return await this.documentProcessor.processText(filePath);

      case ".md":
      case ".markdown":
        return await this.documentProcessor.processMarkdown(filePath);

      case ".docx":
        return await this.documentProcessor.processDocx(filePath);

      case ".json":
        return await this.documentProcessor.processJson(filePath);

      case ".xlsx":
      case ".xls":
        return await this.documentProcessor.processXlsx(filePath);

      case ".csv":
        return await this.documentProcessor.processCsv(filePath);

      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  /**
   * Scan directory for supported files
   */
  async scanDirectory(directoryPath, options = {}) {
    const {
      fileTypes = ["pdf", "txt", "md", "docx", "xlsx", "xls", "csv"],
      recursive = true,
      maxFiles = 100,
    } = options;

    const supportedExtensions = fileTypes.map(
      (type) => `.${type.toLowerCase()}`
    );
    const files = [];

    const scanRecursive = async (dir) => {
      try {
        const items = await fs.promises.readdir(dir);

        for (const item of items) {
          if (files.length >= maxFiles) break;

          const fullPath = path.join(dir, item);
          const stat = await fs.promises.stat(fullPath);

          if (stat.isDirectory() && recursive) {
            await scanRecursive(fullPath);
          } else if (stat.isFile()) {
            const extension = path.extname(item).toLowerCase();
            if (supportedExtensions.includes(extension)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        logger.error(`Error scanning directory: ${dir}`, error);
      }
    };

    await scanRecursive(directoryPath);
    return files;
  }

  /**
   * Get ingestion statistics
   */
  getStats() {
    return {
      processedFiles: this.processedFiles.length,
      failedFiles: this.failedFiles.length,
      totalChunks: this.processedFiles.reduce(
        (sum, file) => sum + file.chunks,
        0
      ),
      processedFilesList: this.processedFiles,
      failedFilesList: this.failedFiles,
    };
  }

  /**
   * Clear ingestion history
   */
  clearHistory() {
    this.processedFiles = [];
    this.failedFiles = [];
  }

  /**
   * Search through ingested documents
   */
  async search(query, k = 4) {
    if (!this.vectorStore.isInitialized()) {
      throw new Error(
        "Vector store not initialized. Please run ingestion first."
      );
    }
    return await this.vectorStore.similaritySearch(query, k);
  }
}

// Standalone batch ingestion functions
export const ingestDirectory = async (directoryPath, options = {}) => {
  const batchIngestion = new BatchIngestion();
  return await batchIngestion.ingestDirectory(directoryPath, options);
};

export const ingestFiles = async (filePaths, options = {}) => {
  const batchIngestion = new BatchIngestion();
  return await batchIngestion.ingestFiles(filePaths, options);
};
