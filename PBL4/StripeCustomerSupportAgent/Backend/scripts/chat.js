import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import HybridSearch from "../hybridSearch.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
import MemoryController from "../controllers/memoryController.js";
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

// Load vector store from Pinecone
async function loadVectorStore() {
  try {
    const pinecone = await initPinecone();
    const index = pinecone.Index(config.PINECONE_INDEX_NAME);
    console.log(
      `✅ Connected to Pinecone index: ${config.PINECONE_INDEX_NAME}`
    );
    return { type: "pinecone", index };
  } catch (error) {
    console.error("❌ Pinecone initialization failed:", error.message);
    console.log("   Please check your Pinecone configuration and try again.");
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

// Retrieve relevant chunks using hybrid search (PostgreSQL BM25 + Semantic)
async function retrieveChunksWithHybridSearch(query, vectorStore, embeddings) {
  try {
    console.log(
      "🔍 Searching for relevant information using PostgreSQL hybrid search..."
    );

    // Initialize PostgreSQL BM25 service
    const postgresBM25Service = new PostgreSQLBM25Service();

    // Initialize hybrid search system with PostgreSQL
    const hybridSearch = new HybridSearch(
      vectorStore,
      embeddings,
      postgresBM25Service
    );

    // Perform hybrid search
    const results = await hybridSearch.hybridSearch(
      query,
      parseInt(config.MAX_CHUNKS) || 10
    );

    // Convert results to expected format
    const topChunks = results.map((result) => ({
      content: result.content,
      metadata: result.metadata,
      similarity: result.finalScore,
      score: result.finalScore,
      searchType: result.searchType || "hybrid",
      bm25Score: result.bm25Score,
      semanticScore: result.semanticScore,
    }));

    console.log(
      `📊 Top hybrid scores: ${topChunks
        .slice(0, 3)
        .map((t) => t.similarity.toFixed(3))
        .join(", ")}`
    );

    console.log(
      `📚 Found ${topChunks.length} relevant chunks using hybrid search`
    );
    return topChunks;
  } catch (error) {
    console.error(
      "❌ Hybrid search failed, falling back to semantic search:",
      error.message
    );
    return retrieveChunksWithEmbeddings(query, vectorStore, embeddings);
  }
}

// Retrieve relevant chunks using embeddings (fallback)
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
    console.error("❌ Embedding retrieval failed:", error.message);
    console.log("   Please check your Pinecone configuration and try again.");
    throw error;
  }
}

