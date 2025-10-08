// import "dotenv/config";
// import inquirer from "inquirer";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createRetriever } from "./retriever.js";
// import { embedSingle } from "./utils/embeddings.js";

// async function main() {
//   if (!process.env.GEMINI_API_KEY) {
//     console.error("Missing GEMINI_API_KEY in environment.");
//     process.exit(1);
//   }

//   const retriever = await createRetriever();
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
//   const model = genAI.getGenerativeModel({ model: modelName });

//   console.log(
//     "Shopify Merchant Support (Tier 1) — single-turn RAG. Type 'exit' to quit.\n"
//   );

//   while (true) {
//     const { question } = await inquirer.prompt([
//       { name: "question", type: "input", message: "Ask a question:" },
//     ]);
//     if (!question || question.toLowerCase() === "exit") break;

//     // Embed query
//     const queryEmbedding = await embedSingle(question);
//     const results = await retriever.queryEmbeddingAware({
//       queryEmbedding,
//       k: 4,
//     });
//     const context = results
//       .map(
//         (r, i) =>
//           `[[${i + 1}]] Source: ${r.metadata?.title} (${
//             r.metadata?.source_url
//           })\n${r.doc}`
//       )
//       .join("\n\n---\n\n");

//     // Hide retrieved context from console; only show the final answer

//     const prompt = `You are a Shopify Merchant Support Assistant.\n\nInstructions:\n- Answer only using the Retrieved context.\n- If the answer is not present in the context, reply exactly: "Not found in documentation."\n\nRetrieved context:\n${context}\n\nUser question:\n${question}`;
//     let result;
//     try {
//       result = await model.generateContent({
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: prompt }],
//           },
//         ],
//       });
//     } catch (err) {
//       console.error(
//         `Gemini request failed for model "${modelName}". Set GEMINI_MODEL to a supported model (e.g., gemini-1.5-pro or gemini-1.5-flash) and ensure your GEMINI_API_KEY is from Google AI Studio (not a Vertex AI key).\n\nError:`,
//         err?.message || err
//       );
//       process.exit(1);
//     }
//     const answer = result.response?.text() || "No response.";
//     console.log("Answer:\n");
//     console.log(answer);
//     console.log("\n");
//   }

//   console.log("Goodbye!");
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

import "dotenv/config";
import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRetriever } from "./retriever.js";
import { embedSingle } from "./utils/embeddings.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate prerequisites before starting
async function validateSetup() {
  const errors = [];

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    errors.push("❌ Missing GEMINI_API_KEY in .env file");
  }

  // Check if index exists
  const indexPath = path.join(__dirname, "../data/shopify_index.json");
  try {
    await fs.access(indexPath);
  } catch {
    errors.push("❌ Index file not found. Run 'npm run ingest' first");
  }

  // Check if docs were scraped
  const docsPath = path.join(__dirname, "../data/shopify_docs");
  try {
    const files = await fs.readdir(docsPath);
    const jsonFiles = files.filter(
      (f) => f.endsWith(".json") && f !== "scraped.index.json"
    );
    if (jsonFiles.length === 0) {
      errors.push("❌ No scraped documents found. Run 'npm run scrape' first");
    }
  } catch {
    errors.push("❌ Data directory not found. Run 'npm run scrape' first");
  }

  if (errors.length > 0) {
    console.error("\n⚠️  Setup Issues Detected:\n");
    errors.forEach((err) => console.error(err));
    console.error("\n📋 Setup Instructions:");
    console.error("1. Create a .env file with: GEMINI_API_KEY=your_key_here");
    console.error(
      "2. Get your API key from: https://aistudio.google.com/app/apikey"
    );
    console.error("3. Run: npm run scrape");
    console.error("4. Run: npm run ingest");
    console.error("5. Run: npm run chat\n");
    process.exit(1);
  }
}

async function main() {
  console.log("🔍 Validating setup...\n");
  await validateSetup();

  console.log("✅ Setup validated successfully!\n");
  console.log("🤖 Loading Shopify Merchant Support Agent...\n");

  const retriever = await createRetriever();
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

  console.log("Shopify Merchant Support (Tier 1) — RAG Chat");
  console.log("Type 'exit' to quit.\n");
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

    try {
      console.log("\n🔎 Searching documentation...");

      // Embed query
      const queryEmbedding = await embedSingle(question);
      const results = await retriever.queryEmbeddingAware({
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

      console.log(`✓ Found ${results.length} relevant sections\n`);
      console.log("💭 Generating answer...\n");

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
