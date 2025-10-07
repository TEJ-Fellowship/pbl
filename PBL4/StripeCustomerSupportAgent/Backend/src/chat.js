import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";

// Initialize Gemini client
function initGeminiClient() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(config.GEMINI_API_KEY);
}

// Initialize Gemini embeddings
function initGeminiEmbeddings() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });
}

// Initialize Pinecone client
async function initPinecone() {
  try {
    if (!config.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }

    const pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });
    console.log("✅ Pinecone client initialized");
    return pinecone;
  } catch (error) {
    console.error("❌ Pinecone initialization failed:", error.message);
    throw error;
  }
}

// Load vector store (fallback to local JSON)
async function loadVectorStore() {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.Index(config.PINECONE_INDEX_NAME);
    console.log(
      `✅ Connected to Pinecone index: ${config.PINECONE_INDEX_NAME}`
    );
    return { type: "pinecone", index };
  } catch (error) {
    console.log("⚠️ Pinecone unavailable, using local vector store...");
    console.log(`   Reason: ${error.message}`);

    // Fallback to local JSON
    try {
      const vectorStorePath = path.join(
        process.cwd(),
        "data",
        "vector_store.json"
      );
      const data = await fs.readFile(vectorStorePath, "utf-8");
      const vectorStore = JSON.parse(data);
      console.log(
        `✅ Loaded local vector store with ${vectorStore.chunks.length} chunks`
      );
      return { type: "local", data: vectorStore };
    } catch (localError) {
      console.error(
        "❌ Failed to load local vector store:",
        localError.message
      );
      throw localError;
    }
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

  // Handle both Pinecone and local vector stores
  const chunks =
    vectorStore.type === "pinecone"
      ? [] // Pinecone doesn't support keyword search, return empty
      : vectorStore.data.chunks;

  if (chunks.length === 0) {
    console.log(
      "⚠️ Keyword search not available for Pinecone, returning empty results"
    );
    return [];
  }

  const scoredChunks = chunks.map((chunk) => {
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
    .slice(0, parseInt(config.MAX_CHUNKS) || 10)
    .map((item) => ({
      content: item.chunk.content,
      metadata: item.chunk.metadata,
      score: item.score,
    }));
}

// Retrieve relevant chunks using embeddings
async function retrieveChunksWithEmbeddings(query, vectorStore, embeddings) {
  try {
    console.log(
      "🔍 Searching for relevant information using Gemini embeddings..."
    );

    // Generate query embedding using LangChain Gemini embeddings
    const queryEmbedding = await embeddings.embedQuery(query);

    // Debug: Check if embedding was generated
    if (
      !queryEmbedding ||
      !Array.isArray(queryEmbedding) ||
      queryEmbedding.length === 0
    ) {
      throw new Error("Failed to generate query embedding");
    }

    console.log(
      `📊 Query embedding generated with ${queryEmbedding.length} dimensions`
    );

    let topChunks = [];

    if (vectorStore.type === "pinecone") {
      console.log("🔍 Searching in Pinecone...");
      const searchResponse = await vectorStore.index.query({
        vector: queryEmbedding,
        topK: parseInt(config.MAX_CHUNKS) || 10,
        includeMetadata: true,
      });

      topChunks = searchResponse.matches.map((match) => ({
        content: match.metadata.content,
        metadata: {
          source: match.metadata.source,
          title: match.metadata.title,
          category: match.metadata.category,
          docType: match.metadata.docType,
          chunk_index: match.metadata.chunk_index,
          total_chunks: match.metadata.total_chunks,
        },
        similarity: match.score,
      }));
    } else {
      console.log("🔍 Searching in local vector store...");
      const similarities = vectorStore.data.chunks.map((chunk) => {
        if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
          return { chunk, similarity: 0 };
        }
        return {
          chunk,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        };
      });

      topChunks = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, parseInt(config.MAX_CHUNKS) || 10)
        .map((item) => ({
          content: item.chunk.content,
          metadata: item.chunk.metadata,
          similarity: item.similarity,
        }));
    }

    console.log(
      `📊 Top similarity scores: ${topChunks
        .slice(0, 3)
        .map((t) => t.similarity.toFixed(3))
        .join(", ")}`
    );

    console.log(
      `📚 Found ${topChunks.length} relevant chunks using semantic search`
    );
    return topChunks;
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
      similarity: chunk.similarity,
      score: chunk.score || 0,
      index: index + 1,
    }));

    // Generate response using Gemini
    const prompt = `You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

CONTEXT (Stripe Documentation):
${context}

USER QUESTION: ${query}

RESPONSE GUIDELINES:
1. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
2. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
3. **Include Code**: Always include practical code examples in the appropriate programming language
4. **Step-by-Step**: Break down complex processes into clear, actionable steps
5. **Error Handling**: Mention common errors and how to handle them
6. **Best Practices**: Include security considerations and best practices
7. **Source Citations**: Reference specific sources using [Source X] format
8. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- End with source citations

Remember: You're helping developers build payment solutions, so be practical and solution-oriented.`;

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
  console.log("💳 Stripe Customer Support Agent - Chat Interface");
  console.log("=".repeat(60));
  console.log("🤖 AI Provider: GEMINI");
  console.log("💡 Type 'exit' to quit, 'sample' for more questions");
  console.log("=".repeat(60));
  console.log("\n🚀 Sample Questions to Get Started:");
  console.log("  • How do I create a payment intent with Stripe?");
  console.log("  • What are webhook signatures and how do I verify them?");
  console.log("  • How to handle Stripe API errors and exceptions?");
  console.log("  • How do I set up subscription billing with Stripe?");
  console.log("=".repeat(60));

  try {
    // Initialize components
    const geminiClient = initGeminiClient();
    const embeddings = initGeminiEmbeddings();
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

        if (query.toLowerCase() === "sample") {
          console.log("\n💡 Example Questions by Category:");
          console.log("\n🔧 API Integration:");
          console.log("  • How do I create a payment intent with Stripe?");
          console.log("  • How to handle Stripe API errors and exceptions?");
          console.log("  • What's the difference between test and live mode?");
          console.log("\n🔐 Security & Webhooks:");
          console.log(
            "  • What are webhook signatures and how do I verify them?"
          );
          console.log("  • How do I implement 3D Secure authentication?");
          console.log("  • How to secure my Stripe integration?");
          console.log("\n💳 Payments & Billing:");
          console.log("  • How do I set up subscription billing with Stripe?");
          console.log("  • How to handle refunds and disputes?");
          console.log("  • What are Stripe Connect and marketplace payments?");
          console.log("\n🛠️ Advanced Features:");
          console.log("  • How to implement multi-party payments?");
          console.log("  • How to handle international payments?");
          console.log("  • How to set up Stripe Radar for fraud detection?");
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
            embeddings
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
              // Generate a better title from content if metadata title is empty
              let title = source.metadata.title || source.metadata.doc_title;
              if (!title || title.trim() === "") {
                // Extract first meaningful line from content as title
                const contentLines = source.content
                  .split("\n")
                  .filter((line) => line.trim() !== "");
                const firstLine = contentLines[0] || "";
                title =
                  firstLine.length > 60
                    ? firstLine.substring(0, 60) + "..."
                    : firstLine;
                if (!title) title = "Stripe Documentation";
              }

              const category = source.metadata.category || "documentation";
              const url =
                source.metadata.source ||
                source.metadata.source_url ||
                "https://stripe.com/docs";

              console.log(`${source.index}. ${title} (${category})`);
              console.log(`   URL: ${url}`);
              const relevanceScore = source.similarity || source.score || 0;
              const relevanceType = source.similarity
                ? "similarity"
                : "keywords matched";
              console.log(
                `   Relevance: ${relevanceScore.toFixed(3)} ${relevanceType}`
              );
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
if (process.argv[1] && process.argv[1].endsWith("chat.js")) {
  startChat().catch(console.error);
}

export {
  generateResponse,
  loadVectorStore,
  initGeminiClient,
  initGeminiEmbeddings,
};
