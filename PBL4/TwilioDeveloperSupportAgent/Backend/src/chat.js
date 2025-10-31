// backend/src/chat.js
import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import config from "../config/config.js";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import ConversationMemory from "./conversationMemory.js";
import HybridSearch from "./hybridSearch.js";
import APIDetector from "./apiDetector.js";
import { TwilioMCPClient } from "./mcpClient.js";
import QueryEnhancer from "./queryEnhancer.js";
import QueryClassifier from "./queryClassifier.js";
import QueryRouter from "./queryRouter.js";
import TwilioMCPServer from "./mcpServer.js";

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

// Load separate code and text chunks for hybrid search
async function loadSeparateChunks() {
  try {
    const textChunksPath = path.join(
      process.cwd(),
      "src",
      "data",
      "text_chunks.json"
    );
    const codeChunksPath = path.join(
      process.cwd(),
      "src",
      "data",
      "code_chunks.json"
    );

    let textChunks = [];
    let codeChunks = [];

    try {
      textChunks = JSON.parse(await fs.readFile(textChunksPath, "utf-8"));
      console.log(
        `📄 Loaded ${textChunks.length} text chunks for hybrid search`
      );
    } catch (error) {
      console.log("⚠️ Text chunks not found, will use combined vector store");
    }

    try {
      codeChunks = JSON.parse(await fs.readFile(codeChunksPath, "utf-8"));
      console.log(
        `💻 Loaded ${codeChunks.length} code chunks for hybrid search`
      );
    } catch (error) {
      console.log("⚠️ Code chunks not found, will use combined vector store");
    }

    return { textChunks, codeChunks };
  } catch (error) {
    console.log("⚠️ Failed to load separate chunks, using vector store only");
    return { textChunks: [], codeChunks: [] };
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

// Detect error codes in query
function detectErrorCodes(query) {
  const errorCodeMatches = query.match(/\b(2\d{4}|\d{5})\b/g) || [];
  return [...new Set(errorCodeMatches)];
}

// Assess quality of local search results
function assessSearchQuality(query, chunks) {
  const queryLower = query.toLowerCase();
  const queryKeywords = queryLower
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // If no chunks found, quality is poor
  if (!chunks || chunks.length === 0) {
    return {
      quality: "poor",
      score: 0,
      reasons: ["No local results found"],
      shouldWebSearch: true,
    };
  }

  let totalScore = 0;
  let reasons = [];

  // Check chunk count
  if (chunks.length < config.SEARCH_QUALITY_THRESHOLDS.MIN_CHUNKS) {
    totalScore -= 40; // Only when truly empty
    reasons.push("Very few results found");
  } else if (chunks.length >= 5) {
    totalScore += 15; // Increased bonus for many results
    reasons.push("Good number of results");
  } else if (chunks.length >= 3) {
    totalScore += 8; // Increased bonus
    reasons.push("Adequate number of results");
  } else if (chunks.length >= 2) {
    totalScore += 5; // Good bonus for 2+ results
    reasons.push("Sufficient number of results");
  }

  // Check similarity scores
  const avgSimilarity =
    chunks.reduce((sum, chunk) => sum + (chunk.similarity || 0), 0) /
    chunks.length;
  if (avgSimilarity < config.SEARCH_QUALITY_THRESHOLDS.MIN_SIMILARITY) {
    totalScore -= 20; // Reduced penalty, only when truly low
    reasons.push("Low similarity scores");
  } else if (avgSimilarity > 0.7) {
    totalScore += 25; // Increased bonus for high similarity
    reasons.push("High similarity scores");
  } else if (avgSimilarity > 0.5) {
    totalScore += 12; // Good bonus for decent similarity
    reasons.push("Good similarity scores");
  } else if (avgSimilarity >= 0.3) {
    totalScore += 5; // Bonus for acceptable similarity
    reasons.push("Acceptable similarity scores");
  }

  // Check for keyword matches
  let keywordMatches = 0;
  chunks.forEach((chunk) => {
    // Skip chunks without content
    if (!chunk.content) {
      return;
    }
    const contentLower = chunk.content.toLowerCase();
    queryKeywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) {
        keywordMatches++;
      }
    });
  });

  const keywordMatchRatio =
    keywordMatches / (queryKeywords.length * chunks.length);
  if (keywordMatchRatio < config.SEARCH_QUALITY_THRESHOLDS.MIN_KEYWORD_RATIO) {
    totalScore -= 15; // Reduced penalty
    reasons.push("Poor keyword matching");
  } else if (keywordMatchRatio > 0.7) {
    totalScore += 18; // Increased bonus
    reasons.push("Good keyword matching");
  } else if (keywordMatchRatio > 0.5) {
    totalScore += 10; // Increased bonus
    reasons.push("Good keyword matching");
  } else if (keywordMatchRatio >= 0.3) {
    totalScore += 5; // Bonus for moderate keyword matching
    reasons.push("Moderate keyword matching");
  }

  // Check for error codes in query
  const errorCodes = detectErrorCodes(query);
  let hasErrorCodeMatch = false;
  if (errorCodes.length > 0) {
    hasErrorCodeMatch = chunks.some(
      (chunk) =>
        chunk.metadata?.error_codes &&
        errorCodes.some((code) => chunk.metadata.error_codes.includes(code))
    );
    if (!hasErrorCodeMatch) {
      totalScore -= 40; // Increased penalty for missing error codes
      reasons.push("No error code matches found");
    } else {
      totalScore += 20;
      reasons.push("Error code match found");
    }
  }

  // Check for API-specific content
  const apiKeywords = ["sms", "voice", "video", "webhook", "whatsapp"];
  const queryHasAPI = apiKeywords.some((api) => queryLower.includes(api));
  if (queryHasAPI) {
    const hasAPIMatch = chunks.some(
      (chunk) =>
        chunk.metadata?.api &&
        apiKeywords.some((api) =>
          chunk.metadata.api.toLowerCase().includes(api)
        )
    );
    if (!hasAPIMatch) {
      totalScore -= 15; // Reduced penalty
      reasons.push("No API-specific content found");
    } else {
      totalScore += 15; // Increased bonus
      reasons.push("API-specific content found");
    }
  }

  // Determine quality level using config thresholds
  let quality, shouldWebSearch;

  // Special case: If error codes detected but not found, always web search
  if (errorCodes.length > 0 && !hasErrorCodeMatch) {
    quality = "poor";
    shouldWebSearch = true;
    reasons.push(
      "Error codes detected but not in local data - triggering web search"
    );
  } else if (totalScore >= config.SEARCH_QUALITY_THRESHOLDS.EXCELLENT_SCORE) {
    quality = "excellent";
    shouldWebSearch = false;
  } else if (totalScore >= config.SEARCH_QUALITY_THRESHOLDS.GOOD_SCORE) {
    quality = "good";
    shouldWebSearch = false;
  } else if (totalScore >= config.SEARCH_QUALITY_THRESHOLDS.FAIR_SCORE) {
    quality = "fair";
    shouldWebSearch = true;
  } else {
    quality = "poor";
    shouldWebSearch = true;
  }

  return {
    quality,
    score: totalScore,
    reasons,
    shouldWebSearch,
    avgSimilarity,
    keywordMatchRatio,
    chunkCount: chunks.length,
  };
}

