import { DocumentProcessor } from "./processors/documentProcessor.js";
import { WorkingVectorStoreManager } from "../storage/workingVectorStore.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { FileUtils } from "../utils/fileUtils.js";
import chalk from "chalk";
import path from "path";
import fs from "fs";

export class WorkingBatchIngestion {
  constructor(options = {}) {
    this.documentProcessor = new DocumentProcessor();
    this.vectorStore = new WorkingVectorStoreManager({
      searchTimeout: options.searchTimeout || 10000,
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 1000,
      cacheDir: options.cacheDir || "./cache",
    });
    this.processedFiles = [];
    this.failedFiles = [];
    this.batchSize = options.batchSize || 2;
    this.enableParallelProcessing = options.enableParallelProcessing !== false;
  }

  /**
   * Ingest all documents from a directory with working processing
   */
  async ingestDirectory(directoryPath, options = {}) {
    const {
      fileTypes = ["pdf", "txt", "md", "docx", "xlsx", "xls", "csv"],
      recursive = true,
      maxFiles = 100,
    } = options;

    logger.info(`📁 Starting working batch ingestion from: ${directoryPath}`);

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

      // Process files in batches for better performance
      const allProcessedDocs = [];
      const batches = this.createBatches(files, this.batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(
          `🔄 Processing batch ${i + 1}/${batches.length} (${
            batch.length
          } files)`
        );

        const batchResults = await this.processBatch(batch);
        allProcessedDocs.push(...batchResults.processedDocs);

        // Add to processed/failed files
        this.processedFiles.push(...batchResults.processedFiles);
        this.failedFiles.push(...batchResults.failedFiles);

        // Small delay between batches to prevent API rate limiting
        if (i < batches.length - 1) {
          await this.delay(1000); // 1 second delay
        }
      }

      // Initialize vector store with all processed documents
      if (allProcessedDocs.length > 0) {
        await this.vectorStore.initializeFromDocuments(allProcessedDocs);
        logger.success(
          `🎉 Working batch ingestion completed! Processed ${allProcessedDocs.length} total chunks from ${this.processedFiles.length} files`
        );
      }

      return {
        success: true,
        totalChunks: allProcessedDocs.length,
        processedFiles: this.processedFiles,
        failedFiles: this.failedFiles,
        vectorStore: this.vectorStore,
        stats: this.vectorStore.getStats(),
      };
    } catch (error) {
      logger.error("❌ Working batch ingestion failed:", error);
      throw error;
    }
  }

  /**
   * Ingest multiple specific files with working processing
   */
  async ingestFiles(filePaths, options = {}) {
    logger.info(
      `📄 Starting working batch ingestion of ${filePaths.length} files`
    );

    try {
      // Process files in batches
      const batches = this.createBatches(filePaths, this.batchSize);
      const allProcessedDocs = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(
          `🔄 Processing batch ${i + 1}/${batches.length} (${
            batch.length
          } files)`
        );

        const batchResults = await this.processBatch(batch);
        allProcessedDocs.push(...batchResults.processedDocs);

        this.processedFiles.push(...batchResults.processedFiles);
        this.failedFiles.push(...batchResults.failedFiles);

        // Delay between batches
        if (i < batches.length - 1) {
          await this.delay(1000);
        }
      }

      // Initialize vector store with all processed documents
      if (allProcessedDocs.length > 0) {
        await this.vectorStore.initializeFromDocuments(allProcessedDocs);
        logger.success(
          `🎉 Working batch ingestion completed! Processed ${allProcessedDocs.length} total chunks from ${this.processedFiles.length} files`
        );
      }

      return {
        success: true,
        totalChunks: allProcessedDocs.length,
        processedFiles: this.processedFiles,
        failedFiles: this.failedFiles,
        vectorStore: this.vectorStore,
        stats: this.vectorStore.getStats(),
      };
    } catch (error) {
      logger.error("❌ Working batch ingestion failed:", error);
      throw error;
    }
  }

  /**
   * Process a batch of files
   */
  async processBatch(files) {
    const processedDocs = [];
    const processedFiles = [];
    const failedFiles = [];

    if (this.enableParallelProcessing) {
      // Process files in parallel (faster but more resource intensive)
      const promises = files.map(async (file) => {
        try {
          const docs = await this.processFile(file);
          return { success: true, docs, file };
        } catch (error) {
          return { success: false, error, file };
        }
      });

      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result.success) {
          processedDocs.push(...result.docs);
          processedFiles.push({
            path: result.file,
            chunks: result.docs.length,
            success: true,
          });
          logger.success(
            `✅ Processed: ${path.basename(result.file)} (${
              result.docs.length
            } chunks)`
          );
        } else {
          failedFiles.push({
            path: result.file,
            error: result.error.message,
            success: false,
          });
          logger.error(
            `❌ Failed to process: ${path.basename(result.file)}`,
            result.error
          );
        }
      });
    } else {
      // Process files sequentially (more stable)
      for (const file of files) {
        try {
          const docs = await this.processFile(file);
          processedDocs.push(...docs);
          processedFiles.push({
            path: file,
            chunks: docs.length,
            success: true,
          });
          logger.success(
            `✅ Processed: ${path.basename(file)} (${docs.length} chunks)`
          );
        } catch (error) {
          failedFiles.push({
            path: file,
            error: error.message,
            success: false,
          });
          logger.error(`❌ Failed to process: ${path.basename(file)}`, error);
        }
      }
    }

    return { processedDocs, processedFiles, failedFiles };
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
   * Create batches from file list
   */
  createBatches(files, batchSize) {
    const batches = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      vectorStoreStats: this.vectorStore.getStats(),
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
   * Search through ingested documents with working fallback
   */
  async search(query, k = 4) {
    if (!this.vectorStore.isInitialized()) {
      throw new Error(
        "Vector store not initialized. Please run ingestion first."
      );
    }

    try {
      return await this.vectorStore.similaritySearch(query, k);
    } catch (error) {
      logger.error("Search failed:", error.message);
      console.log(chalk.yellow("⚠️ Search failed, trying fallback..."));
      return await this.vectorStore.fallbackSearch(query, k);
    }
  }
}
