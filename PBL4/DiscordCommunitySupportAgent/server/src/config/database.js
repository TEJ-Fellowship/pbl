import { ChromaClient } from "chromadb";
import GeminiConfig from "./gemini.js";
import { config } from "../config/index.js";

class DatabaseConfig {
  constructor() {
    this.client = null;
    this.collection = null;
    this.gemini = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log("Initializing chroma db");

      this.gemini = new GeminiConfig();

      this.gemini.initialize();

      try {
        this.client = new ChromaClient();
        console.log("Chromadb client created in embedded mode");
      } catch (error) {
        console.error("Embedded mode failed, try with local path...");
        this.client = new ChromaClient({
          path: config.chroma.dbPath,
        });
      }

      try {
        this.collection = await this.client.getCollection({
          name: config.chroma.collectionName,
        });

        console.log(
          `Found existing collection: ${config.chroma.collectionName}`
        );
      } catch (error) {
        this.collection = await this.client.createCollection({
          name: config.chroma.collectionName,
          metadata: {
            description: "Discord Support Documentation",
            created_at: new Date().toISOString(),
          },
        });
      }

      console.log(`Created new collection: ${config.chroma.collectionName}`);

      this.isInitialized = true;
      console.log(
        `ChromaDb vector store initialized: ${config.chroma.collectionName}`
      );

      return this.collection;
    } catch (error) {
      console.error("Failed to initialized chormaDB", error.message);
      throw error;
    }
  }

  async addDocuments(documents) {
    try {
      if (!this.isInitialized) {
        throw new Error("Database is not initialized, initialize it first");
      }

      console.log("Generating Embeddings for documents");

      //generate embeddings for all the documents

      const texts = documents.map((doc) => {
        const content = doc.pageContent || doc.text || doc;
        return typeof content === "string" ? content : JSON.stringify(content);
      });

      const embeddings = [];
      const ids = [];
      const metadatas = [];
      const documentsToAdd = [];

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const doc = documents[i];
        console.log(
          `🔄 Processing document ${i + 1}/${texts.length}: ${
            doc.metadata?.title || "Untitled"
          }`
        );

        const cleanText =
          typeof text === "string" ? text.trim() : String(text).trim();

        try {
          const embedding = await this.gemini.generateEmbedding(cleanText);
          embeddings.push(embedding);
          ids.push(`doc_${Date.now()}_${i}`);
          metadatas.push(doc.metadata || {});
          documentsToAdd.push(cleanText);
        } catch (embedError) {
          console.error(
            `❌ Failed to generate embedding for document ${i + 1}:`,
            embedError.message
          );
          console.error(
            `📝 Problematic text: ${cleanText.substring(0, 200)}...`
          );
          // Skip this document and continue
          continue;
        }

        if (embeddings.length > 0) {
          await this.collection.add({
            ids: ids,
            embeddings: embeddings,
            documents: documentsToAdd,
            metadatas: metadatas,
          });

          console.log(`✅ Added ${embeddings.length} documents to ChromaDB`);
        }
      }
    } catch (error) {
      console.error(
        Formatters.formatError(
          `❌ Failed to add documents to ChromaDB: ${error.message}`
        )
      );
      throw error;
    }
  }

  async queryDocuments(query, nResults = 5) {
    try {
      if (!this.isInitialized) {
        throw new Error("Database not initialized, initialized it first");
      }

      const queryEmbedding = await this.gemini.generateQueryEmbedding(query);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: nResults,
        include: ["documents", "metadatas", "distances"],
      });

      const formattedResult = [];

      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          formattedResult.push({
            pageContent: results.documents[0][i],
            metadata: results.metadatas[0][i] || {},
            distance: results.distances[0][i] || 0,
          });
        }
      }

      return formattedResult;
    } catch (error) {
      console.error(
        Formatters.formatError(
          `❌ Failed to query documents from ChromaDB: ${error.message}`
        )
      );
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      if (!this.isInitialized) {
        throw new Error("Database not initialized. Call initialize() first.");
      }

      const count = await this.collection.count();
      return {
        totalDocuments: count,
        collectionName: config.chroma.collectionName,
      };
    } catch (error) {
      console.error(
        Formatters.formatError(
          `❌ Failed to get collection stats from ChromaDB: ${error.message}`
        )
      );
      throw error;
    }
  }

  async clearCollection() {
    try {
      if (!this.isInitialized) {
        throw new Error("Database not initialized. Call initialize() first.");
      }

      console.log(Formatters.formatWarning("Clearing collection..."));

      // Delete the collection
      await this.client.deleteCollection({
        name: config.chroma.collectionName,
      });

      console.log(Formatters.formatSuccess("Collection cleared successfully"));
    } catch (error) {
      console.error(
        Formatters.formatError(`Failed to clear collection: ${error.message}`)
      );
      throw error;
    }
  }
}

export default DatabaseConfig;