// Detect programming language from query
function detectQueryLanguage(query) {
  const q = query.toLowerCase();
  if (/\b(python|py|pip|flask|django)\b/.test(q)) return "python";
  if (/\b(node|nodejs|npm|express|javascript|js)\b/.test(q))
    return "javascript";
  if (/\b(php|composer|laravel)\b/.test(q)) return "php";
  if (/\b(java|maven|gradle)\b/.test(q)) return "java";
  if (/\b(csharp|c#|dotnet|\.net)\b/.test(q)) return "csharp";
  if (/\b(curl|bash|shell|cli)\b/.test(q)) return "bash";
  return null;
}

async function retrieveChunksWithHybridSearch(query, vectorStore, embeddings) {
  try {
    console.log("🔍 Searching for relevant information using hybrid search...");

    // Initialize hybrid search system
    const hybridSearch = new HybridSearch(vectorStore, embeddings);

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

// Hybrid search with error code and language detection
async function retrieveChunksWithEmbeddings(
  query,
  vectorStore,
  embeddings,
  separateChunks = { textChunks: [], codeChunks: [] }
) {
  try {
    console.log(
      "🔍 Starting hybrid search with error code and language detection..."
    );

    // Detect error codes and programming language
    const errorCodes = detectErrorCodes(query);
    const queryLanguage = detectQueryLanguage(query);

    if (errorCodes.length > 0) {
      console.log(`🚨 Detected error codes: ${errorCodes.join(", ")}`);
    }
    if (queryLanguage) {
      console.log(`💻 Detected programming language: ${queryLanguage}`);
    }

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
    let errorCodeChunks = [];
    let languageSpecificChunks = [];

    // First, check for exact error code matches in separate chunks
    if (
      errorCodes.length > 0 &&
      (separateChunks.textChunks.length > 0 ||
        separateChunks.codeChunks.length > 0)
    ) {
      console.log("🔍 Searching for exact error code matches...");

      const allChunks = [
        ...separateChunks.textChunks,
        ...separateChunks.codeChunks,
      ];
      errorCodeChunks = allChunks
        .filter((chunk) =>
          errorCodes.some(
            (code) => chunk.errorCodes && chunk.errorCodes.includes(code)
          )
        )
        .map((chunk) => ({
          content: chunk.content,
          metadata: {
            source: chunk.url,
            title: chunk.title,
            category: chunk.api,
            docType: "api",
            type: chunk.type,
            language: chunk.language,
            api: chunk.api,
            error_codes: chunk.errorCodes,
          },
          similarity: 1.0, // Exact match
          matchType: "error_code",
        }));

      console.log(
        `🚨 Found ${errorCodeChunks.length} exact error code matches`
      );
    }

    // Search in vector store for semantic matches
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
          type: match.metadata.type,
          language: match.metadata.language,
          api: match.metadata.api,
          error_codes: match.metadata.error_codes || [],
          chunk_index: match.metadata.chunk_index,
          total_chunks: match.metadata.total_chunks,
        },
        similarity: match.score,
        matchType: "semantic",
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
          matchType: "semantic",
        }));
    }

    // Filter by language if detected
    if (
      queryLanguage &&
      (separateChunks.textChunks.length > 0 ||
        separateChunks.codeChunks.length > 0)
    ) {
      console.log(`💻 Filtering results by language: ${queryLanguage}`);
      languageSpecificChunks = topChunks.filter(
        (chunk) => chunk.metadata.language === queryLanguage
      );
      console.log(
        `💻 Found ${languageSpecificChunks.length} language-specific matches`
      );
    }

    // Combine and prioritize results
    let finalChunks = [];

    // 1. Add exact error code matches first (highest priority)
    finalChunks.push(...errorCodeChunks);

    // 2. Add language-specific matches (medium priority)
    if (languageSpecificChunks.length > 0) {
      finalChunks.push(...languageSpecificChunks.slice(0, 3));
    }

    // 3. Add remaining semantic matches (lower priority)
    const remainingSlots =
      (parseInt(config.MAX_CHUNKS) || 10) - finalChunks.length;
    if (remainingSlots > 0) {
      const remainingChunks = topChunks
        .filter(
          (chunk) => !finalChunks.some((fc) => fc.content === chunk.content)
        )
        .slice(0, remainingSlots);
      finalChunks.push(...remainingChunks);
    }

    // Remove duplicates and sort by priority
    const uniqueChunks = finalChunks.filter(
      (chunk, index, self) =>
        index === self.findIndex((c) => c.content === chunk.content)
    );

    console.log(`📊 Final results: ${uniqueChunks.length} chunks`);
    console.log(`   🚨 Error code matches: ${errorCodeChunks.length}`);
    console.log(`   💻 Language matches: ${languageSpecificChunks.length}`);
    console.log(`   🔍 Semantic matches: ${topChunks.length}`);

    return uniqueChunks;
  } catch (error) {
    console.error(
      "❌ Embedding retrieval failed, using keyword search:",
      error.message
    );
    return searchChunks(query, vectorStore);
  }
}

