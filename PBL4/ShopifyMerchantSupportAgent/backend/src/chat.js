import "dotenv/config";
import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHybridRetriever } from "./hybrid-retriever.js";
import { embedSingle } from "./utils/embeddings.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate prerequisites before starting
async function validateSetup() {
  const errors = [];

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
    } else {
      console.log(`✅ Pinecone index has ${stats.totalVectorCount} vectors`);
    }
  } catch (error) {
    errors.push(`❌ Pinecone connection failed: ${error.message}`);
  }

  // Note: We're using Pinecone vector database, so local scraped docs are not required
  // The validation above already checked that Pinecone has data

  if (errors.length > 0) {
    console.error("\n⚠️  Setup Issues Detected:\n");
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
    "🤖 Loading Shopify Merchant Support Agent with Hybrid Search...\n"
  );

  const retriever = await createHybridRetriever({
    semanticWeight: 0.7, // 70% semantic search
    keywordWeight: 0.3, // 30% keyword search
    maxResults: 10, // Get more results for fusion
    finalK: 4, // Return top 4 results
  });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Use correct model name - gemini-1.5-flash is more reliable
  // Choose model from env or default to a reliable one.
  let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  console.log(`Using model: ${modelName}\n`);

  let model;
  try {
    model = genAI.getGenerativeModel({ model: modelName });
  } catch (err) {
    // Silent fallback: if initial model isn't available, try gemini-1.5-flash
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

  console.log("Shopify Merchant Support (Tier 2) — Hybrid RAG Chat");
  console.log("Type 'exit' to quit, 'stats' for search statistics.\n");
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

    // Handle stats command
    if (question.toLowerCase() === "stats") {
      const stats = retriever.getStats();
      console.log("\n📊 Hybrid Search Statistics:");
      console.log(`   Total Documents: ${stats.totalDocuments}`);
      console.log(`   Semantic Weight: ${stats.semanticWeight}`);
      console.log(`   Keyword Weight: ${stats.keywordWeight}`);
      console.log(`   Max Results: ${stats.maxResults}`);
      console.log(`   Final K: ${stats.finalK}`);
      console.log(`   Initialized: ${stats.isInitialized}`);
      continue;
    }

    try {
      console.log("\n🔎 Performing hybrid search (semantic + keyword)...");

      // Embed query
      const queryEmbedding = await embedSingle(question);
      console.log("📊 Query embedded, searching vectors...");

      const results = await retriever.search({
        query: question,
        queryEmbedding,
        k: 4,
      });

      if (results.length === 0) {
        console.log("\n❌ No relevant documentation found.\n");
        continue;
      }

      const context = results
        .map(
          (r, i) =>
            `[Source ${i + 1}] ${r.metadata?.title || "Unknown"} (${
              r.metadata?.source_url || "N/A"
            })\n${r.doc}`
        )
        .join("\n\n---\n\n");

      console.log(
        `✓ Found ${results.length} relevant sections using hybrid search:`
      );
      results.forEach((result, i) => {
        console.log(
          `   ${i + 1}. ${
            result.metadata?.title || "Unknown"
          } (Score: ${result.score.toFixed(4)}, Type: ${result.searchType})`
        );
      });
      console.log("\n💭 Generating answer using retrieved context...\n");

      const prompt = `You are a helpful Shopify Merchant Support Assistant.

Instructions:
- Answer the question using ONLY the provided documentation context below.
- Be clear, concise, and actionable.
- If the answer is not in the context, respond with: "I couldn't find this information in the available documentation."
- Format your response in a friendly, supportive tone.

Retrieved Documentation:
${context}

User Question: ${question}

Answer:`;

      // Try generating content; if the model is unavailable, silently
      // fallback to gemini-1.5-flash and retry once.
      let result;
      try {
        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        });
      } catch (err) {
        const msg = (err && err.message) || "";
        const unavailable =
          msg.includes("not available") ||
          msg.includes("404") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("model not found");

        if (unavailable && modelName !== "gemini-1.5-flash") {
          // Attempt silent fallback and retry once
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
          } catch (err2) {
            // Give a safe fallback response instead of throwing an error
            result = { response: { text: () => "No response generated." } };
          }
        } else {
          // Non-model-availability error: return safe fallback
          result = { response: { text: () => "No response generated." } };
        }
      }

      const answer = result.response?.text() || "No response generated.";

      console.log("─".repeat(60));
      console.log("📝 Answer:\n");
      console.log(answer);
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
