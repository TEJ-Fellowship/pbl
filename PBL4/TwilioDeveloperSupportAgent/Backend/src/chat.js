import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import HybridSearch from "./hybridSearch.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
import MemoryController from "../controllers/memoryController.js";
import MCPIntegrationService from "../services/mcpIntegrationService.js";
import QueryClassifier from "../services/queryClassifier.js";
import config from "../config/config.js";

// Initialize Gemini client
function initGeminiClient() {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(config.GEMINI_API_KEY);
}

// Wrapper to call Gemini with basic retry/backoff and clear rate-limit signaling
async function generateContentWithRetry(
  geminiClient,
  prompt,
  modelName = config.GEMINI_API_MODEL,
  options = {}
) {
  const { maxRetries = 1, initialDelayMs = 1200 } = options;
  const model = geminiClient.getGenerativeModel({ model: modelName });

  let attempt = 0;
  let lastError = null;
  while (attempt <= maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      const message = error?.message || "";
      const isRateLimited =
        error?.status === 429 ||
        /\b429\b/.test(message) ||
        message.includes("Too Many Requests") ||
        message.includes("quota") ||
        message.includes("rate limit");

      if (!isRateLimited) {
        throw error;
      }

      // Try to parse suggested retry delay from error if present
      let retryAfterSeconds = 15;
      const match = message.match(/retry\s*in\s*(\d+(?:\.\d+)?)s/i);
      if (match) {
        retryAfterSeconds = Math.ceil(parseFloat(match[1]));
      }

      if (attempt < maxRetries) {
        const delayMs = Math.max(initialDelayMs, retryAfterSeconds * 1000);
        console.warn(
          `⚠️ Gemini rate-limited. Retrying in ${Math.round(
            delayMs
          )}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        attempt += 1;
        continue;
      }

      const rateLimitError = new Error("Gemini API rate limit exceeded");
      rateLimitError.rateLimit = true;
      rateLimitError.status = 429;
      rateLimitError.retryAfterSeconds = retryAfterSeconds;
      throw rateLimitError;
    }
  }

  throw lastError || new Error("Unknown error generating content");
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
    const index = pinecone.index(config.PINECONE_INDEX_NAME);
    console.log("✅ Vector store loaded from Pinecone");
    return { type: "pinecone", index };
  } catch (error) {
    console.error("❌ Failed to load vector store:", error.message);
    throw error;
  }
}

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve relevant chunks using hybrid search
async function retrieveChunksWithHybridSearch(
  query,
  vectorStore,
  embeddings,
  hybridSearch
) {
  try {
    console.log(
      "\n🔍 Searching for relevant information using hybrid search..."
    );

    // Ensure hybrid search is initialized
    if (!hybridSearch.isInitialized) {
      console.log("🔧 Initializing hybrid search...");
      await hybridSearch.initialize();
    }

    // Perform hybrid search
    const results = await hybridSearch.hybridSearch(
      query,
      parseInt(config.MAX_CHUNKS) || 10
    );

    if (!results || results.length === 0) {
      console.log(
        "❌ No results from hybrid search, falling back to semantic search"
      );
      return retrieveChunksWithEmbeddings(query, vectorStore, embeddings);
    }

    // Format results for consistency
    const topChunks = results.map((result) => ({
      content: result.content,
      metadata: result.metadata,
      similarity: result.finalScore || result.score || 0,
      score: result.finalScore || result.score || 0,
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

// Calculate confidence score from search results (new)
function calculateConfidence(chunks) {
  if (chunks.length === 0) return 0;

  // Calculate average similarity score
  const avgScore =
    chunks.reduce((sum, chunk) => sum + (chunk.similarity || 0), 0) /
    chunks.length;

  // Normalize to 0-1 range
  return Math.min(1, Math.max(0, avgScore));
}

// Generate response using Gemini with MCP integration
async function generateResponseWithMCP(
  query,
  chunks,
  geminiClient,
  mcpService,
  confidence,
  precomputedMcpEnhancement = null,
  precomputedMcpToolsUsed = null,
  precomputedMcpConfidence = null
) {
  try {
    console.log("\n🤖 Generating response with MCP integration...");

    // Process query with MCP tools (use pre-computed results if available)
    let mcpResult = null;
    let mcpToolsUsed = [];
    let mcpConfidence = 0;

    if (precomputedMcpEnhancement !== null) {
      // Use pre-computed MCP results
      mcpResult = {
        success: true,
        enhancedResponse: precomputedMcpEnhancement,
        toolsUsed: precomputedMcpToolsUsed || [],
        confidence: precomputedMcpConfidence || 0,
      };
      mcpToolsUsed = precomputedMcpToolsUsed || [];
      mcpConfidence = precomputedMcpConfidence || 0;
      console.log("🔧 Using pre-computed MCP results...");
      console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
      console.log(`📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`);
    } else {
      // Process MCP tools if not pre-computed
      try {
        console.log("🔧 Processing with MCP tools...");
        mcpResult = await mcpService.processQueryWithMCP(query, confidence);

        if (mcpResult.success && mcpResult.enhancedResponse) {
          mcpToolsUsed = mcpResult.toolsUsed || [];
          mcpConfidence = mcpResult.confidence || 0;

          console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
          console.log(
            `📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`
          );
        } else {
          console.log("ℹ️ No MCP tools needed for this query");
        }
      } catch (error) {
        console.warn("⚠️ MCP processing failed:", error.message);
        console.log("   Continuing with standard response generation...");
      }
    }

    // Use a richer prompt if web_search was used
    const usedWebSearch = (mcpToolsUsed || []).includes("web_search");
    let prompt = usedWebSearch
      ? `You are an up-to-date assistant. Summarize the latest information from the web search results below.

        USER QUESTION:
        ${query}

        WEB SEARCH RESULTS (verbatim):
        ${
          mcpResult && mcpResult.enhancedResponse
            ? mcpResult.enhancedResponse
            : "No specific information available."
        }

        INSTRUCTIONS:
        - Produce a concise multi-bullet summary of the most important updates (3-6 bullets).
        - Each bullet should be a full sentence with concrete facts. Avoid fluff.
        - Add a short "Sources" section at the end listing 3-5 links as markdown list items. Use the actual URLs shown; keep titles short.
        - Prefer reputable/official domains where available. Do not invent links.
        - If results look noisy or off-topic, say so briefly and suggest a clearer query.
        `
      : `You are a helpful assistant. Answer the user's question based on the provided information.

        USER QUESTION: ${query}

        INFORMATION:
        ${
          mcpResult && mcpResult.enhancedResponse
            ? mcpResult.enhancedResponse
            : "No specific information available."
        }

        Please provide a simple, direct answer to the user's question.`;

    const model = geminiClient.getGenerativeModel({
      model: config.GEMINI_API_MODEL,
    });
    const text = await generateContentWithRetry(
      geminiClient,
      prompt,
      "gemini-2.0-flash",
      { maxRetries: 1 }
    );

    // For MCP-only responses, create sources from MCP tools used
    console.log("🔍 generateResponseWithMCP - mcpToolsUsed:", mcpToolsUsed);
    console.log("🔍 generateResponseWithMCP - mcpConfidence:", mcpConfidence);

    const sources = mcpToolsUsed.map((tool, index) => ({
      content: `MCP Tool: ${tool}`,
      metadata: {
        title: `MCP Tool: ${tool}`,
        category: "mcp_tool",
        source: "MCP Integration Service",
      },
      similarity: mcpConfidence || 0.9,
      score: mcpConfidence || 0.9,
      index: index + 1,
    }));

    console.log("🔍 generateResponseWithMCP - sources created:", sources);

    return {
      answer: text,
      sources: sources,
      mcpEnhancement: mcpResult?.enhancedResponse || "",
      mcpToolsUsed: mcpToolsUsed,
      mcpConfidence: mcpConfidence,
      overallConfidence: mcpConfidence,
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error.message);
    throw error;
  }
}

// Generate simple conversational response from memory only (single Gemini call)
async function generateConversationalResponse(
  query,
  memoryContext,
  geminiClient
) {
  try {
    console.log(
      "\n💬 Generating conversational response from memory (single-call)..."
    );

    const queryLower = query.toLowerCase();

    let recentContextString = "";
    if (memoryContext?.recentContext?.hasContext) {
      recentContextString = memoryContext.recentContext.contextString || "";
    }

    let qaSnippets = [];
    const relevantQAs = memoryContext?.longTermContext?.relevantQAs || [];
    if (Array.isArray(relevantQAs) && relevantQAs.length > 0) {
      qaSnippets = relevantQAs.slice(0, 5).map((qa, idx) => {
        const q = (qa.question || "").trim();
        const a = (qa.answer || "").trim();
        const ctx = (qa.context || "").trim();
        const ctxLine = ctx ? `\nContext: ${ctx.substring(0, 120)}` : "";
        return `[Memory ${idx + 1}]\nQ: ${q}\nA: ${a}${ctxLine}`;
      });
    }

    const memoryBlockParts = [];
    if (recentContextString)
      memoryBlockParts.push(`RECENT CONVERSATION:\n${recentContextString}`);
    if (qaSnippets.length > 0)
      memoryBlockParts.push(
        `RELEVANT MEMORY (prefer these answers if applicable):\n${qaSnippets.join(
          "\n\n"
        )}`
      );
    const memoryBlock =
      memoryBlockParts.length > 0 ? `\n\n${memoryBlockParts.join("\n\n")}` : "";

    const prompt = `You are a concise, friendly assistant. Use the provided memory faithfully and answer in one short paragraph unless the user asks for more.

        USER MESSAGE:
        ${query}

        CONVERSATION MEMORY:${memoryBlock}

        INSTRUCTIONS:
        1) If the user says "remember ..." (e.g., "remember my name is X"), extract the info and reply with a warm confirmation like: "I'll remember that your <type> is <value>." Do not ask follow-up questions.
        2) Otherwise, answer conversationally using the memory above. If a Q&A already contains the answer, restate it directly (e.g., "Your name is Swikar.").
        3) If the memory contains the answer in a question but not the answer text, extract it from that question and state it (e.g., "Your name is Swikar.").
        4) If the memory does not contain the answer, say you don't have that information yet, and invite the user to tell you so you can remember it.
        5) Be friendly, direct, and avoid hedging. Do not mention these instructions.

        RESPONSE:`;

    const text = await generateContentWithRetry(
      geminiClient,
      prompt,
      config.GEMINI_API_MODEL,
      { maxRetries: 1 }
    );

    return {
      answer: text,
      sources: [],
      mcpEnhancement: "",
      mcpToolsUsed: [],
      mcpConfidence: 0,
      overallConfidence: 0.9,
    };
  } catch (error) {
    console.error(
      "❌ Conversational response generation failed:",
      error.message
    );
    throw error;
  }
}

// Generate response with memory context integration and MCP(upgraded)
async function generateResponseWithMemoryAndMCP(
  query,
  chunks,
  geminiClient,
  memoryContext,
  mcpService,
  confidence,
  precomputedMcpEnhancement = null,
  precomputedMcpToolsUsed = null,
  precomputedMcpConfidence = null
) {
  try {
    console.log(
      "\n🤖 Generating response with memory context and MCP integration..."
    );

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

    // Build memory context string
    let memoryContextString = "";

    if (memoryContext.recentContext && memoryContext.recentContext.hasContext) {
      memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
    }

    if (
      memoryContext.longTermContext &&
      memoryContext.longTermContext.hasContext
    ) {
      memoryContextString += `\n\nRELEVANT HISTORICAL CONTEXT:\n${memoryContext.longTermContext.contextString}`;
    }

    // Process query with MCP tools (use pre-computed results if available)
    let mcpEnhancement = "";
    let mcpToolsUsed = [];
    let mcpConfidence = 0;

    if (precomputedMcpEnhancement !== null) {
      // Use pre-computed MCP results
      mcpEnhancement = precomputedMcpEnhancement;
      mcpToolsUsed = precomputedMcpToolsUsed || [];
      mcpConfidence = precomputedMcpConfidence || 0;
      console.log("🔧 Using pre-computed MCP results...");
      console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
      console.log(`📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`);
    } else {
      // Process MCP tools if not pre-computed
      try {
        console.log("🔧 Processing with MCP tools...");
        const mcpResult = await mcpService.processQueryWithMCP(
          query,
          confidence
        );

        if (mcpResult.success && mcpResult.enhancedResponse) {
          mcpEnhancement = mcpResult.enhancedResponse;
          mcpToolsUsed = mcpResult.toolsUsed || [];
          mcpConfidence = mcpResult.confidence || 0;

          console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
          console.log(
            `📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`
          );
        } else {
          console.log("ℹ️ No MCP tools needed for this query");
        }
      } catch (error) {
        console.warn("⚠️ MCP processing failed:", error.message);
        console.log("   Continuing with standard response generation...");
      }
    }

    // Build enhanced prompt with memory and MCP integration
    const isTwilio =
      /twilio|sms|voice|programmable|messaging|api|webhook|phone\s?number|verify|authy|studio|flex|conversation|video|fax|lookup|taskrouter|autopilot|segment|sync|chat|call|mms/i.test(
        query
      );

    let prompt = isTwilio
      ? `You are an expert Twilio developer support assistant with deep knowledge of Twilio's APIs, messaging, voice, authentication, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Twilio.

        CONTEXT (Twilio Documentation):
        ${context}${memoryContextString}

        USER QUESTION: ${query}

      RESPONSE GUIDELINES:
      1. **Accuracy First**: Base your answer strictly on the provided Twilio documentation context
      2. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
      3. **Include Code**: Always include practical code examples in the appropriate programming language
      4. **Step-by-Step**: Break down complex processes into clear, actionable steps
      5. **Error Handling**: Mention common errors and how to handle them
      6. **Best Practices**: Include security considerations and best practices
      7. **Source Citations**: Reference specific sources using [Source X] format
      8. **Memory Integration**: Use conversation context to provide personalized responses
      9. **If Uncertain**: Clearly state when information isn't available in the context

      FORMAT YOUR RESPONSE:
      - Start with a direct answer to the question
      - Provide detailed explanation with code examples
      - Include relevant API endpoints and parameters
      - Mention any prerequisites or setup requirements
      - End with source citations`
            : `You are a helpful, up-to-date assistant. Answer the user's question directly and concisely using the information provided below. If Twilio documentation context is included but irrelevant to the user's question, ignore it.

      USER QUESTION: ${query}
      ${memoryContextString}

      INFORMATION:
      ${context}

      GUIDELINES:
      - Be factual and current. If MCP tools include web search results, prioritize them.
      - Keep the answer focused on the user's question; avoid Twilio-specific framing unless the question is about Twilio.
      - If information is insufficient, say what is missing and suggest a follow-up.
      - Provide links or brief references when available in the provided information.`;

    if (mcpEnhancement) {
      prompt += `\n\nADDITIONAL INTELLIGENCE (MCP Tools):
    ${mcpEnhancement}

    INTEGRATION NOTES:
    - Use the MCP tool results to enhance your response
    - If MCP tools provided calculations, status checks, or validations, incorporate them
    - Maintain the same response format while integrating MCP insights
    - If MCP tools found conflicting information, prioritize the documentation context`;
    }

    const text = await generateContentWithRetry(
      geminiClient,
      prompt,
      config.GEMINI_API_MODEL,
      { maxRetries: 1 }
    );

    return {
      answer: text,
      sources: sources,
      mcpEnhancement: mcpEnhancement,
      mcpToolsUsed: mcpToolsUsed,
      mcpConfidence: mcpConfidence,
      overallConfidence: Math.max(confidence, mcpConfidence),
    };
  } catch (error) {
    console.error("❌ Response generation failed:", error.message);
    throw error;
  }
}

// // Generate response using Gemini
// async function generateResponse(query, chunks, geminiClient) {
//   try {
//     console.log("🤖 Generating response...");

//     // Limit sources to most relevant ones (configurable)
//     const maxSources = parseInt(config.MAX_SOURCES) || 3;
//     const limitedChunks = chunks.slice(0, maxSources);

//     // Prepare context from limited chunks with meaningful source titles
//     const context = limitedChunks
//       .map((chunk, index) => {
//         const title =
//           chunk.metadata?.title ||
//           chunk.metadata?.doc_title ||
//           `Document ${index + 1}`;
//         const category = chunk.metadata?.category || "documentation";
//         return `[Source ${index + 1}: ${title} (${category})]\n${
//           chunk.content
//         }`;
//       })
//       .join("\n\n");

//     const sources = limitedChunks.map((chunk, index) => {
//       // Generate clean, ChatGPT-style titles
//       let title = chunk.metadata?.title || chunk.metadata?.doc_title;

//       // If no title, generate one from content
//       if (!title || title.trim() === "") {
//         const contentLines = chunk.content
//           .split("\n")
//           .filter((line) => line.trim() !== "");
//         const firstLine = contentLines[0] || "";
//         title =
//           firstLine.length > 60
//             ? firstLine.substring(0, 60) + "..."
//             : firstLine;
//         if (!title) title = "Twilio Documentation";
//       }

//       // Clean up title formatting
//       title = title
//         .replace(/^#+\s*/, "")
//         .replace(/\n.*$/, "")
//         .trim();

//       const category = chunk.metadata?.category || "documentation";
//       const url =
//         chunk.metadata?.source ||
//         chunk.metadata?.source_url ||
//         "https://twilio.com/docs";

//       return {
//         content: chunk.content,
//         metadata: chunk.metadata,
//         title: title,
//         category: category,
//         url: url,
//         similarity: chunk.similarity,
//         score: chunk.score || 0,
//         index: index + 1,
//       };
//     });

//     // Generate response using Gemini
//     const prompt = `You are an expert Twilio Developer Support assistant. You help with Twilio SMS, Voice, Video, WhatsApp, webhooks, error codes, and SDKs. Provide accurate, actionable, and safe guidance.

// CONTEXT (Twilio Documentation):
// ${context}

// USER QUESTION: ${query}

// RESPONSE GUIDELINES:
// 1. Accuracy First: Base your answer STRICTLY on the provided Twilio context when possible.
// 2. Be Specific: Include exact API names, parameters, and example code.
// 3. Include Code: Provide practical examples for the detected language when applicable.
// 4. Step-by-Step: Break down with clear steps.
// 5. Error Handling: Mention common errors and fixes.
// 6. Best Practices: Security, webhooks validation, environment variables.
// 7. Source Citations: Reference with [Source X].
// 8. If Uncertain: State what's missing and suggest next steps.

// FORMAT YOUR RESPONSE:
// - Start with a direct answer to the question
// - Provide detailed explanation with code examples
// - Include relevant API endpoints and parameters
// - Mention any prerequisites or setup requirements
// - End with a formatted source list using this EXACT format:

// 📚 **Sources:**
// 🔗 [Title] - URL
// 🔗 [Title] - URL
// 🔗 [Title] - URL

// IMPORTANT: 
// - Use clean, readable titles (remove markdown formatting, truncate if too long)
// - Include the actual URLs from the source metadata
// - Format sources as clickable links with emojis for visual separation
// - Keep titles concise and descriptive (max 60 characters)
// - Only show the most relevant sources (top 3)`;

//     const model = geminiClient.getGenerativeModel({
//       model: "gemini-2.0-flash",
//     });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     return {
//       answer: text,
//       sources: sources,
//     };
//   } catch (error) {
//     console.error("❌ Response generation failed:", error.message);
//     throw error;
//   }
// }

// // Generate response with memory context integration
// async function generateResponseWithMemory(
//   query,
//   chunks,
//   geminiClient,
//   memoryContext
// ) {
//   try {
//     console.log("\n🤖 Generating response with memory context...");

//     // Limit sources to most relevant ones (configurable)
//     const maxSources = parseInt(config.MAX_SOURCES) || 3;
//     const limitedChunks = chunks.slice(0, maxSources);

//     // Prepare context from limited chunks with meaningful source titles
//     const context = limitedChunks
//       .map((chunk, index) => {
//         const title =
//           chunk.metadata?.title ||
//           chunk.metadata?.doc_title ||
//           `Document ${index + 1}`;
//         const category = chunk.metadata?.category || "documentation";
//         return `[Source ${index + 1}: ${title} (${category})]\n${
//           chunk.content
//         }`;
//       })
//       .join("\n\n");

//     const sources = limitedChunks.map((chunk, index) => {
//       // Generate clean, ChatGPT-style titles
//       let title = chunk.metadata?.title || chunk.metadata?.doc_title;

//       // If no title, generate one from content
//       if (!title || title.trim() === "") {
//         const contentLines = chunk.content
//           .split("\n")
//           .filter((line) => line.trim() !== "");
//         const firstLine = contentLines[0] || "";
//         title =
//           firstLine.length > 60
//             ? firstLine.substring(0, 60) + "..."
//             : firstLine;
//         if (!title) title = "Twilio Documentation";
//       }

//       // Clean up title formatting
//       title = title
//         .replace(/^#+\s*/, "")
//         .replace(/\n.*$/, "")
//         .trim();

//       const category = chunk.metadata?.category || "documentation";
//       const url =
//         chunk.metadata?.source ||
//         chunk.metadata?.source_url ||
//         "https://twilio.com/docs";

//       return {
//         content: chunk.content,
//         metadata: chunk.metadata,
//         title: title,
//         category: category,
//         url: url,
//         similarity: chunk.similarity,
//         score: chunk.score || 0,
//         index: index + 1,
//       };
//     });

//     // Build memory context string
//     let memoryContextString = "";

//     if (memoryContext.recentContext && memoryContext.recentContext.hasContext) {
//       memoryContextString += `\n\nRECENT CONVERSATION CONTEXT:\n${memoryContext.recentContext.contextString}`;
//     }

//     if (
//       memoryContext.longTermContext &&
//       memoryContext.longTermContext.hasLongTermContext
//     ) {
//       const relevantQAs = memoryContext.longTermContext.relevantQAs;
//       if (relevantQAs && relevantQAs.length > 0) {
//         memoryContextString += `\n\nRELEVANT PREVIOUS DISCUSSIONS:\n`;
//         relevantQAs.forEach((qa, index) => {
//           memoryContextString += `[Previous Q&A ${index + 1}] Q: ${
//             qa.question
//           }\nA: ${qa.answer.substring(0, 200)}...\n\n`;
//         });
//       }
//     }

//     // Generate response using Gemini with memory context
//     const prompt = `You are an expert Twilio Developer Support assistant. You help with Twilio SMS, Voice, Video, WhatsApp, webhooks, error codes, and SDKs. Provide accurate, actionable, and safe guidance.

// CONTEXT (Twilio Documentation):
// ${context}

// USER QUESTION: ${query}
// ${memoryContextString}

// RESPONSE GUIDELINES:
// 1. Accuracy First: Base your answer STRICTLY on the provided Twilio context when possible.
// 2. Be Specific: Include exact API names, parameters, and example code.
// 3. Include Code: Provide practical examples for the detected language when applicable.
// 4. Step-by-Step: Break down with clear steps.
// 5. Error Handling: Mention common errors and fixes.
// 6. Best Practices: Security, webhooks validation, environment variables.
// 7. Source Citations: Reference with [Source X].
// 8. If Uncertain: State what's missing and suggest next steps.

// FORMAT YOUR RESPONSE:
// - Start with a direct answer to the question
// - Provide detailed explanation with code examples
// - Include relevant API endpoints and parameters
// - Mention any prerequisites or setup requirements
// - End with a formatted source list using this EXACT format:

// 📚 **Sources:**
// 🔗 [Title] - URL
// 🔗 [Title] - URL
// 🔗 [Title] - URL

// IMPORTANT: 
// - Use clean, readable titles (remove markdown formatting, truncate if too long)
// - Include the actual URLs from the source metadata
// - Format sources as clickable links with emojis for visual separation
// - Keep titles concise and descriptive (max 60 characters)
// - Only show the most relevant sources (top 3)`;

//     const model = geminiClient.getGenerativeModel({
//       model: "gemini-2.0-flash",
//     });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     return {
//       answer: text,
//       sources: sources,
//     };
//   } catch (error) {
//     console.error("❌ Memory-aware response generation failed:", error.message);
//     // Fallback to regular response generation
//     return await generateResponse(query, chunks, geminiClient);
//   }
// }

// // Main chat function
// async function startChat() {
//   console.log("📞 Twilio Developer Support Agent - Chat Interface");
//   console.log("=".repeat(60));
//   console.log("🤖 AI Provider: GEMINI");
//   console.log("🧠 Memory System: BufferWindowMemory + PostgreSQL");
//   console.log("💡 Type 'exit' to quit, 'sample' for more questions");
//   console.log("=".repeat(60));
//   console.log("\n🚀 Sample Questions to Get Started:");
//   console.log("  • How do I send an SMS with Twilio in Node.js?");
//   console.log("  • How do I validate Twilio webhook signatures?");
//   console.log("  • What does error code 20003 mean and how to fix it?");
//   console.log("  • How do I create a programmable voice call?");
//   console.log("=".repeat(60));

//   try {
//     // Initialize components
//     const geminiClient = initGeminiClient();
//     const embeddings = initGeminiEmbeddings();
//     const vectorStore = await loadVectorStore();

//     // Initialize memory system
//     const memoryController = new MemoryController();
//     const sessionId = `session_${Date.now()}_${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//     await memoryController.initializeSession(sessionId, "chat_user", {
//       project: "stripe_support",
//       context: "customer_support",
//       startTime: new Date().toISOString(),
//     });

//     // Create readline interface
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });

