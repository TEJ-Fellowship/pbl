import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const VECTOR_STORE_PATH = "./data/vector_store.json";
const MAX_CHUNKS = 10;

// Initialize Gemini client
function initGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Load vector store
async function loadVectorStore() {
  try {
    const vectorStorePath = path.join(process.cwd(), VECTOR_STORE_PATH);
    const data = await fs.readFile(vectorStorePath, "utf-8");
    const vectorStore = JSON.parse(data);

    console.log(
      `✅ Loaded vector store with ${vectorStore.chunks.length} chunks`
    );
    return vectorStore;
  } catch (error) {
    console.error("❌ Failed to load vector store:", error.message);
    throw error;
  }
}

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Simple keyword-based search (fallback when embeddings fail)
function searchChunks(query, vectorStore) {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/);

  const scoredChunks = vectorStore.chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    keywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) {
        score += 1;
      }
    });

    return { chunk, score };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CHUNKS)
    .map((item) => ({
      content: item.chunk.content,
      metadata: item.chunk.metadata,
      score: item.score,
    }));
}

// Retrieve relevant chunks using embeddings
async function retrieveChunksWithEmbeddings(query, vectorStore, geminiClient) {
  try {
    console.log("🔍 Searching for relevant information using embeddings...");

    // Generate query embedding using Gemini
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const embeddingPrompt = `Generate embeddings for this query: "${query}". Return only a JSON array of numbers representing the embedding vector.`;

    // For now, fall back to keyword search since Gemini doesn't have direct embedding API
    console.log("⚠️  Using keyword-based search (embeddings not available)");
    return searchChunks(query, vectorStore);
  } catch (error) {
    console.error(
      "❌ Embedding retrieval failed, using keyword search:",
      error.message
    );
    return searchChunks(query, vectorStore);
  }
}

// Generate response using Gemini
async function generateResponse(query, chunks, geminiClient) {
  try {
    console.log("🤖 Generating response...");

    // Prepare context from retrieved chunks
    const context = chunks
      .map((chunk, index) => `[Source ${index + 1}] ${chunk.content}`)
      .join("\n\n");

    const sources = chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      score: chunk.score || 0,
      index: index + 1,
    }));

    // Generate response using Gemini
    const prompt = `You are a helpful Stripe API support assistant. Answer questions using only the provided documentation context.

Context:
${context}

Question: ${query}

Instructions:
- Answer based only on the provided context
- If you can't find relevant information, say so
- Be specific and provide code examples when relevant
- Cite sources using [Source X] format
- Keep responses concise but comprehensive`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      sources: sources,
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error.message);
    throw error;
  }
}

// Main chat function
async function startChat() {
  console.log(
    "💳 Stripe Customer Support Agent - Chat Interface (Full Gemini)"
  );
  console.log("=".repeat(60));
  console.log("🤖 AI Provider: GEMINI (Full)");
  console.log("💡 Type 'exit' to quit, 'help' for commands");
  console.log("=".repeat(60));

  try {
    // Initialize components
    const geminiClient = initGeminiClient();
    const vectorStore = await loadVectorStore();

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question("\n❓ Your question: ", async (query) => {
        if (query.toLowerCase() === "exit") {
          console.log("👋 Goodbye!");
          rl.close();
          return;
        }

        if (query.toLowerCase() === "help") {
          console.log("\n📋 Available commands:");
          console.log("  • Ask any Stripe-related question");
          console.log("  • 'exit' - Quit the chat");
          console.log("  • 'help' - Show this help");
          console.log("\n💡 Example questions:");
          console.log("  • How do I create a payment intent?");
          console.log("  • What are webhook signatures?");
          console.log("  • How to handle Stripe errors?");
          askQuestion();
          return;
        }

        if (query.trim() === "") {
          console.log("❌ Please enter a question.");
          askQuestion();
          return;
        }

        try {
          // Retrieve relevant chunks
          const chunks = await retrieveChunksWithEmbeddings(
            query,
            vectorStore,
            geminiClient
          );

          if (chunks.length === 0) {
            console.log(
              "❌ No relevant information found. Try rephrasing your question."
            );
            askQuestion();
            return;
          }

          // Generate response
          const result = await generateResponse(query, chunks, geminiClient);

          console.log("\n🤖 Assistant:");
          console.log("-".repeat(40));
          console.log(result.answer);
          console.log("-".repeat(40));

          // Show sources
          if (result.sources && result.sources.length > 0) {
            console.log("\n📚 Sources:");
            result.sources.forEach((source) => {
              console.log(
                `${source.index}. ${source.metadata.doc_title} (${source.metadata.category})`
              );
              console.log(`   URL: ${source.metadata.source_url}`);
              console.log(`   Relevance: ${source.score} keywords matched`);
            });
          }
        } catch (error) {
          console.error("❌ Error processing question:", error.message);
        }

        askQuestion();
      });
    };

    askQuestion();
  } catch (error) {
    console.error("❌ Chat initialization failed:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("chat-gemini-full.js")) {
  startChat().catch(console.error);
}

export { generateResponse, loadVectorStore, initGeminiClient };
