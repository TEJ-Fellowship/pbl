import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createEmbeddings } from "../config/embeddings.js";
import fs from "fs";
import path from "path";

export class WorkingVectorStoreManager {
  constructor(options = {}) {
    this.vectorStore = null;
    this.embeddings = createEmbeddings();
    this.searchTimeout = options.searchTimeout || 10000; // Increased to 10 seconds
    this.maxRetries = options.maxRetries || 2; // Increased retries
    this.retryDelay = options.retryDelay || 1000; // Increased delay
    this.documents = []; // Store documents locally for fallback
    this.cacheDir = options.cacheDir || "./cache";

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async initializeFromDocuments(documents) {
    console.log("🔄 Initializing working vector store...");

    try {
      // Store documents locally for fallback
      this.documents = documents;
      await this.saveDocumentsToCache();

      // Test embeddings API first
      console.log("🔍 Testing embeddings API...");
      const testEmbedding = await this.testEmbeddingsAPI();

      if (testEmbedding) {
        console.log(
          "✅ Embeddings API is working, initializing vector store..."
        );
        try {
          this.vectorStore = await MemoryVectorStore.fromDocuments(
            documents,
            this.embeddings
          );
          console.log("✅ Working vector store initialized successfully!");
          return this.vectorStore;
        } catch (vectorError) {
          console.log("⚠️ Vector store creation failed:", vectorError.message);
          console.log("🔄 Falling back to text-based search mode");
          this.vectorStore = null;
          return null;
        }
      } else {
        console.log("⚠️ Embeddings API not working, using fallback-only mode");
        this.vectorStore = null; // Force fallback search
        return null;
      }
    } catch (error) {
      console.error("❌ Failed to initialize vector store:", error.message);
      console.log("⚠️ Using fallback-only mode");
      this.vectorStore = null; // Force fallback search
      return null;
    }
  }

  async testEmbeddingsAPI() {
    try {
      console.log("🔍 Testing embeddings API with 15-second timeout...");
      const testPromise = this.embeddings.embedQuery("test");
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("EMBEDDINGS_TIMEOUT")), 15000) // Increased to 15 seconds
      );

