// Backend Express server for Twilio Developer Support Agent
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import chat functionality
import {
  initGeminiClient,
  initGeminiEmbeddings,
  initPinecone,
  loadVectorStore,
  retrieveChunksWithEmbeddings,
  generateMemoryAwareResponse,
  detectQueryLanguage,
  detectErrorCodes,
} from "./src/chat.js";
import ConversationMemory from "./src/conversationMemory.js";
import APIDetector from "./src/apiDetector.js";
import { toolManager, generateEnhancedResponse } from "./src/mcpWrapper.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Global variables for initialized services
let geminiClient, embeddings, pinecone, vectorStore, memory, apiDetector;

// Initialize services
async function initializeServices() {
  try {
    console.log("🚀 Initializing Twilio Developer Support Agent services...");

    geminiClient = initGeminiClient();
    embeddings = initGeminiEmbeddings();
    pinecone = await initPinecone();
    vectorStore = await loadVectorStore();
    memory = new ConversationMemory();
    apiDetector = new APIDetector();

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Service initialization failed:", error.message);
    process.exit(1);
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!geminiClient,
      embeddings: !!embeddings,
      pinecone: !!pinecone,
      vectorStore: !!vectorStore,
      memory: !!memory,
      apiDetector: !!apiDetector,
    },
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`📝 Processing query: "${query}"`);
    const startTime = Date.now();

    // Retrieve relevant chunks using hybrid search
    const chunks = await retrieveChunksWithEmbeddings(
      query,
      vectorStore,
      embeddings,
      { textChunks: [], codeChunks: [] }
    );

    if (chunks.length === 0) {
      return res.json({
        answer:
          "❌ No relevant information found. Try rephrasing your question.",
        sources: [],
        metadata: {},
        responseTime: Date.now() - startTime,
      });
    }

    // Generate memory-aware response
    const result = await generateMemoryAwareResponse(
      query,
      chunks,
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
      chunkCount: chunks.length,
      responseTime: responseTime,
    });

    // Format response for frontend
    const formattedResponse = {
      answer: result.answer,
      sources: result.sources || [],
      metadata: {
        ...result.metadata,
        responseTime,
        chunkCount: chunks.length,
        sessionId: sessionId || "default",
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Response generated in ${responseTime}ms`);
    res.json(formattedResponse);
  } catch (error) {
    console.error("❌ Chat API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get conversation history endpoint
app.get("/api/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await memory.getConversationHistory(sessionId || "default");
    res.json({ history });
  } catch (error) {
    console.error("❌ Conversation history error:", error);
    res.status(500).json({
      error: "Failed to retrieve conversation history",
      message: error.message,
    });
  }
});

// Clear conversation memory endpoint
app.delete("/api/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await memory.clearConversationHistory(sessionId || "default");
    res.json({ message: "Conversation history cleared successfully" });
  } catch (error) {
    console.error("❌ Clear conversation error:", error);
    res.status(500).json({
      error: "Failed to clear conversation history",
      message: error.message,
    });
  }
});

// Get user preferences endpoint
app.get("/api/preferences/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const preferences = await memory.getUserPreferences(sessionId || "default");
    res.json({ preferences });
  } catch (error) {
    console.error("❌ Get preferences error:", error);
    res.status(500).json({
      error: "Failed to retrieve user preferences",
      message: error.message,
    });
  }
});

// Web search endpoints
app.post("/api/search/web", async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`🔍 Web search request: "${query}"`);
    const startTime = Date.now();

    const results = await toolManager.executeTool("web_search", query, options);
    const responseTime = Date.now() - startTime;

    res.json({
      ...results,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Web search error:", error);
    res.status(500).json({
      error: "Web search failed",
      message: error.message,
    });
  }
});

// Twilio updates search endpoint
app.post("/api/search/updates", async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`📰 Twilio updates search: "${query}"`);
    const startTime = Date.now();

    const results = await toolManager.executeTool("twilio_updates", query, options);
    const responseTime = Date.now() - startTime;

    res.json({
      ...results,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Twilio updates search error:", error);
    res.status(500).json({
      error: "Twilio updates search failed",
      message: error.message,
    });
  }
});

// Error solutions search endpoint
app.post("/api/search/error-solutions", async (req, res) => {
  try {
    const { errorCode, query = "", options = {} } = req.body;

    if (!errorCode || errorCode.trim().length === 0) {
      return res.status(400).json({
        error: "Error code is required",
      });
    }

    console.log(`🔧 Error solutions search: "${errorCode}" - "${query}"`);
    const startTime = Date.now();

    const results = await toolManager.executeTool("error_solutions", errorCode, query, options);
    const responseTime = Date.now() - startTime;

    res.json({
      ...results,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error solutions search error:", error);
    res.status(500).json({
      error: "Error solutions search failed",
      message: error.message,
    });
  }
});

// Community discussions search endpoint
app.post("/api/search/community", async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`💬 Community discussions search: "${query}"`);
    const startTime = Date.now();

    const results = await toolManager.executeTool("community_discussions", query, options);
    const responseTime = Date.now() - startTime;

    res.json({
      ...results,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Community discussions search error:", error);
    res.status(500).json({
      error: "Community discussions search failed",
      message: error.message,
    });
  }
});

// Get available tools endpoint
app.get("/api/tools", (req, res) => {
  try {
    const tools = toolManager.getAvailableTools();
    res.json({
      tools,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Get tools error:", error);
    res.status(500).json({
      error: "Failed to retrieve available tools",
      message: error.message,
    });
  }
});

// Enhanced chat endpoint with web search
app.post("/api/chat/enhanced", async (req, res) => {
  try {
    const { query, sessionId, useWebSearch = false } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`📝 Processing enhanced query: "${query}" (web search: ${useWebSearch})`);
    const startTime = Date.now();

    // Retrieve relevant chunks using hybrid search
    const chunks = await retrieveChunksWithEmbeddings(
      query,
      vectorStore,
      embeddings,
      { textChunks: [], codeChunks: [] }
    );

    if (chunks.length === 0) {
      return res.json({
        answer:
          "❌ No relevant information found. Try rephrasing your question.",
        sources: [],
        metadata: {},
        responseTime: Date.now() - startTime,
      });
    }

    // Convert chunks to context blocks
    const contextBlocks = chunks.map((chunk, index) => ({
      id: `chunk_${index}`,
      type: chunk.metadata?.type || "documentation",
      title: chunk.metadata?.title || "Documentation",
      content: chunk.content,
      metadata: chunk.metadata,
      weight: 1.0,
    }));

    // Generate enhanced response with web search
    const result = await generateEnhancedResponse({
      geminiClient,
      query,
      contextBlocks,
      instructions: "Provide a comprehensive answer with code examples and best practices.",
      maxTokens: 2048,
      useWebSearch,
      toolManager,
    });

    const responseTime = Date.now() - startTime;

    // Add conversation turn to memory
    await memory.addConversationTurn(query, result.text, {
      language: detectQueryLanguage(query),
      api: apiDetector.detectAPI(query),
      errorCodes: detectErrorCodes(query),
      chunkCount: chunks.length,
      responseTime: responseTime,
      webSearchUsed: useWebSearch,
    });

    // Format response for frontend
    const formattedResponse = {
      answer: result.text,
      sources: result.sources || [],
      metadata: {
        ...result.metadata,
        responseTime,
        chunkCount: chunks.length,
        sessionId: sessionId || "default",
        webSearchUsed: useWebSearch,
        webSearchResults: result.webSearchResults || null,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Enhanced response generated in ${responseTime}ms`);
    res.json(formattedResponse);
  } catch (error) {
    console.error("❌ Enhanced chat API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Start server
async function startServer() {
  await initializeServices();

  app.listen(PORT, () => {
    console.log(
      `🚀 Twilio Developer Support Agent API running on port ${PORT}`
    );
    console.log(
      `📡 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
    );
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server gracefully...");
  process.exit(0);
});

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
