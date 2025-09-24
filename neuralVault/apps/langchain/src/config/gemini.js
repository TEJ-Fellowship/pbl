import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "./index.js";

export const createGeminiModel = () => {
  const geminiConfig = config.getGeminiConfig();

  // Validate configuration
  if (!geminiConfig.apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  if (!geminiConfig.apiKey.startsWith("AIza")) {
    throw new Error(
      "Invalid API key format. Gemini API keys should start with 'AIza'"
    );
  }

  console.log("🔧 Creating Gemini model with config:");
  console.log(`   Model: ${geminiConfig.model}`);
  console.log(`   API Key: ${geminiConfig.apiKey.substring(0, 10)}...`);
  console.log(`   Temperature: ${geminiConfig.temperature}`);
  console.log(`   Max Tokens: ${geminiConfig.maxTokens}`);

  try {
    const model = new ChatGoogleGenerativeAI({
      model: geminiConfig.model,
      apiKey: geminiConfig.apiKey,
      temperature: geminiConfig.temperature,
      maxOutputTokens: geminiConfig.maxTokens,
    });

    console.log("✅ Gemini model created successfully");
    return model;
  } catch (error) {
    console.error("❌ Failed to create Gemini model:", error.message);
    throw error;
  }
};
