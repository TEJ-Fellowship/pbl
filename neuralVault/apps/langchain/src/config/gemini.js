import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "./index.js";

export const createGeminiModel = () => {
  const geminiConfig = config.getGeminiConfig();

  return new ChatGoogleGenerativeAI({
    model: geminiConfig.model,
    apiKey: geminiConfig.apiKey,
    temperature: geminiConfig.temperature,
    maxOutputTokens: geminiConfig.maxTokens,
  });
};