//     const askQuestion = () => {
//       rl.question("\n❓ Your question: ", async (query) => {
//         if (query.toLowerCase() === "exit") {
//           console.log("👋 Goodbye!");

//           // Create conversation summary before closing
//           try {
//             await memoryController.createConversationSummary();
//             console.log("📝 Conversation summary created and stored");
//           } catch (error) {
//             console.error(
//               "❌ Failed to create conversation summary:",
//               error.message
//             );
//           }

//           // Close memory system
//           await memoryController.close();
//           rl.close();
//           return;
//         }

//         if (query.toLowerCase() === "sample") {
//           console.log("\n💡 Example Questions by Category:");
//           console.log("\n🔧 API Integration:");
//           console.log("  • Send SMS in Node.js / Python / PHP");
//           console.log("  • Differences between test and live mode");
//           console.log("\n🔐 Security & Webhooks:");
//           console.log("  • Validate webhook signatures");
//           console.log("  • Best practices for storing Twilio credentials");
//           console.log("\n📞 Voice & Messaging:");
//           console.log("  • Create voice calls with Twilio");
//           console.log("  • Handle incoming SMS and replies");
//           console.log("\n🛠️ Errors & Debugging:");
//           console.log("  • Error 20003 authentication error fix");
//           console.log("  • 21211 invalid 'To' number");
//           askQuestion();
//           return;
//         }

