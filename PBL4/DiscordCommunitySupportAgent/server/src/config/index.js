import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

// Resolve absolute path to your project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env"); // adjust based on your folder depth

dotenv.config({ path: envPath });

console.log("✅ Loaded .env from:", envPath);
dotenv.config();

export const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.0-flash",
    embeddingModel: "text-embedding-004",
    maxTokens: 2048,
    temperature: 0.7,
  },

  chroma: {
    dbPath: process.env.CHROMA_DB_PATH || "./chroma_db",
    collectionName: "discord_support",
    distanceMetric: "cosine",
  },

  scraper: {
    delay: parseInt(process.env.SCRAPER_DELAY) || 1000,
    timeout: 30000,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    maxRetries: 3,
  },

  // Text Processing Configuration
  textProcessing: {
    maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE) || 700,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 50,
    minChunkSize: 100,
  },

  // Discord Support URLs
  urls: {
    supportCenter: "https://support.discord.com/",
    serverSetup: "https://support.discord.com/hc/en-us/articles/360045138571",
    rolesPermissions: "https://support.discord.com/hc/en-us/articles/206029707",
    moderation:
      "https://support.discord.com/hc/en-us/sections/360008589993-Moderation",
    botIntegration: "https://support.discord.com/hc/en-us/articles/228383668",
    developerDocs: "https://discord.com/developers/docs/",
    webhooks: "https://discord.com/developers/docs/resources/webhook",
    botAPI: "https://discord.com/developers/docs/topics/oauth2",
    guidelines: "https://discord.com/guidelines",
    safetyPrivacy: "https://support.discord.com/hc/en-us/sections/360000045712",
  },
};

export default config;