      const result = await Promise.race([testPromise, timeoutPromise]);
      console.log("✅ Embeddings API test successful!");
      return true;
    } catch (error) {
      console.log("⚠️ Embeddings API test failed:", error.message);
      return false;
    }
  }

  async similaritySearch(query, k = 4) {
    if (!this.vectorStore) {
      console.log("⚠️ Vector store not initialized, using fallback search");
      return await this.fallbackSearch(query, k);
    }

    console.log(`🔍 Searching for: "${query}"`);

    // Try search with timeout and retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/${this.maxRetries}`);

        const searchPromise = this.vectorStore.similaritySearch(query, k);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Search timeout")),
            this.searchTimeout
          )
        );

        const results = await Promise.race([searchPromise, timeoutPromise]);
        console.log(`✅ Found ${results.length} relevant documents`);
        return results;
      } catch (error) {
        console.log(`   Attempt ${attempt} failed: ${error.message}`);

        if (attempt === this.maxRetries) {
          console.log("⚠️ All search attempts failed, trying fallback...");
          return await this.fallbackSearch(query, k);
        }

        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  async fallbackSearch(query, k = 4) {
    console.log("🔄 Trying fallback search with local document matching...");

    try {
      if (this.documents.length === 0) {
        console.log("⚠️ No documents available for fallback search");
        return [];
      }

      // Improved text-based search as fallback
      const queryLower = query.toLowerCase().trim();
      const queryWords = queryLower
        .split(/\s+/)
        .filter((word) => word.length > 1);

      console.log(`   Searching for: "${queryLower}"`);
      console.log(`   Query words: [${queryWords.join(", ")}]`);
      console.log(`   Available documents: ${this.documents.length}`);

      // Filter and prioritize documents intelligently
      const relevantDocs = this.documents.filter((doc) => {
        const content = doc.pageContent.toLowerCase();
        const metadata = doc.metadata || {};

        // Skip LeetCode problems and other irrelevant content
        if (
          content.includes("leetcode") ||
          content.includes("problem") ||
          content.includes("solution") ||
          content.includes("algorithm") ||
          content.includes("coding") ||
          content.includes("interview") ||
          content.includes("exercise") ||
          content.includes("prep")
        ) {
          return false;
        }

        // Prefer documents with relevant metadata
        if (
          metadata.source &&
          (metadata.source.includes("langchain") ||
            metadata.source.includes("sample") ||
            metadata.source.includes("README") ||
            metadata.source.includes("neural") ||
            metadata.source.includes("vault"))
        ) {
          return true;
        }

        return true;
      });

      console.log(`   Filtered to ${relevantDocs.length} relevant documents`);

      const matchingDocs = relevantDocs.filter((doc) => {
        const content = doc.pageContent.toLowerCase();

        // Check for exact phrase match first
        if (content.includes(queryLower)) {
          return true;
        }

        // Check for individual word matches
        const wordMatches = queryWords.filter((word) => content.includes(word));
        return wordMatches.length > 0;
      });

      console.log(`   Found ${matchingDocs.length} matching documents`);

      // Sort by relevance (simple scoring)
      const scoredDocs = matchingDocs
        .map((doc) => {
          const content = doc.pageContent.toLowerCase();
          let score = 0;

          // Exact phrase match gets highest score
          if (content.includes(queryLower)) {
            score += 20;
          }

          // Word matches with frequency
          queryWords.forEach((word) => {
            const wordCount = content.split(word).length - 1;
            score += wordCount * 5;

            // Bonus for word at beginning of sentence
            const sentences = content.split(/[.!?]+/);
            sentences.forEach((sentence) => {
              if (sentence.trim().toLowerCase().startsWith(word)) {
                score += 10;
              }
            });
          });

          // Bonus for title/heading matches
          if (doc.metadata && doc.metadata.title) {
            const title = doc.metadata.title.toLowerCase();
            if (title.includes(queryLower)) {
              score += 30;
            }
            queryWords.forEach((word) => {
              if (title.includes(word)) {
                score += 15;
              }
            });
          }

          return { doc, score };
        })
        .sort((a, b) => b.score - a.score);

      const results = scoredDocs.slice(0, k).map((item) => item.doc);
      console.log(`✅ Fallback search found ${results.length} documents`);

      if (results.length > 0) {
        console.log(
          `   Top result: ${results[0].pageContent.substring(0, 100)}...`
        );
      }

      return results;
    } catch (error) {
      console.log(`❌ Fallback search failed: ${error.message}`);
      return [];
    }
  }

  async similaritySearchWithScore(query, k = 4) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }

    console.log(`🔍 Searching with scores for: "${query}"`);

    try {
      const searchPromise = this.vectorStore.similaritySearchWithScore(
        query,
        k
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Search timeout")),
          this.searchTimeout
        )
      );

      const results = await Promise.race([searchPromise, timeoutPromise]);
      console.log(`✅ Found ${results.length} relevant documents with scores`);
      return results;
    } catch (error) {
      console.log(`⚠️ Search with scores failed: ${error.message}`);
      return [];
    }
  }

  async addDocuments(documents) {
    if (!this.vectorStore) {
      throw new Error("Vector store not initialized");
    }

    try {
      // Add to local storage
      this.documents.push(...documents);
      await this.saveDocumentsToCache();

      await this.vectorStore.addDocuments(documents);
      console.log(`✅ Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error("❌ Failed to add documents:", error.message);
      throw error;
    }
  }

  async saveDocumentsToCache() {
    try {
      const cacheFile = path.join(this.cacheDir, "documents-cache.json");
      const cacheData = {
        documents: this.documents,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Saved ${this.documents.length} documents to cache`);
    } catch (error) {
      console.log("⚠️ Failed to save documents to cache:", error.message);
    }
  }

  async loadDocumentsFromCache() {
    try {
      const cacheFile = path.join(this.cacheDir, "documents-cache.json");
      if (fs.existsSync(cacheFile)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
        this.documents = cacheData.documents || [];
        console.log(`📦 Loaded ${this.documents.length} documents from cache`);
      }
    } catch (error) {
      console.log("⚠️ Failed to load documents from cache:", error.message);
    }
  }

  getVectorStore() {
    return this.vectorStore;
  }

  isInitialized() {
    return this.vectorStore !== null;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get statistics about the vector store
  getStats() {
    return {
      isInitialized: this.isInitialized(),
      documentCount: this.documents.length,
      searchTimeout: this.searchTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    };
  }

  // Get all stored documents
  getAllDocuments() {
    return this.documents;
  }
}