//         if (query.trim() === "") {
//           console.log("❌ Please enter a question.");
//           askQuestion();
//           return;
//         }
//         try {
//           // Process user message with memory system
//           await memoryController.processUserMessage(query, {
//             timestamp: new Date().toISOString(),
//             source: "chat_interface",
//           });

//           // Get complete memory context for query reformulation
//           const memoryContext = await memoryController.getCompleteMemoryContext(
//             query
//           );
//           console.log(
//             `🧠 Memory context: ${
//               memoryContext.recentContext?.messageCount || 0
//             } recent messages, ${
//               memoryContext.longTermContext?.relevantQAs?.length || 0
//             } relevant Q&As`
//           );

//           // Use reformulated query for retrieval
//           const searchQuery = memoryContext.reformulatedQuery || query;
//           console.log(
//             `\n🔍 Searching with reformulated query: "${searchQuery.substring(
//               0,
//               100
//             )}..."`
//           );

//           // Retrieve relevant chunks using hybrid search with reformulated query
//           const chunks = await retrieveChunksWithHybridSearch(
//             searchQuery,
//             vectorStore,
//             embeddings
//           );

//           if (chunks.length === 0) {
//             console.log(
//               "❌ No relevant information found. Try rephrasing your question."
//             );
//             askQuestion();
//             return;
//           }