// Generate response using Gemini
async function generateResponse(query, chunks, geminiClient) {
  try {
    console.log("🤖 Generating response...");

    // Limit sources to most relevant ones (configurable)
    const maxSources = parseInt(config.MAX_SOURCES) || 3;
    const limitedChunks = chunks.slice(0, maxSources);

    // Prepare context from limited chunks with meaningful source titles
    const context = limitedChunks
      .map((chunk, index) => {
        const title =
          chunk.metadata?.title ||
          chunk.metadata?.doc_title ||
          `Document ${index + 1}`;
        const category = chunk.metadata?.category || "documentation";
        return `[Source ${index + 1}: ${title} (${category})]\n${
          chunk.content
        }`;
      })
      .join("\n\n");

    const sources = limitedChunks.map((chunk, index) => {
      // Generate clean, ChatGPT-style titles
      let title = chunk.metadata?.title || chunk.metadata?.doc_title;

      // If no title, generate one from content
      if (!title || title.trim() === "") {
        const contentLines = chunk.content
          .split("\n")
          .filter((line) => line.trim() !== "");
        const firstLine = contentLines[0] || "";
        title =
          firstLine.length > 60
            ? firstLine.substring(0, 60) + "..."
            : firstLine;
        if (!title) title = "Stripe Documentation";
      }

      // Clean up title formatting
      title = title
        .replace(/^#+\s*/, "")
        .replace(/\n.*$/, "")
        .trim();

      const category = chunk.metadata?.category || "documentation";
      const url =
        chunk.metadata?.source ||
        chunk.metadata?.source_url ||
        "https://stripe.com/docs";

      return {
        content: chunk.content,
        metadata: chunk.metadata,
        title: title,
        category: category,
        url: url,
        similarity: chunk.similarity,
        score: chunk.score || 0,
        index: index + 1,
      };
    });

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
7. **Source Citations**: ALWAYS reference sources using the EXACT format shown in the context: [Source X: Title (Category)]. For example, if you see "[Source 1: Stripe Webhooks Documentation (webhooks)]" in the context, use exactly that format in your response.
8. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- End with a formatted source list using this EXACT format:

📚 **Sources:**
🔗 [Title] - URL
🔗 [Title] - URL
🔗 [Title] - URL

IMPORTANT: 
- Use clean, readable titles (remove markdown formatting, truncate if too long)
- Include the actual URLs from the source metadata
- Format sources as clickable links with emojis for visual separation
- Keep titles concise and descriptive (max 60 characters)
- Only show the most relevant sources (top 3)

Remember: You're helping developers build payment solutions, so be practical and solution-oriented.`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
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

// Generate response with memory context integration
async function generateResponseWithMemory(
  query,
  chunks,
  geminiClient,
  memoryContext
) {
  try {
    console.log("\n🤖 Generating response with memory context...");

    // Limit sources to most relevant ones (configurable)
    const maxSources = parseInt(config.MAX_SOURCES) || 3;
    const limitedChunks = chunks.slice(0, maxSources);

    // Prepare context from limited chunks with meaningful source titles
    const context = limitedChunks
      .map((chunk, index) => {
        const title =
          chunk.metadata?.title ||
          chunk.metadata?.doc_title ||
          `Document ${index + 1}`;
        const category = chunk.metadata?.category || "documentation";
        return `[Source ${index + 1}: ${title} (${category})]\n${
          chunk.content
        }`;
      })
      .join("\n\n");

    const sources = limitedChunks.map((chunk, index) => {
      // Generate clean, ChatGPT-style titles
      let title = chunk.metadata?.title || chunk.metadata?.doc_title;

      // If no title, generate one from content
      if (!title || title.trim() === "") {
        const contentLines = chunk.content
          .split("\n")
          .filter((line) => line.trim() !== "");
        const firstLine = contentLines[0] || "";
        title =
          firstLine.length > 60
            ? firstLine.substring(0, 60) + "..."
            : firstLine;
        if (!title) title = "Stripe Documentation";
      }

      // Clean up title formatting
      title = title
        .replace(/^#+\s*/, "")
        .replace(/\n.*$/, "")
        .trim();

      const category = chunk.metadata?.category || "documentation";
      const url =
        chunk.metadata?.source ||
        chunk.metadata?.source_url ||
        "https://stripe.com/docs";

      return {
        content: chunk.content,
        metadata: chunk.metadata,
        title: title,
        category: category,
        url: url,
        similarity: chunk.similarity,
        score: chunk.score || 0,
        index: index + 1,
      };
    });

    // Build memory context string
    let memoryContextString = "";

    if (memoryContext.recentContext && memoryContext.recentContext.hasContext) {
      memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
    }

    if (
      memoryContext.longTermContext &&
      memoryContext.longTermContext.hasLongTermContext
    ) {
      const relevantQAs = memoryContext.longTermContext.relevantQAs;
      if (relevantQAs && relevantQAs.length > 0) {
        memoryContextString += `\n\nRELEVANT PREVIOUS DISCUSSIONS:\n`;
        relevantQAs.forEach((qa, index) => {
          memoryContextString += `[Previous Q&A ${index + 1}] Q: ${
            qa.question
          }\nA: ${qa.answer.substring(0, 200)}...\n\n`;
        });
      }
    }

    // Generate response using Gemini with memory context
    const prompt = `You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

      You have access to both current Stripe documentation and previous conversation context to provide contextually aware responses.

      CURRENT STRIPE DOCUMENTATION:
      ${context}

      CURRENT USER QUESTION: ${query}
      ${memoryContextString}

      RESPONSE GUIDELINES:
      1. **Context Awareness**: Use previous conversation context to provide more relevant and personalized responses
      2. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
      3. **Continuity**: Reference previous discussions when relevant to maintain conversation flow
      4. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
      5. **Include Code**: Always include practical code examples in the appropriate programming language
      6. **Step-by-Step**: Break down complex processes into clear, actionable steps
      7. **Error Handling**: Mention common errors and how to handle them
      8. **Best Practices**: Include security considerations and best practices
      9. **Source Citations**: ALWAYS reference sources using the EXACT format shown in the context: [Source X: Title (Category)]. For example, if you see "[Source 1: Stripe Webhooks Documentation (webhooks)]" in the context, use exactly that format in your response.
      10. **If Uncertain**: Clearly state when information isn't available in the context

      FORMAT YOUR RESPONSE:
      - Start with a direct answer to the question
      - Reference previous context when relevant (e.g., "Building on our previous discussion about...")
      - Provide detailed explanation with code examples
      - Include relevant API endpoints and parameters
      - Mention any prerequisites or setup requirements
      - End with a formatted source list using this EXACT format:

      📚 **Sources:**
      🔗 [Title] - URL
      🔗 [Title] - URL
      🔗 [Title] - URL

      IMPORTANT: 
      - Use clean, readable titles (remove markdown formatting, truncate if too long)
      - Include the actual URLs from the source metadata
      - Format sources as clickable links with emojis for visual separation
      - Keep titles concise and descriptive (max 60 characters)
      - Only show the most relevant sources (top 3)

      Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      sources: sources,
    };
  } catch (error) {
    console.error("❌ Memory-aware response generation failed:", error.message);
    // Fallback to regular response generation
    return await generateResponse(query, chunks, geminiClient);
  }
}

// Main chat function
async function startChat() {
  console.log("💳 Stripe Customer Support Agent - Chat Interface");
  console.log("=".repeat(60));
  console.log("🤖 AI Provider: GEMINI");
  console.log("🧠 Memory System: BufferWindowMemory + PostgreSQL");
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

    // Initialize memory system
    const memoryController = new MemoryController();
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await memoryController.initializeSession(sessionId, "chat_user", {
      project: "stripe_support",
      context: "customer_support",
      startTime: new Date().toISOString(),
    });

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question("\n❓ Your question: ", async (query) => {
        if (query.toLowerCase() === "exit") {
          console.log("👋 Goodbye!");

          // Create conversation summary before closing
          try {
            await memoryController.createConversationSummary();
            console.log("📝 Conversation summary created and stored");
          } catch (error) {
            console.error(
              "❌ Failed to create conversation summary:",
              error.message
            );
          }

          // Close memory system
          await memoryController.close();
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
          // Process user message with memory system
          await memoryController.processUserMessage(query, {
            timestamp: new Date().toISOString(),
            source: "chat_interface",
          });

          // Get complete memory context for query reformulation
          const memoryContext = await memoryController.getCompleteMemoryContext(
            query
          );
          console.log(
            `🧠 Memory context: ${
              memoryContext.recentContext?.messageCount || 0
            } recent messages, ${
              memoryContext.longTermContext?.relevantQAs?.length || 0
            } relevant Q&As`
          );

          // Use reformulated query for retrieval
          const searchQuery = memoryContext.reformulatedQuery || query;
          console.log(
            `\n🔍 Searching with reformulated query: "${searchQuery.substring(
              0,
              100
            )}..."`
          );

          // Retrieve relevant chunks using hybrid search with reformulated query
          const chunks = await retrieveChunksWithHybridSearch(
            searchQuery,
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

          // Generate augmented response with memory context
          const result = await generateResponseWithMemory(
            query,
            chunks,
            geminiClient,
            memoryContext
          );

          // Process assistant response with memory system
          await memoryController.processAssistantResponse(result.answer, {
            timestamp: new Date().toISOString(),
            sources: result.sources?.length || 0,
            searchQuery: searchQuery,
          });

          console.log("\n🤖 Assistant:");
          console.log("-".repeat(40));
          console.log(result.answer);
          console.log("-".repeat(40));

          // Show sources only for Stripe-related queries
          const isStripeQuery =
            query.toLowerCase().includes("stripe") ||
            query.toLowerCase().includes("payment") ||
            query.toLowerCase().includes("webhook") ||
            query.toLowerCase().includes("api") ||
            query.toLowerCase().includes("charge") ||
            query.toLowerCase().includes("customer") ||
            query.toLowerCase().includes("subscription") ||
            query.toLowerCase().includes("billing") ||
            query.toLowerCase().includes("invoice") ||
            query.toLowerCase().includes("refund") ||
            query.toLowerCase().includes("dispute") ||
            query.toLowerCase().includes("connect") ||
            query.toLowerCase().includes("radar") ||
            query.toLowerCase().includes("terminal") ||
            query.toLowerCase().includes("checkout") ||
            query.toLowerCase().includes("payment intent") ||
            query.toLowerCase().includes("payment method") ||
            query.toLowerCase().includes("card") ||
            query.toLowerCase().includes("bank") ||
            query.toLowerCase().includes("ach") ||
            query.toLowerCase().includes("payout") ||
            query.toLowerCase().includes("balance") ||
            query.toLowerCase().includes("fee") ||
            query.toLowerCase().includes("tax") ||
            query.toLowerCase().includes("shipping") ||
            query.toLowerCase().includes("address") ||
            query.toLowerCase().includes("verification");

          if (isStripeQuery && result.sources && result.sources.length > 0) {
            console.log("\n📚 Sources:");
            // console.log("\n📚First Source:", result.sources[0]);
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
              let relevanceType = "similarity";
              let relevanceDetails = "";

              if (source.searchType === "hybrid") {
                relevanceType = "hybrid";
                const bm25Score = source.bm25Score || 0;
                const semanticScore = source.semanticScore || 0;
                relevanceDetails = ` (BM25: ${bm25Score.toFixed(
                  3
                )}, Semantic: ${semanticScore.toFixed(3)})`;
              } else if (source.similarity) {
                relevanceType = "semantic";
              } else {
                relevanceType = "keywords matched";
              }

              console.log(
                `   Relevance: ${relevanceScore.toFixed(
                  3
                )} ${relevanceType}${relevanceDetails}`
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
  retrieveChunksWithHybridSearch,
};
