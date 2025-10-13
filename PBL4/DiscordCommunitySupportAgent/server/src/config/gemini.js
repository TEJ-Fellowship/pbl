import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./index.js";

class GeminiConfig {
  constructor() {
    (this.genAI = null), (this.model = null);
  }

  initialize() {
    try {
      if (!config.gemini.apiKey) {
        throw new Error("Gemini API key is required");
      }

      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey, {
        apiVersion: "v1",
      });

      this.model = this.genAI.getGenerativeModel({
        model: config.gemini.model,
      });

      console.log("Gemini AI initialized successfully");
      return true;
    } catch (error) {
      console.error("Gemini AI failed to initialize", error.message);
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });

      const result = await embeddingModel.embedContent(text);

      return result.embedding.values;
    } catch (error) {
      console.error("Failed to generated embedding", error.message);
      throw error;
    }
  }

  async generateResponse(prompt, context = "") {
    try {
      const fullPrompt = context
        ? `Context: ${context}\n\nQuestion:${prompt}\n\nAnwser based on the context: `
        : prompt;
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error("Failed to generate response:", error.message);
      throw error;
    }
  }

  async generateQueryEmbedding(query) {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-004",
      });

      const result = await embeddingModel.embedContent(query);
      return result.embedding.values;
    } catch (error) {
      console.error("Failed to generate query embedding: ", error.message);
      throw error;
    }
  }
}

export default GeminiConfig;
