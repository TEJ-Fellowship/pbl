import "dotenv/config";
import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createOptimizedHybridRetriever } from "./optimized-hybrid-retriever.js";
import { embedQuery } from "./utils/enhanced-embeddings.js";
import { EnhancedResponseHandler } from "./enhanced-response-handler.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced validation with better error messages
async function validateSetup() {
  const errors = [];
  const warnings = [];

  // Check for API keys
  if (!process.env.GEMINI_API_KEY) {
    errors.push("❌ Missing GEMINI_API_KEY in .env file");
  }

  if (!process.env.PINECONE_API_KEY) {
    errors.push("❌ Missing PINECONE_API_KEY in .env file");
  }

  // Check if Pinecone index exists and has data
  try {
    const { getPineconeIndex } = await import("../config/pinecone.js");
    const index = await getPineconeIndex();

    // Check if index has data
    const stats = await index.describeIndexStats();
    if (stats.totalVectorCount === 0) {
      errors.push(
        "❌ Pinecone index is empty. Run 'npm run ingest' to populate it with data."
      );
    } else if (stats.totalVectorCount < 100) {
      warnings.push(
        `⚠️ Pinecone index has only ${stats.totalVectorCount} vectors. Consider running 'npm run ingest' for better results.`
      );
    } else {
      console.log(`✅ Pinecone index has ${stats.totalVectorCount} vectors`);
    }
  } catch (error) {
    errors.push(`❌ Pinecone connection failed: ${error.message}`);
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log("\n⚠️ Warnings:");
    warnings.forEach((warning) => console.log(warning));
  }

  if (errors.length > 0) {
    console.error("\n⚠️ Setup Issues Detected:\n");
    errors.forEach((err) => console.error(err));
    console.error("\n📋 Setup Instructions:");
    console.error("1. Create a .env file with:");
    console.error("   GEMINI_API_KEY=your_gemini_key_here");
    console.error("   PINECONE_API_KEY=your_pinecone_key_here");
    console.error("   PINECONE_INDEX_NAME=shopify-merchant-support");
    console.error(
      "2. Get your Gemini API key from: https://aistudio.google.com/app/apikey"
    );
    console.error(
      "3. Get your Pinecone API key from: https://app.pinecone.io/"
    );
    console.error(
      "4. Ensure your Pinecone index has data (run 'npm run ingest' if needed)"
    );
    console.error("5. Run: npm run chat\n");
    process.exit(1);
  }
}