/**
 * Process query with classifier routing
 * Orchestrates: Enhance → Classify → Route → Execute
 */
async function processQueryWithClassifier(
  query,
  vectorStore,
  embeddings,
  geminiClient,
  memory,
  apiDetector,
  mcpServer
) {
  try {
    console.log(chalk.blue("\n🔍 Processing query with classifier..."));
    console.log("=".repeat(60));

    // Step 1: Enhance query (preprocessing)
    const enhancer = new QueryEnhancer();
    const enhancements = enhancer.analyzeQuery(query);
    console.log(chalk.cyan("📊 Query Enhancements:"));
    console.log(
      chalk.gray(`   Language: ${enhancements.detectedLanguage || "none"}`)
    );
    console.log(chalk.gray(`   API: ${enhancements.detectedAPI || "none"}`));
    console.log(
      chalk.gray(
        `   Error Codes: ${enhancements.errorCodes.join(", ") || "none"}`
      )
    );

    // Step 2: Classify query
    const classifier = new QueryClassifier();
    const classification = await classifier.classify(query, enhancements);

    console.log(chalk.green(`\n✅ Classification Result:`));
    console.log(
      chalk.yellow(`   Route: ${classification.route.toUpperCase()}`)
    );
    console.log(
      chalk.yellow(
        `   Confidence: ${(classification.confidence * 100).toFixed(1)}%`
      )
    );
    if (classification.mcpTool) {
      console.log(chalk.yellow(`   MCP Tool: ${classification.mcpTool}`));
    }
    console.log(chalk.gray(`   Reasoning: ${classification.reasoning}`));

    // Step 3: Route and execute
    const router = new QueryRouter(vectorStore, embeddings, mcpServer);
    const routeResults = await router.route(
      classification,
      query,
      enhancements
    );

    return {
      classification,
      enhancements,
      chunks: routeResults.chunks,
      mcpResult: routeResults.mcpResult,
      generalSearchResults: routeResults.generalSearchResults,
      toolsUsed: routeResults.toolsUsed,
    };
  } catch (error) {
    console.error(chalk.red(`❌ Query processing failed: ${error.message}`));
    throw error;
  }
}