//           // Generate augmented response with memory context
//           const result = await generateResponseWithMemory(
//             query,
//             chunks,
//             geminiClient,
//             memoryContext
//           );

//           // Process assistant response with memory system
//           await memoryController.processAssistantResponse(result.answer, {
//             timestamp: new Date().toISOString(),
//             sources: result.sources?.length || 0,
//             searchQuery: searchQuery,
//           });

//           console.log("\n🤖 Assistant:");
//           console.log("-".repeat(40));
//           console.log(result.answer);
//           console.log("-".repeat(40));

//           // Show sources only for Stripe-related queries
//           const isTwilioQuery =
//             query.toLowerCase().includes("twilio") ||
//             query.toLowerCase().includes("sms") ||
//             query.toLowerCase().includes("mms") ||
//             query.toLowerCase().includes("voice") ||
//             query.toLowerCase().includes("phone number") ||
//             query.toLowerCase().includes("messaging") ||
//             query.toLowerCase().includes("api") ||
//             query.toLowerCase().includes("webhook") ||
//             query.toLowerCase().includes("sid") ||
//             query.toLowerCase().includes("verify") ||
//             query.toLowerCase().includes("authy") ||
//             query.toLowerCase().includes("conversation") ||
//             query.toLowerCase().includes("segment") ||
//             query.toLowerCase().includes("flex") ||
//             query.toLowerCase().includes("call") ||
//             query.toLowerCase().includes("programmable") ||
//             query.toLowerCase().includes("a2p") ||
//             query.toLowerCase().includes("10dlc") ||
//             query.toLowerCase().includes("short code") ||
//             query.toLowerCase().includes("toll-free") ||
//             query.toLowerCase().includes("lookup") ||
//             query.toLowerCase().includes("status callback") ||
//             query.toLowerCase().includes("media url") ||
//             query.toLowerCase().includes("delivery receipt") ||
//             query.toLowerCase().includes("rate limit") ||
//             query.toLowerCase().includes("error code") ||
//             query.toLowerCase().includes("console") ||
//             query.toLowerCase().includes("subaccount") ||
//             query.toLowerCase().includes("account sid") ||
//             query.toLowerCase().includes("auth token");

