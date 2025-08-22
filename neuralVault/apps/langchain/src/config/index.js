/**
 * Configuration management for LangChain Data Ingestion App
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
dotenv.config();

class Config {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const geminiConfig = {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "4096"),
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
    };

    const langchainConfig = {
      chunkSize: parseInt(process.env.CHUNK_SIZE || "500"),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "50"),
      embeddingModel: process.env.EMBEDDING_MODEL || "models/embedding-001",
    };

    const appConfig = {
      debug: process.env.DEBUG === "true",
      logLevel: process.env.LOG_LEVEL || "info",
      defaultDocumentPath:
        process.env.DEFAULT_DOCUMENT_PATH || "./docs/sample_langchain_doc.pdf",
    };

    return {
      gemini: geminiConfig,
      langchain: langchainConfig,
      app: appConfig,
    };
  }

  getConfig() {
    return this.config;
  }

  getGeminiConfig() {
    return this.config.gemini;
  }

  getLangChainConfig() {
    return this.config.langchain;
  }

  getAppConfig() {
    return this.config.app;
  }

  isDebug() {
    return this.config.app.debug;
  }

  getLogLevel() {
    return this.config.app.logLevel;
  }

  validate() {
    const errors = [];

    // Validate Gemini configuration
    if (!this.config.gemini.apiKey) {
      errors.push("GEMINI_API_KEY is required");
    }

    // Validate document path
    const docPath = path.resolve(this.config.app.defaultDocumentPath);
    if (!fs.existsSync(docPath)) {
      errors.push(`Default document not found: ${docPath}`);
    }

    if (errors.length > 0) {
      console.error("❌ Configuration validation failed:");
      errors.forEach((error) => console.error(`  - ${error}`));
      return false;
    }

    return true;
  }

  printConfig() {
    console.log("🔧 LangChain Configuration:");
    console.log(`  Gemini Model: ${this.config.gemini.model}`);
    console.log(`  Chunk Size: ${this.config.langchain.chunkSize}`);
    console.log(`  Chunk Overlap: ${this.config.langchain.chunkOverlap}`);
    console.log(`  Embedding Model: ${this.config.langchain.embeddingModel}`);
    console.log(`  Debug Mode: ${this.config.app.debug}`);
    console.log(`  Log Level: ${this.config.app.logLevel}`);
    console.log(`  Default Document: ${this.config.app.defaultDocumentPath}`);
    console.log(
      `  API Key: ${this.config.gemini.apiKey ? "✅ Set" : "❌ Not Set"}`
    );
  }
}

// Export singleton instance
export const config = new Config();