// Generate memory-aware response using Gemini - Updated for classifier flow
async function generateMemoryAwareResponse(
  query,
  processedData, // Contains: chunks, mcpResult, generalSearchResults, toolsUsed, classification, enhancements
  geminiClient,
  memory,
  apiDetector,
  sessionId = null
) {
  try {
    console.log(chalk.green("🤖 Generating memory-aware response..."));

    const {
      chunks = [],
      mcpResult,
      generalSearchResults,
      toolsUsed = [],
      classification,
      enhancements,
    } = processedData;

    // Detect API and language from query/enhancements
    const context = memory.getConversationContext(sessionId);
    const apiDetection = apiDetector.detectAPI(query, context);
    const detectedLanguage =
      enhancements?.detectedLanguage || detectQueryLanguage(query);

    // Show tools used if any
    if (toolsUsed.length > 0) {
      console.log(chalk.cyan(`\n🔧 Tools Used: ${toolsUsed.join(", ")}`));
    }

    // Extract MCP tool results
    let errorCodeInfo = null;
    let codeValidation = null;
    let statusInfo = null;
    let webhookValidation = null;
    let rateLimitInfo = null;
    let executionResult = null;
    let timeInfo = null;

    if (mcpResult) {
      // Parse MCP result based on tool type
      if (mcpResult.tool === "lookup_error_code" || mcpResult.errorInfo) {
        errorCodeInfo = mcpResult.errorInfo || mcpResult;
      } else if (
        mcpResult.tool === "validate_twilio_code" ||
        mcpResult.validation
      ) {
        codeValidation = mcpResult.validation || mcpResult;
      } else if (mcpResult.tool === "check_twilio_status" || mcpResult.status) {
        statusInfo = mcpResult.status || mcpResult;
      } else if (
        mcpResult.tool === "validate_webhook_signature" ||
        mcpResult.validation
      ) {
        webhookValidation = mcpResult;
      } else if (
        mcpResult.tool === "calculate_rate_limits" ||
        mcpResult.rateLimitInfo
      ) {
        rateLimitInfo = mcpResult.rateLimitInfo || mcpResult;
      } else if (
        mcpResult.tool === "execute_twilio_code" ||
        mcpResult.executionResult
      ) {
        executionResult = mcpResult.executionResult || mcpResult;
      } else if (mcpResult.tool === "get_current_time" || mcpResult.timeInfo) {
        timeInfo = mcpResult.timeInfo || mcpResult;
      } else {
        // Generic MCP result
        errorCodeInfo = mcpResult;
        codeValidation = mcpResult;
        statusInfo = mcpResult;
        rateLimitInfo = mcpResult;
        executionResult = mcpResult;
      }
    }

    // Update memory with detected information
    if (detectedLanguage) {
      await memory.updateLanguagePreference(detectedLanguage);
    }

    if (apiDetection.primary) {
      await memory.updateAPIPreference(apiDetection.primary.api);
    }

    // Update current context
    await memory.updateCurrentContext({
      topic: apiDetection.primary?.api || "general",
      relatedAPIs: apiDetection.all?.slice(0, 3).map((d) => d.api) || [],
      errorCodes: detectErrorCodes(query),
      lastQuery: query,
    });

    // Prepare context from retrieved chunks
    const contextChunks =
      chunks.length > 0
        ? chunks
            .map((chunk, index) => `[Source ${index + 1}] ${chunk.content}`)
            .join("\n\n")
        : "No documentation chunks retrieved.";

    // Generate context-aware prompt
    const contextPrompt = memory.generateContextPrompt(query);

    // Add API-specific context
    let apiContext = "";
    if (apiDetection.primary) {
      apiContext = `\nDETECTED API: The user is working with ${apiDetection.primary.api.toUpperCase()} API. `;
      if (apiDetection.primary.reasons.length > 0) {
        apiContext += `Detection based on: ${apiDetection.primary.reasons.join(
          ", "
        )}. `;
      }

      // Add related API suggestions
      const relatedAPIs = apiDetector.getRelatedAPIs(apiDetection.primary.api);
      if (relatedAPIs.length > 0) {
        apiContext += `Related APIs that might be relevant: ${relatedAPIs.join(
          ", "
        )}. `;
      }
    }

    // Build MCP tool context
    let mcpContext = "";

    // Add enhancement info
    if (enhancements) {
      if (enhancements.detectedLanguage) {
        mcpContext += `\nDetected Language: ${enhancements.detectedLanguage}. `;
      }
      if (enhancements.detectedAPI) {
        mcpContext += `Detected API: ${enhancements.detectedAPI}. `;
      }
      if (enhancements.suggestedFocus) {
        mcpContext += `Query Focus: ${enhancements.suggestedFocus}. `;
      }
    }

    // Add MCP tool results
    if (errorCodeInfo && errorCodeInfo.found) {
      mcpContext += `\n\n🔍 ERROR CODE ANALYSIS (via MCP tool): ${
        errorCodeInfo.message ||
        errorCodeInfo.errorInfo?.message ||
        "Error information"
      }. `;
      if (errorCodeInfo.description || errorCodeInfo.errorInfo?.description) {
        mcpContext += `${
          errorCodeInfo.description || errorCodeInfo.errorInfo.description
        }. `;
      }
      if (errorCodeInfo.solution || errorCodeInfo.errorInfo?.solution) {
        mcpContext += `Solution: ${
          errorCodeInfo.solution || errorCodeInfo.errorInfo.solution
        }.`;
      }
    }

    if (codeValidation) {
      mcpContext += `\n\n✅ CODE VALIDATION (via MCP tool): `;
      if (codeValidation.isValid || codeValidation.validation?.isValid) {
        const valid =
          codeValidation.isValid ?? codeValidation.validation?.isValid;
        if (valid) {
          mcpContext += `Code appears valid. `;
        } else {
          const issues =
            codeValidation.issues || codeValidation.validation?.issues || [];
          const suggestions =
            codeValidation.suggestions ||
            codeValidation.validation?.suggestions ||
            [];
          mcpContext += `Issues found: ${issues.join(
            ", "
          )}. Suggestions: ${suggestions.join(", ")}. `;
        }
      }
    }

    if (statusInfo) {
      mcpContext += `\n\n📊 STATUS CHECK (via MCP tool): ${
        statusInfo.status || statusInfo.message || "Status information"
      }.`;
    }

    if (rateLimitInfo) {
      mcpContext += `\n\n⚡ RATE LIMIT ANALYSIS (via MCP tool): `;
      if (rateLimitInfo.willExceedLimits) {
        mcpContext += `Your usage will exceed limits. `;
      } else {
        mcpContext += `Your usage is within limits. `;
      }
      if (rateLimitInfo.warnings?.length > 0) {
        mcpContext += `Warnings: ${rateLimitInfo.warnings.join(", ")}. `;
      }
    }

    if (executionResult) {
      mcpContext += `\n\n🔧 CODE EXECUTION (via MCP tool): ${
        executionResult.output || "Execution completed"
      }.`;
    }

    if (timeInfo) {
      mcpContext += `\n\n🕐 CURRENT TIME (via MCP tool): ${
        timeInfo.humanReadable ||
        timeInfo.formatted?.Local ||
        "Current time retrieved"
      }. `;
      if (timeInfo.formatted) {
        mcpContext += `UTC: ${timeInfo.formatted.UTC || "N/A"}, ISO: ${
          timeInfo.formatted.ISO || "N/A"
        }. `;
      }
      if (timeInfo.components) {
        mcpContext += `Date: ${timeInfo.components.weekday}, ${
          timeInfo.components.year
        }-${String(timeInfo.components.month).padStart(2, "0")}-${String(
          timeInfo.components.day
        ).padStart(2, "0")} ${String(timeInfo.components.hour).padStart(
          2,
          "0"
        )}:${String(timeInfo.components.minute).padStart(2, "0")}:${String(
          timeInfo.components.second
        ).padStart(2, "0")} (${timeInfo.components.timezone || "Local"}).`;
      }
    }

    // Add General Search results if available
    if (
      generalSearchResults &&
      generalSearchResults.found &&
      generalSearchResults.results
    ) {
      mcpContext += `\n\n🌐 GENERAL SEARCH RESULTS (Latest Twilio Information from Internet): `;
      mcpContext += `\nI searched the web because the query requires latest/outside information.`;
      generalSearchResults.results.forEach((result, index) => {
        mcpContext += `\n[WEB-${index + 1}] ${result.title} (${result.link}): ${
          result.snippet
        } `;
      });
      mcpContext += `\n\nNote: Information marked with [WEB-X] comes from real-time web search.`;
    }

    // Add routing information
    if (classification) {
      mcpContext += `\n\n📍 ROUTING INFO: Query was classified as "${classification.route}" route`;
      if (classification.mcpTool) {
        mcpContext += ` using MCP tool: ${classification.mcpTool}`;
      }
      mcpContext += ` (confidence: ${(classification.confidence * 100).toFixed(
        1
      )}%).`;
    }

    // Build sources array
    const sources = chunks.map((chunk, index) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      similarity: chunk.similarity || chunk.score || 0,
      score: chunk.score || chunk.similarity || 0,
      index: index + 1,
      sourceType:
        classification?.route === "general"
          ? "general_search"
          : "hybrid_search",
      searchType: chunk.searchType || "hybrid",
    }));

    // Add General Search results to sources if available
    if (
      generalSearchResults &&
      generalSearchResults.found &&
      generalSearchResults.results
    ) {
      generalSearchResults.results.forEach((result, index) => {
        sources.push({
          content: result.snippet,
          metadata: {
            source: result.link,
            title: result.title,
            displayLink: result.displayLink,
          },
          similarity: 1.0,
          score: 1.0,
          index: sources.length + 1,
          sourceType: "general_search",
          searchType: "web",
        });
      });
    }

    // Generate response using Gemini with memory context
    const prompt = `You are an expert Twilio developer support agent with deep knowledge of Twilio's api docs, sms quickstart, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Twilio.

${contextPrompt}${apiContext}${mcpContext}

CONTEXT (Twilio Documentation):
${contextChunks}

USER QUESTION: ${query}

ROUTING INFORMATION:
- Route: ${classification?.route || "unknown"}
${classification?.mcpTool ? `- MCP Tool Used: ${classification.mcpTool}` : ""}
- Classification Confidence: ${
      classification
        ? (classification.confidence * 100).toFixed(1) + "%"
        : "N/A"
    }
${toolsUsed.length > 0 ? `- Tools Used: ${toolsUsed.join(", ")}` : ""}
${
  chunks.length > 0
    ? `- Documentation Chunks Retrieved: ${chunks.length}`
    : "- No documentation chunks"
}
${
  generalSearchResults?.found
    ? `- General Search Results: ${
        generalSearchResults.results?.length || 0
      } results`
    : ""
}

RESPONSE GUIDELINES:
1. **Accuracy First**: Base your answer strictly on the provided Twilio documentation context
2. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
3. **Include Code**: Always include practical code examples in the appropriate programming language
4. **Step-by-Step**: Break down complex processes into clear, actionable steps
5. **Error Handling**: Mention common errors and how to handle them
6. **Best Practices**: Include security considerations and best practices
7. **Source Citations**: Reference specific sources using [Source X] format
8. **If Uncertain**: Clearly state when information isn't available in the context
9. **Memory Awareness**: Reference previous conversation context when relevant
10. **API Focus**: Prioritize information relevant to the detected API
11. **Tool Usage Transparency**: If MCP tools were used, mention which tools in your response
12. **Source Attribution**: Clearly distinguish between:
    * MCP tool results (for direct answers like error codes, validation)
    * Documentation from Hybrid Search ([Source X])
    * Web search results from General Search ([WEB-X])

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- If MCP tool results are available, use them as the primary source for structured data
- If documentation chunks are available, use them to provide comprehensive explanations
- If web search results are available, incorporate them for latest information
- Provide detailed explanation with code examples when relevant
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- Reference conversation context when helpful
- CLEARLY distinguish between information sources:
  * MCP tool results: "Based on [tool name] analysis..."
  * Use [Source X] for documentation chunks
  * Use [WEB-X] for general web search results
- If tools were used, mention: "I used [tool names] to analyze your query"
- End with source citations and tool acknowledgments

`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Highlight code blocks in the response
    const highlightedText = text.replace(
      /```(.*?)\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const highlighted = highlight(code, {
          language: lang || detectedLanguage || "javascript",
          ignoreIllegals: true,
          theme: {
            keyword: chalk.cyanBright,
            built_in: chalk.yellowBright,
            string: chalk.green,
            literal: chalk.magenta,
            section: chalk.blue,
            comment: chalk.gray,
            number: chalk.redBright,
            attr: chalk.yellow,
          },
        });
        return chalk.bgBlackBright(`\n${highlighted}\n`);
      }
    );

    // Clean the response text by removing ANSI escape codes
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, "");

    return {
      answer: cleanText,
      sources: sources,
      metadata: {
        language: detectedLanguage,
        api: apiDetection.primary?.api,
        confidence: apiDetection.primary?.confidence,
        reasoning: apiDetection.reasoning,
        route: classification?.route,
        toolsUsed: toolsUsed,
        classification: classification,
      },
    };
  } catch (error) {
    console.error(
      chalk.red("❌ Memory-aware response generation failed:"),
      error.message
    );
    throw error;
  }
}

// Generate response using Gemini (fallback)
async function generateResponse(query, chunks, geminiClient) {
  try {
    console.log(chalk.green("🤖 Generating response..."));

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
    const prompt = `You are an expert Twilio developer support agent with deep knowledge of Twilio's api docs, sms quickstart, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Twilio.

CONTEXT (Twilio Documentation):
${context}

USER QUESTION: ${query}

RESPONSE GUIDELINES:
1. **Accuracy First**: Base your answer strictly on the provided Twilio documentation context
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

`;

    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Highlight code blocks in the response
    const highlightedText = text.replace(
      /```(.*?)\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const highlighted = highlight(code, {
          language: lang || "javascript",
          ignoreIllegals: true,
          theme: {
            keyword: chalk.cyanBright,
            built_in: chalk.yellowBright,
            string: chalk.green,
            literal: chalk.magenta,
            section: chalk.blue,
            comment: chalk.gray,
            number: chalk.redBright,
            attr: chalk.yellow,
          },
        });
        return chalk.bgBlackBright(`\n${highlighted}\n`);
      }
    );

    // Clean the response text by removing ANSI escape codes
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, "");

    return {
      answer: cleanText,
      sources: chunks,
      webSearchResults: webSearchResults || null,
      metadata: {
        language: detectedLanguage,
        api: apiDetection.primary?.api,
        confidence: apiDetection.primary?.confidence,
        webSearchUsed: !!webSearchResults,
        webSearchResultCount: webSearchResults?.results?.length || 0,
      },
    };
  } catch (error) {
    console.error(chalk.red("❌ Response generation failed:"), error.message);
    throw error;
  }
}