//           if (isTwilioQuery && result.sources && result.sources.length > 0) {
//             console.log("\n📚 Sources:");
//             // console.log("\n📚First Source:", result.sources[0]);
//             result.sources.forEach((source) => {
//               // Generate a better title from content if metadata title is empty
//               let title = source.metadata.title || source.metadata.doc_title;
//               if (!title || title.trim() === "") {
//                 // Extract first meaningful line from content as title
//                 const contentLines = source.content
//                   .split("\n")
//                   .filter((line) => line.trim() !== "");
//                 const firstLine = contentLines[0] || "";
//                 title =
//                   firstLine.length > 60
//                     ? firstLine.substring(0, 60) + "..."
//                     : firstLine;
//                 if (!title) title = "Twilio Documentation";
//               }

//               const category = source.metadata.category || "documentation";
//               const url =
//                 source.metadata.source ||
//                 source.metadata.source_url ||
//                 "https://twilio.com/docs";

//               console.log(`${source.index}. ${title} (${category})`);
//               console.log(`   URL: ${url}`);
//               const relevanceScore = source.similarity || source.score || 0;
//               let relevanceType = "similarity";
//               let relevanceDetails = "";

//               if (source.searchType === "hybrid") {
//                 relevanceType = "hybrid";
//                 const bm25Score = source.bm25Score || 0;
//                 const semanticScore = source.semanticScore || 0;
//                 relevanceDetails = ` (BM25: ${bm25Score.toFixed(
//                   3
//                 )}, Semantic: ${semanticScore.toFixed(3)})`;
//               } else if (source.similarity) {
//                 relevanceType = "semantic";
//               } else {
//                 relevanceType = "keywords matched";
//               }

