import { config } from "./src/config/index.js";

console.log("🔧 Current Configuration:");
console.log("==================");

const geminiConfig = config.getGeminiConfig();
const langchainConfig = config.getLangChainConfig();

console.log("📡 Gemini Config:");
console.log(
  `  API Key: ${
    geminiConfig.apiKey
      ? "✅ Set (" + geminiConfig.apiKey.substring(0, 10) + "...)"
      : "❌ Not Set"
  }`
);
console.log(`  Model: ${geminiConfig.model}`);
console.log(`  Max Tokens: ${geminiConfig.maxTokens}`);
console.log(`  Temperature: ${geminiConfig.temperature}`);

console.log("\n🔗 LangChain Config:");
console.log(`  Embedding Model: ${langchainConfig.embeddingModel}`);
console.log(`  Chunk Size: ${langchainConfig.chunkSize}`);
console.log(`  Chunk Overlap: ${langchainConfig.chunkOverlap}`);

console.log("\n🔍 Testing API Key Format:");
if (geminiConfig.apiKey) {
  if (geminiConfig.apiKey.startsWith("AIza")) {
    console.log("✅ API Key format is correct");
  } else {
    console.log("❌ API Key format is incorrect (should start with AIza)");
  }
} else {
  console.log("❌ No API Key found");
}

console.log("\n🎯 Configuration Status:");
const isValid = config.validate();
console.log(
  isValid ? "✅ Configuration is valid" : "❌ Configuration has issues"
);