// Main chat function with memory
async function startChat() {
  console.log(
    chalk.bold.blue("💳 Twilio Developer Support Agent - Chat with Memory")
  );
  console.log(chalk.gray("=".repeat(60)));
  console.log(chalk.cyan("🤖 AI Provider:"), chalk.yellow("Gemini"));
  console.log(chalk.cyan("🧠 Memory:"), chalk.yellow("Enabled"));
  console.log(
    chalk.green(
      "💡 Type 'exit' to quit, 'sample' for sample questions, 'memory' for memory stats"
    )
  );
  console.log(chalk.gray("=".repeat(60)));
  console.log("\n🚀 Sample Questions to Get Started:");
  console.log("\nHow do I send an SMS in Node.js?");
  console.log("What does error 30001 mean?");
  console.log(
    "What are A2P 10DLC campaign approval requirements for all brand types?"
  );
  console.log("How can I port US phone number to Twilio?");
  console.log("How can I get the delivery status of an SMS message?");
  console.log("How do I reset/change my Twilio password?");
  console.log("=".repeat(60));

  try {
    // Initialize components
    const geminiClient = initGeminiClient();
    const embeddings = initGeminiEmbeddings();
    const vectorStore = await loadVectorStore();
    const separateChunks = await loadSeparateChunks();

    // Initialize memory system
    const memory = new ConversationMemory();
    const apiDetector = new APIDetector();

    const memoryInitialized = await memory.initialize();
    if (!memoryInitialized) {
      console.log("⚠️ Memory system not available, using basic chat mode");
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question(chalk.bold("\n❓ Your question: "), async (query) => {
        if (query.toLowerCase() === "exit") {
          console.log(chalk.green("👋 Goodbye!"));
          rl.close();
          return;
        }

        if (query.toLowerCase() === "sample") {
          console.log("\n💡 Example Questions by Category:");
          console.log("\n🔧 API Integration:");
          console.log("  • How to handle Twilio API errors and exceptions?");
          console.log("\n🔐 Security & Webhooks:");
          console.log(
            "  • What are webhook signatures and how do I verify them?"
          );
          console.log("  • How to secure my Twilio integration?");
          askQuestion();
          return;
        }

        if (query.toLowerCase() === "memory") {
          const stats = memory.getMemoryStats();
          console.log("\n🧠 Memory Statistics:");
          console.log(`   Session ID: ${stats.sessionId}`);
          console.log(`   Conversation Turns: ${stats.conversationTurns}`);
          console.log(`   Session Duration: ${stats.sessionDuration} minutes`);
          console.log(`   User Preferences:`, stats.userPreferences);
          console.log(`   Current Context:`, stats.currentContext);
          askQuestion();
          return;
        }

        if (query.toLowerCase() === "clear") {
          await memory.clearSessionHistory();
          console.log("🗑️ Conversation history cleared");
          askQuestion();
          return;
        }

        if (query.trim() === "") {
          console.log(chalk.red("❌ Please enter a valid question."));
          askQuestion();
          return;
        }

        try {
          const startTime = Date.now();

          // Initialize MCP Server for tool access
          const mcpServer = new TwilioMCPServer();

          // Process query with classifier (routes to MCP/Hybrid/Combined/General)
          const processedData = await processQueryWithClassifier(
            query,
            vectorStore,
            embeddings,
            geminiClient,
            memory,
            apiDetector,
            mcpServer
          );

          // Check if we have any data to work with
          if (
            processedData.chunks.length === 0 &&
            !processedData.mcpResult &&
            !processedData.generalSearchResults?.found
          ) {
            console.log(
              chalk.red(
                "❌ No relevant information found. Try rephrasing your question."
              )
            );
            askQuestion();
            return;
          }

          // Generate memory-aware response
          const result = await generateMemoryAwareResponse(
            query,
            processedData,
            geminiClient,
            memory,
            apiDetector
          );

          const responseTime = Date.now() - startTime;

          // Add conversation turn to memory
          await memory.addConversationTurn(query, result.answer, {
            language: result.metadata?.language,
            api: result.metadata?.api,
            errorCodes: detectErrorCodes(query),
            chunkCount: processedData.chunks.length,
            responseTime: responseTime,
            route: result.metadata?.route,
            toolsUsed: result.metadata?.toolsUsed || [],
          });

          console.log("\n🤖 Assistant:");
          console.log("-".repeat(40));

          // Show routing and tool info
          if (result.metadata?.route) {
            console.log(
              chalk.cyan(`📍 Route: ${result.metadata.route.toUpperCase()}`)
            );
          }

          if (
            result.metadata?.toolsUsed &&
            result.metadata.toolsUsed.length > 0
          ) {
            console.log(
              chalk.cyan(
                `🔧 Tools Used: ${result.metadata.toolsUsed.join(", ")}`
              )
            );
          }

          // Show detection info if available
          if (result.metadata?.api) {
            console.log(
              chalk.cyan(
                `🔍 Detected API: ${result.metadata.api.toUpperCase()}`
              )
            );
          }

          if (result.metadata?.language) {
            console.log(
              chalk.cyan(`💻 Detected Language: ${result.metadata.language}`)
            );
          }

          const formattedAnswer = result.answer.replace(
            /```(.*?)\n([\s\S]*?)```/g,
            (match, lang, code) => {
              const highlighted = highlight(code, {
                language: lang || result.metadata?.language || "javascript",
                ignoreIllegals: true,
                theme: {
                  keyword: chalk.cyanBright,
                  built_in: chalk.yellowBright,
                  string: chalk.green,
                  literal: chalk.magenta,
                  section: chalk.blue,
                  comment: chalk.gray,
                  number: chalk.redBright,
                  attr: chalk.yellow,
                },
              });
              return chalk.bgBlackBright(`\n${highlighted}\n`);
            }
          );

          console.log(formattedAnswer);
          console.log(chalk.blue.bold("=".repeat(40)));

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
                if (!title) title = "Twilio Documentation";
              }

              const category = source.metadata.category || "documentation";
              const url =
                source.metadata.source ||
                source.metadata.source_url ||
                "https://twilio.com/docs";

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
  loadSeparateChunks,
  initGeminiClient,
  initGeminiEmbeddings,
  initPinecone,
  retrieveChunksWithEmbeddings,
  retrieveChunksWithHybridSearch,
  generateMemoryAwareResponse,
  detectQueryLanguage,
  detectErrorCodes,
};