//               console.log(
//                 `   Relevance: ${relevanceScore.toFixed(
//                   3
//                 )} ${relevanceType}${relevanceDetails}`
//               );
//             });
//           }
//         } catch (error) {
//           console.error("❌ Error processing question:", error.message);
//         }

//         askQuestion();
//       });
//     };

//     askQuestion();
//   } catch (error) {
//     console.error("❌ Chat initialization failed:", error.message);
//     process.exit(1);
//   }
// }

// // Handle CLI execution
// if (process.argv[1] && process.argv[1].endsWith("chat.js")) {
//   startChat().catch(console.error);
// }

// export {
//   generateResponse,
//   loadVectorStore,
//   initGeminiClient,
//   initGeminiEmbeddings,
//   retrieveChunksWithHybridSearch,
// };


async function startIntegratedChat() {
  try {
    console.log("🚀 Starting Integrated Twilio Developer Support Chat with MCP Tools");
    console.log("=".repeat(60));

    // Initialize services
    console.log("🔧 Initializing services...");
    const geminiClient = initGeminiClient();
    const embeddings = initGeminiEmbeddings();
    const vectorStore = await loadVectorStore();
    const memoryController = new MemoryController();
    const mcpService = new MCPIntegrationService();
    const queryClassifier = new QueryClassifier(mcpService.orchestrator);

    // Initialize PostgreSQL BM25 service for hybrid search
    const postgresBM25Service = new PostgreSQLBM25Service();
    const hybridSearch = new HybridSearch(vectorStore, embeddings, postgresBM25Service);

    // Initialize memory session
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await memoryController.initializeSession(sessionId, "integrated_chat_user", {
      project: "twilio_support",
      context: "developer_support_with_mcp",
      startTime: new Date().toISOString(),
    });

    // Wait for MCP service to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initialize hybrid search
    console.log("🔧 Initializing hybrid search...");
    await hybridSearch.initialize();

    console.log("✅ All services initialized successfully");

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      console.log(
        "\nType 'exit' to quit, 'mcp' to check MCP system status, 'classifier' to check query classifier status, 'sample' for more questions"
      );
      console.log("=".repeat(60));
      rl.question("\n❓ Your question: ", async (query) => {
        if (query.toLowerCase() === "exit") {
          console.log("👋 Goodbye!");
          try {
            await memoryController.createConversationSummary();
            console.log("📝 Conversation summary created and stored");
          } catch (error) {
            console.error("❌ Failed to create conversation summary:", error.message);
          }
          await memoryController.close();
          rl.close();
          return;
        }

        if (query.toLowerCase() === "mcp") {
          console.log("\n🔧 MCP System Status:");
          try {
            const mcpStatus = mcpService.getToolManagementInfo();
            const integrationStatus = mcpStatus.integrationEnabled
              ? "✅ Enabled"
              : "❌ Disabled";
            console.log(`   Integration: ${integrationStatus}`);
            console.log(
              `   Tools Available: ${
                mcpStatus.availableTools?.length || mcpStatus.status?.total || 0
              }`
            );
            console.log(`   Tools Enabled: ${mcpStatus.status?.enabled || 0}`);
            console.log(`   Tools Disabled: ${mcpStatus.status?.disabled || 0}`);

            if (mcpStatus.status?.details) {
              console.log("\n🛠️ Tool Details:");
              Object.entries(mcpStatus.status.details).forEach(([toolName, details]) => {
                const status = details.enabled ? "✅" : "❌";
                console.log(`   ${status} ${toolName}: ${details.description}`);
              });
            } else {
              console.log("\n🛠️ Tool Details: Not available");
            }

            if (mcpStatus.orchestratorTools && Object.keys(mcpStatus.orchestratorTools).length > 0) {
              console.log("\n🔧 Orchestrator Tools:");
              Object.entries(mcpStatus.orchestratorTools).forEach(([toolName, toolInfo]) => {
                console.log(`   ✅ ${toolName}: ${toolInfo.description || toolInfo.name}`);
              });
            }

            if (mcpStatus.aiSelection && mcpStatus.aiSelection.available) {
              console.log("\n🤖 AI Selection:");
              console.log(
                `   Status: ${mcpStatus.aiSelection.available ? "✅ Available" : "❌ Unavailable"}`
              );
              console.log(`   AI Decisions: ${mcpStatus.aiSelection.aiDecisions || 0}`);
              console.log(
                `   Fallback Decisions: ${mcpStatus.aiSelection.fallbackDecisions || 0}`
              );
            } else {
              console.log("\n🤖 AI Selection: Not available");
            }
          } catch (error) {
            console.log("   ❌ Error getting MCP status:", error.message);
            console.log("   ℹ️ MCP system may not be fully initialized");
          }

          askQuestion();
          return;
        }

        if (query.toLowerCase() === "classifier") {
          console.log("\n🤖 Query Classifier Status:");
          try {
            const classifierStats = queryClassifier.getStats();
            console.log(
              `   Gemini AI: ${
                classifierStats.geminiAvailable ? "✅ Available" : "❌ Unavailable"
              }`
            );
            console.log(`   Model: ${classifierStats.model}`);

            console.log("\n📊 Classification Approaches:");
            console.log(
              "   • MCP_TOOLS_ONLY - Direct tool responses (Twilio status, SMS sending, pricing checks)"
            );
            console.log(
              "   • HYBRID_SEARCH - Documentation-based responses (API guides, SDK tutorials)"
            );
            console.log(
              "   • COMBINED - Both tools and documentation (complex queries like debugging)"
            );
          } catch (error) {
            console.log("   ❌ Error getting classifier status:", error.message);
          }

          askQuestion();
          return;
        }

        if (query.toLowerCase() === "sample") {
          console.log("\n💡 Example Questions by Classification:");

          console.log("\n🔧 MCP_TOOLS_ONLY Examples:");
          console.log("  • Is Twilio down right now?");
          console.log("  • What is the current Twilio SMS pricing for the US?");
          console.log("  • Convert 500 INR to USD using the Currency Tool");
          console.log("  • Check webhook status for Twilio API");
          console.log("  • Get Twilio phone number capabilities");

          console.log("\n📚 HYBRID_SEARCH Examples:");
          console.log("  • How do I send an SMS using Twilio's API?");
          console.log("  • How to handle Twilio webhook signatures?");
          console.log("  • How do I initiate a voice call with Twilio?");
          console.log("  • How to verify WhatsApp senders in Twilio?");
          console.log("  • How do I use Twilio Conversations API?");

          console.log("\n🔧📚 COMBINED Examples:");
          console.log("  • Check Twilio API status and show code to send SMS");
          console.log("  • Get current status and guide for Twilio Voice API setup");
          console.log("  • Show me pricing and how to configure Twilio Studio flow");
          console.log("  • Verify WhatsApp API and display webhook setup steps");

          console.log("\n💡 Commands:");
          console.log("  • Type 'mcp' to check MCP system status");
          console.log("  • Type 'classifier' to check query classifier status");
          console.log("  • Type 'exit' to quit");

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
            source: "integrated_chat_interface",
          });

          // Step 1: Classify query
          const enabledTools = mcpService.getEnabledTools();
          const classification = await queryClassifier.classifyQuery(
            query,
            0.5,
            enabledTools
          );
          console.log(
            `📊 Classification: ${classification.approach} - ${classification.reasoning}`
          );

          let result;
          let chunks = [];
          let searchQuery = query;

          // Determine if it's Twilio-related
          const isTwilio = /twilio|sms|voice|whatsapp|video|api|webhook|studio/i.test(
            query
          );
          if (!isTwilio && classification.approach !== "MCP_TOOLS_ONLY") {
            classification.approach = "MCP_TOOLS_ONLY";
            classification.reasoning +=
              " | Forced MCP_TOOLS_ONLY for non-Twilio query";
          }

          // === Handle approaches ===

          if (classification.approach === "CONVERSATIONAL") {
            console.log("\n💬 Using CONVERSATIONAL approach - memory-only response");
            const [recentContext, longTermContext, sessionContext] = await Promise.all([
              Promise.resolve(memoryController.getRecentContext()),
              memoryController.getLongTermContext(query, Boolean(classification.isConversationQuery)),
              memoryController.getSessionContext(),
            ]);

            const memoryContext = { recentContext, longTermContext, sessionContext };
            result = await generateConversationalResponse(query, memoryContext, geminiClient);

          } else if (classification.approach === "MCP_TOOLS_ONLY") {
            console.log("\n🔧 Using MCP tools only approach");
            const mcpResult = await mcpService.processQueryWithMCP(query, 0.5);

            if (mcpResult.success && mcpResult.enhancedResponse) {
              result = await generateResponseWithMCP(
                query,
                [],
                geminiClient,
                mcpService,
                0.8,
                mcpResult.enhancedResponse,
                mcpResult.toolsUsed || [],
                mcpResult.confidence || 0
              );
            } else {
              console.log("⚠️ MCP tools failed, falling back to hybrid search");
              const memoryContext = await memoryController.getCompleteMemoryContext(query);
              searchQuery = memoryContext.reformulatedQuery || query;

              chunks = await retrieveChunksWithHybridSearch(searchQuery, vectorStore, embeddings, hybridSearch);
              if (chunks.length === 0) {
                console.log("❌ No relevant information found. Try rephrasing your question.");
                askQuestion();
                return;
              }

              const confidence = calculateConfidence(chunks);
              result = await generateResponseWithMemoryAndMCP(
                query,
                chunks,
                geminiClient,
                memoryContext,
                mcpService,
                confidence
              );
            }

          } else if (classification.approach === "HYBRID_SEARCH") {
            console.log("🔍 Using hybrid search approach");
            const memoryContext = await memoryController.getCompleteMemoryContext(query);
            searchQuery = memoryContext.reformulatedQuery || query;

            chunks = await retrieveChunksWithHybridSearch(searchQuery, vectorStore, embeddings, hybridSearch);
            if (chunks.length === 0) {
              console.log("❌ No relevant information found. Try rephrasing your question.");
              askQuestion();
              return;
            }

            const confidence = calculateConfidence(chunks);
            result = await generateResponseWithMemoryAndMCP(
              query,
              chunks,
              geminiClient,
              memoryContext,
              mcpService,
              confidence
            );

          } else if (classification.approach === "COMBINED") {
            console.log("\n🔧🔍 Using combined approach (MCP + Hybrid search)");
            const memoryContext = await memoryController.getCompleteMemoryContext(query);
            searchQuery = memoryContext.reformulatedQuery || query;

            const [mcpResult, hybridResult] = await Promise.allSettled([
              mcpService.processQueryWithMCP(query, 0.5),
              retrieveChunksWithHybridSearch(searchQuery, vectorStore, embeddings, hybridSearch),
            ]);

            let mcpEnhancement = "";
            let mcpToolsUsed = [];
            let mcpConfidence = 0;

            if (mcpResult.status === "fulfilled" && mcpResult.value.success) {
              mcpEnhancement = mcpResult.value.enhancedResponse || "";
              mcpToolsUsed = mcpResult.value.toolsUsed || [];
              mcpConfidence = mcpResult.value.confidence || 0;
            }

            if (hybridResult.status === "fulfilled" && hybridResult.value.length > 0) {
              chunks = hybridResult.value;
            }

            if (chunks.length === 0) {
              console.log("❌ No relevant information found. Try rephrasing your question.");
              askQuestion();
              return;
            }

            const confidence = calculateConfidence(chunks);
            result = await generateResponseWithMemoryAndMCP(
              query,
              chunks,
              geminiClient,
              memoryContext,
              mcpService,
              confidence,
              mcpEnhancement,
              mcpToolsUsed,
              mcpConfidence
            );

          } else {
            throw new Error(`Unknown classification approach: ${classification.approach}`);
          }

          // Process assistant response
          await memoryController.processAssistantResponse(result.answer, {
            timestamp: new Date().toISOString(),
            sources: result.sources?.length || 0,
            searchQuery:
              classification.approach === "MCP_TOOLS_ONLY" ? query : searchQuery || query,
            mcpToolsUsed: result.mcpToolsUsed?.length || 0,
            mcpConfidence: result.mcpConfidence || 0,
          });

          console.log("\n🤖 Assistant:");
          console.log("-".repeat(40));
          console.log(result.answer);
          console.log("-".repeat(40));

          if (result.mcpToolsUsed && result.mcpToolsUsed.length > 0) {
            console.log(`\n🔧 MCP Tools Used: ${result.mcpToolsUsed.join(", ")}`);
            console.log(`📊 MCP Confidence: ${(result.mcpConfidence * 100).toFixed(1)}%`);
          }

          if (result.sources && result.sources.length > 0) {
            console.log("\n📚 Sources:");
            result.sources.forEach((source) => {
              let title = source.metadata.title || source.metadata.doc_title;
              if (!title || title.trim() === "") {
                const contentLines = source.content.split("\n").filter((line) => line.trim() !== "");
                const firstLine = contentLines[0] || "";
                title = firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine;
                if (!title) title = "Twilio Documentation";
              }
              const category = source.metadata.category || "documentation";
              const url =
                source.metadata.source || source.metadata.source_url || "https://www.twilio.com/docs";

              console.log(`${source.index}. ${title} (${category})`);
              console.log(`   URL: ${url}`);
              const relevanceScore = source.similarity || source.score || 0;
              console.log(`   Relevance: ${relevanceScore.toFixed(3)}`);
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
    console.error("❌ Integrated chat initialization failed:", error.message);
    process.exit(1);
  }
}

// Handle CLI execution
if (process.argv[1] && process.argv[1].endsWith("chat.js")) {
  startIntegratedChat().catch(console.error);
}

export {
  generateResponseWithMCP,
  generateResponseWithMemoryAndMCP,
  generateConversationalResponse,
  loadVectorStore,
  initGeminiClient,
  initGeminiEmbeddings,
  generateContentWithRetry,
  retrieveChunksWithHybridSearch,
  calculateConfidence,
};
