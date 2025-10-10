// backend/src/chat.js
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
  // Try Pinecone first, but with better error handling
  try {
    const pinecone = await initPinecone();
    const index = pinecone.Index(config.PINECONE_INDEX_NAME);

    // Test the connection with a simple query
    await index.describeIndexStats();
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

// Enhanced keyword-based search with code/text separation (fallback when embeddings fail)
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

  // Detect if query is code-related
  const isCodeQuery =
    /\b(function|class|import|require|def |const |let |var |console\.log|npm |pip |curl |git |docker )\b/i.test(
      query
    );

  const scoredChunks = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    keywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) {
        score += 1;
      }
    });

    // Boost score for code chunks if query is code-related
    if (isCodeQuery && chunk.metadata.type === "code") {
      score += 2;
    }
    // Boost score for text chunks if query is not code-related
    else if (!isCodeQuery && chunk.metadata.type === "text") {
      score += 1;
    }

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

// Retrieve relevant chunks using embeddings with hybrid search
async function retrieveChunksWithEmbeddings(query, vectorStore, embeddings) {
  try {
    console.log(
      "🔍 Searching for relevant information using Gemini embeddings with hybrid search..."
    );

    // Detect query type for hybrid search
    const isCodeQuery =
      /\b(function|class|import|require|def |const |let |var |console\.log|npm |pip |curl |git |docker |error|exception)\b/i.test(
        query
      );
    const hasErrorCode = /\b(2\d{4}|\d{5})\b/.test(query);

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
    console.log(
      `🔍 Query type detected: ${
        isCodeQuery ? "code-related" : "text-related"
      }${hasErrorCode ? " (contains error code)" : ""}`
    );

    let topChunks = [];

    if (vectorStore.type === "pinecone") {
      console.log("🔍 Searching in Pinecone...");
      const searchResponse = await vectorStore.index.query({
        vector: queryEmbedding,
        topK: parseInt(config.MAX_CHUNKS) || 15, // Get more results for hybrid ranking
        includeMetadata: true,
        filter: hasErrorCode
          ? {
              error_codes: { $in: query.match(/\b(2\d{4}|\d{5})\b/g) || [] },
            }
          : undefined,
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
          // Tier 2 metadata
          type: match.metadata.type,
          language: match.metadata.language,
          api: match.metadata.api,
          version: match.metadata.version,
          errorCodes: match.metadata.error_codes || [],
        },
        similarity: match.score,
      }));
    } else {
      console.log("🔍 Searching in local vector store...");
      const similarities = vectorStore.data.chunks.map((chunk) => {
        if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
          return { chunk, similarity: 0 };
        }
        let similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

        // Hybrid search boost
        if (isCodeQuery && chunk.metadata.type === "code") {
          similarity += 0.1; // Boost code chunks for code queries
        } else if (!isCodeQuery && chunk.metadata.type === "text") {
          similarity += 0.05; // Boost text chunks for non-code queries
        }

        // Error code exact match boost
        if (
          hasErrorCode &&
          chunk.metadata.errorCodes &&
          chunk.metadata.errorCodes.length > 0
        ) {
          const queryErrorCodes = query.match(/\b(2\d{4}|\d{5})\b/g) || [];
          const hasMatchingErrorCode = queryErrorCodes.some((code) =>
            chunk.metadata.errorCodes.includes(code)
          );
          if (hasMatchingErrorCode) {
            similarity += 0.2; // Strong boost for exact error code matches
          }
        }

        return {
          chunk,
          similarity: Math.min(similarity, 1.0), // Cap at 1.0
        };
      });

      topChunks = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, parseInt(config.MAX_CHUNKS) || 15)
        .map((item) => ({
          content: item.chunk.content,
          metadata: item.chunk.metadata,
          similarity: item.similarity,
        }));
    }

    // Balance results between code and text chunks
    const textChunks = topChunks.filter((c) => c.metadata.type === "text");
    const codeChunks = topChunks.filter((c) => c.metadata.type === "code");

    let balancedChunks = [];
    if (isCodeQuery) {
      // For code queries, prioritize code chunks but include some text
      balancedChunks = [
        ...codeChunks.slice(0, Math.min(8, codeChunks.length)),
        ...textChunks.slice(0, Math.min(4, textChunks.length)),
      ];
    } else {
      // For text queries, prioritize text chunks but include some code
      balancedChunks = [
        ...textChunks.slice(0, Math.min(8, textChunks.length)),
        ...codeChunks.slice(0, Math.min(4, codeChunks.length)),
      ];
    }

    console.log(
      `📊 Top similarity scores: ${balancedChunks
        .slice(0, 3)
        .map((t) => t.similarity.toFixed(3))
        .join(", ")}`
    );

    console.log(
      `📚 Found ${balancedChunks.length} relevant chunks (${textChunks.length} text, ${codeChunks.length} code) using hybrid search`
    );
    return balancedChunks;
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

    // Generate response using Gemini with enhanced context awareness
    const prompt = `You are an expert Twilio developer support agent with deep knowledge of Twilio's API docs, SMS quickstart, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Twilio.

CONTEXT (Twilio Documentation):
${context}

USER QUESTION: ${query}

RESPONSE GUIDELINES:
1. **Accuracy First**: Base your answer strictly on the provided Twilio documentation context
2. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
3. **Include Code**: Always include practical code examples in the appropriate programming language
4. **Step-by-Step**: Break down complex processes into clear, actionable steps
5. **Error Handling**: Mention common errors and how to handle them, especially Twilio error codes
6. **Best Practices**: Include security considerations and best practices
7. **Source Citations**: Reference specific sources using [Source X] format
8. **Code Formatting**: Use proper syntax highlighting for code blocks
9. **Language Detection**: Detect the user's preferred programming language from context
10. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- Format code blocks with proper syntax highlighting
- End with source citations

HYBRID SEARCH CONTEXT:
The retrieved chunks include both text explanations and code examples. Use both types of information to provide comprehensive answers. Code chunks contain specific implementation details, while text chunks provide conceptual explanations.

`;

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
  console.log("💳 Twilio Customer Support Agent - Chat Interface");
  console.log("=".repeat(60));
  console.log("🤖 AI Provider: GEMINI");
  console.log("💡 Type 'exit' to quit, 'sample' for more questions");
  console.log("=".repeat(60));
  console.log("\n🚀 Sample Questions to Get Started:");
  console.log("  • How do I create a payment intent with Twilio?");
  console.log("  • What are webhook signatures and how do I verify them?");
  console.log("  • How to handle Twilio API errors and exceptions?");
  console.log("  • How do I set up subscription billing with Twilio?");
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
          console.log("  • How do I create a payment intent with Twilio?");
          console.log("  • How to handle Twilio API errors and exceptions?");
          console.log("  • What's the difference between test and live mode?");
          console.log("\n🔐 Security & Webhooks:");
          console.log(
            "  • What are webhook signatures and how do I verify them?"
          );
          console.log("  • How do I implement 3D Secure authentication?");
          console.log("  • How to secure my Twilio integration?");
          console.log("\n💳 Payments & Billing:");
          console.log("  • How do I set up subscription billing with Twilio?");
          console.log("  • How to handle refunds and disputes?");
          console.log("  • What are Twilio Connect and marketplace payments?");
          console.log("\n🛠️ Advanced Features:");
          console.log("  • How to implement multi-party payments?");
          console.log("  • How to handle international payments?");
          console.log("  • How to set up Twilio Radar for fraud detection?");
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

          // Show sources with enhanced metadata
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
                if (!title) title = "Twilio Documentation";
              }

              const category = source.metadata.category || "documentation";
              const url =
                source.metadata.source ||
                source.metadata.source_url ||
                "https://twilio.com/docs";

              // Enhanced source display with Tier 2 metadata
              const chunkType =
                source.metadata.type === "code" ? "💻 Code" : "📄 Text";
              const language =
                source.metadata.language && source.metadata.language !== "text"
                  ? ` (${source.metadata.language})`
                  : "";
              const api = source.metadata.api
                ? ` | API: ${source.metadata.api}`
                : "";
              const errorCodes =
                source.metadata.errorCodes &&
                source.metadata.errorCodes.length > 0
                  ? ` | Errors: ${source.metadata.errorCodes.join(", ")}`
                  : "";

              console.log(
                `${source.index}. ${chunkType}${language}${api}${errorCodes}`
              );
              console.log(`   ${title} (${category})`);
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
          // Don't close readline on error, just continue
        }

        // Always ask next question unless readline was closed
        if (!rl.closed) {
          askQuestion();
        }
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
  retrieveChunksWithEmbeddings,
  searchChunks,
};
