import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { config } from "./index.js";

export const createEmbeddings = () => {
  const geminiConfig = config.getGeminiConfig();
  const langchainConfig = config.getLangChainConfig();

  return new GoogleGenerativeAIEmbeddings({
    model: langchainConfig.embeddingModel,
    apiKey: geminiConfig.apiKey,
  });
};
