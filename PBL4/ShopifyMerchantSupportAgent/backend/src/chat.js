import "dotenv/config";
import inquirer from "inquirer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRetriever } from "./retriever.js";
import { embedSingle } from "./utils/embeddings.js";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in environment.");
    process.exit(1);
  }

  const retriever = await createRetriever();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const model = genAI.getGenerativeModel({ model: modelName });

  console.log(
    "Shopify Merchant Support (Tier 1) — single-turn RAG. Type 'exit' to quit.\n"
  );

  while (true) {
    const { question } = await inquirer.prompt([
      { name: "question", type: "input", message: "Ask a question:" },
    ]);
    if (!question || question.toLowerCase() === "exit") break;

    // Embed query
    const queryEmbedding = await embedSingle(question);
    const results = await retriever.queryEmbeddingAware({
      queryEmbedding,
      k: 4,
    });
    const context = results
      .map(
        (r, i) =>
          `[[${i + 1}]] Source: ${r.metadata?.title} (${
            r.metadata?.source_url
          })\n${r.doc}`
      )
      .join("\n\n---\n\n");

    // Hide retrieved context from console; only show the final answer

    const prompt = `You are a Shopify Merchant Support Assistant.\n\nInstructions:\n- Answer only using the Retrieved context.\n- If the answer is not present in the context, reply exactly: "Not found in documentation."\n\nRetrieved context:\n${context}\n\nUser question:\n${question}`;
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
      console.error(
        `Gemini request failed for model "${modelName}". Set GEMINI_MODEL to a supported model (e.g., gemini-1.5-pro or gemini-1.5-flash) and ensure your GEMINI_API_KEY is from Google AI Studio (not a Vertex AI key).\n\nError:`,
        err?.message || err
      );
      process.exit(1);
    }
    const answer = result.response?.text() || "No response.";
    console.log("Answer:\n");
    console.log(answer);
    console.log("\n");
  }

  console.log("Goodbye!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