async function main() {
  console.log("🔍 Validating setup...\n");
  await validateSetup();

  console.log("✅ Setup validated successfully!\n");
  console.log(
    "🚀 Loading Enhanced Shopify Merchant Support Agent (Tier 2)...\n"
  );

  // Create optimized retriever with enhanced settings
  const retriever = await createOptimizedHybridRetriever({
    semanticWeight: 0.6, // Balanced weights for better results
    keywordWeight: 0.4,
    maxResults: 15, // More results for better fusion
    finalK: 4,
    enableQueryExpansion: true,
    enableIntentDetection: true,
  });

  // Initialize enhanced response handler for Tier 2 improvements
  const responseHandler = new EnhancedResponseHandler();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Use reliable model with fallback
  let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  console.log(`Using model: ${modelName}\n`);

  let model;
  try {
    model = genAI.getGenerativeModel({ model: modelName });
  } catch (err) {
    // Silent fallback to gemini-1.5-flash
    if (modelName !== "gemini-1.5-flash") {
      try {
        modelName = "gemini-1.5-flash";
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Falling back to model: ${modelName}\n`);
      } catch (err2) {
        console.error(
          `❌ Failed to initialize any Gemini model: ${
            err2.message || err.message
          }`
        );
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to initialize Gemini model: ${err.message}`);
      process.exit(1);
    }
  }

  console.log("🎯 Enhanced Shopify Merchant Support Agent (Tier 2)");
  console.log(
    "✨ Features: Source citations, confidence scoring, code formatting, edge case handling\n"
  );
  console.log(
    "Type 'exit' to quit, 'stats' for search statistics, 'help' for commands.\n"
  );
  console.log("─".repeat(60));

  while (true) {
    console.log();
    const { question } = await inquirer.prompt([
      {
        name: "question",
        type: "input",
        message: "Ask a question:",
        validate: (input) =>
          input.trim().length > 0 || "Please enter a question",
      },
    ]);

    if (!question || question.toLowerCase() === "exit") break;

    // Handle commands
    if (question.toLowerCase() === "stats") {
      const stats = retriever.getStats();
      console.log("\n📊 Optimized Search Statistics:");
      console.log(`   Total Documents: ${stats.totalDocuments}`);
      console.log(`   Semantic Weight: ${stats.semanticWeight}`);
      console.log(`   Keyword Weight: ${stats.keywordWeight}`);
      console.log(`   Max Results: ${stats.maxResults}`);
      console.log(`   Final K: ${stats.finalK}`);
      console.log(
        `   Query Expansion: ${stats.queryExpansionEnabled ? "✅" : "❌"}`
      );
      console.log(
        `   Intent Detection: ${stats.intentDetectionEnabled ? "✅" : "❌"}`
      );
      console.log(`   Technical Terms: ${stats.technicalTermsCount}`);
      console.log(`   Initialized: ${stats.isInitialized ? "✅" : "❌"}`);
      continue;
    }

    if (question.toLowerCase() === "help") {
      console.log("\n📚 Available Commands:");
      console.log("   • Ask any question about Shopify");
      console.log("   • 'stats' - View search configuration");
      console.log("   • 'help' - Show this help message");
      console.log("   • 'exit' - Quit the application");
      console.log("\n💡 Example Questions:");
      console.log("   • What is Shopify?");
      console.log("   • How to create products using API?");
      console.log("   • REST API endpoints for orders");
      console.log("   • GraphQL Admin API authentication");
      console.log("   • Theme customization with Liquid");
      continue;
    }

    try {
      console.log(
        "\n🔎 Performing enhanced hybrid search with Tier 2 improvements..."
      );

      // Use enhanced query embedding
      const queryEmbedding = await embedQuery(question);
      console.log("📊 Query processed and embedded, searching vectors...");

      const results = await retriever.search({
        query: question,
        queryEmbedding,
        k: 4,
      });

      // Enhanced context building with better formatting
      const context = results
        .map(
          (r, i) =>
            `[Source ${i + 1}] ${
              r.metadata?.title || "Unknown"
            } (Score: ${r.score.toFixed(4)}, Type: ${r.searchType})\n${r.doc}`
        )
        .join("\n\n---\n\n");

      console.log(
        `✅ Found ${results.length} relevant sections using enhanced hybrid search:`
      );
      results.forEach((result, i) => {
        const boost = result.relevanceBoost
          ? ` (Boost: ${result.relevanceBoost.toFixed(2)}x)`
          : "";
        console.log(
          `   ${i + 1}. ${
            result.metadata?.title || "Unknown"
          } (Score: ${result.score.toFixed(4)}, Type: ${
            result.searchType
          })${boost}`
        );
      });
      console.log(
        "\n💭 Generating enhanced answer with Tier 2 improvements...\n"
      );

      // Enhanced prompt with better instructions for Tier 2
      const prompt = `You are an expert Shopify Merchant Support Assistant with deep knowledge of Shopify's platform, APIs, and best practices.

Instructions:
- Answer the question using ONLY the provided documentation context below.
- Be clear, concise, and actionable in your response.
- If the answer involves code or technical steps, provide specific examples with proper formatting.
- If the answer is not in the context, respond with: "I couldn't find this information in the available documentation. Please try rephrasing your question or contact Shopify support for assistance."
- Format your response in a friendly, professional tone.
- Use bullet points or numbered lists when appropriate for clarity.
- Include relevant code examples when applicable.
- Cite specific sources when referencing documentation.

Retrieved Documentation:
${context}

User Question: ${question}

Answer:`;

      // Generate response with error handling
      let result;
      let answer = "";
      let error = null;

      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
        answer = result.response?.text() || "No response generated.";
      } catch (err) {
        error = err;
        const msg = (err && err.message) || "";
        const unavailable =
          msg.includes("not available") ||
          msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("model not found");

        if (unavailable && modelName !== "gemini-1.5-flash") {
          try {
            modelName = "gemini-1.5-flash";
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`Switched to fallback model: ${modelName}\n`);
            result = await model.generateContent({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
            });
            answer = result.response?.text() || "No response generated.";
            error = null;
          } catch (err2) {
            answer = "No response generated due to model unavailability.";
            error = err2;
          }
        } else {
          answer = "No response generated due to an error.";
        }
      }

      // Process response with enhanced Tier 2 features
      const enhancedResponse = responseHandler.processResponse(
        answer,
        results,
        question,
        error
      );

      console.log("─".repeat(60));
      console.log("📝 Enhanced Answer:\n");
      console.log(enhancedResponse.formatted);
      console.log("\n" + "─".repeat(60));
    } catch (err) {
      console.error("\n❌ Error processing request:");

      if (err.message?.includes("404")) {
        console.error(`\nThe model "${modelName}" is not available.`);
        console.error("\n💡 Try these solutions:");
        console.error(
          "1. Use gemini-1.5-flash instead: Add to .env: GEMINI_MODEL=gemini-1.5-flash"
        );
        console.error(
          "2. Verify your API key is from Google AI Studio (not Vertex AI)"
        );
        console.error(
          "3. Get a new key: https://aistudio.google.com/app/apikey\n"
        );
      } else if (err.message?.includes("API key")) {
        console.error("\nAPI key issue detected.");
        console.error(
          "Get your key from: https://aistudio.google.com/app/apikey\n"
        );
      } else {
        console.error(`\n${err.message || err}\n`);
      }

      // Don't exit, let user try again
      continue;
    }
  }

  console.log("\n👋 Goodbye!\n");
}

main().catch((e) => {
  console.error("\n❌ Fatal error:", e.message || e);
  console.error(
    "\n💡 If you need help, check README.md for setup instructions.\n"
  );
  process.exit(1);
});
