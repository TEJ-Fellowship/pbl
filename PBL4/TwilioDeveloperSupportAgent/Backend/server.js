// Backend Express server for Twilio Developer Support Agent
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Import chat functionality
import {
  initGeminiClient,
  initGeminiEmbeddings,
  initPinecone,
  loadVectorStore,
  generateMemoryAwareResponse,
  detectQueryLanguage,
  detectErrorCodes,
} from "./src/chat.js";
// Import new routing modules
import QueryEnhancer from "./src/queryEnhancer.js";
import QueryClassifier from "./src/queryClassifier.js";
import QueryRouter from "./src/queryRouter.js";
import ConversationMemory from "./src/conversationMemory.js";
import APIDetector from "./src/apiDetector.js";
import TwilioMCPServer from "./src/mcpServer.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - MUST be first middleware
app.use((req, res, next) => {
  // Log CORS requests
  const origin = req.headers.origin;
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${origin || "none"}`);

  // Set CORS headers - MUST be set before any response
  // CRITICAL: When using credentials: true, you CANNOT use "*" for origin
  // Must use the specific origin or handle it properly
  if (origin) {
    // Only set origin if it's provided (browser will send it)
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // No origin header (e.g., Postman or curl) - allow all
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Cannot use credentials with wildcard
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    console.log(`✅ Handling OPTIONS preflight for ${origin || "no origin"}`);
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Global variables for initialized services
let geminiClient,
  embeddings,
  pinecone,
  vectorStore,
  memory,
  apiDetector,
  mcpServer;

// Initialize services
async function initializeServices() {
  try {
    console.log("🚀 Initializing Twilio Developer Support Agent services...");

    geminiClient = initGeminiClient();
    embeddings = initGeminiEmbeddings();
    pinecone = await initPinecone();
    vectorStore = await loadVectorStore();
    memory = new ConversationMemory();

    // Initialize memory to load existing data from file
    const memoryInitialized = await memory.initialize();
    if (!memoryInitialized) {
      console.log("⚠️ Memory system failed to initialize, but continuing...");
    }

    apiDetector = new APIDetector();

    // Initialize MCP Server for tool access
    try {
      mcpServer = new TwilioMCPServer();
      console.log("✅ MCP Server initialized successfully");
    } catch (mcpError) {
      console.log(
        "⚠️ MCP Server failed to initialize, some tools may not be available"
      );
      console.log(`   Error: ${mcpError.message}`);
      mcpServer = null;
    }

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

// Simple test endpoint to verify CORS works
app.post("/api/test", (req, res) => {
  console.log("🧪 Test endpoint called");
  res.json({
    message: "CORS is working!",
    timestamp: new Date().toISOString(),
    received: req.body,
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log(
    `📨 Received POST /api/chat from ${req.headers.origin || "unknown origin"}`
  );
  console.log(`📦 Request body:`, {
    query: req.body.query?.substring(0, 50) + "...",
    sessionId: req.body.sessionId,
  });

  // Ensure response object is valid
  if (!res || typeof res.status !== "function") {
    console.error("❌ Invalid response object!");
    return;
  }

  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: "Query is required and cannot be empty",
      });
    }

    console.log(`📝 Processing query: "${query}"`);
    const startTime = Date.now();

    // Step 1: Enhance query (preprocessing)
    const enhancer = new QueryEnhancer();
    const enhancements = enhancer.analyzeQuery(query);
    console.log("📊 Query Enhancements:", {
      language: enhancements.detectedLanguage,
      api: enhancements.detectedAPI,
      errorCodes: enhancements.errorCodes,
    });

    // Step 2: Classify query
    const classifier = new QueryClassifier();
    const classification = await classifier.classify(query, enhancements);
    console.log("✅ Classification:", {
      route: classification.route,
      mcpTool: classification.mcpTool,
      confidence: classification.confidence,
    });

    // Step 3: Route and execute
    const router = new QueryRouter(vectorStore, embeddings, mcpServer);
    const processedData = await router.route(
      classification,
      query,
      enhancements
    );

    // Check if we have any data to work with
    if (
      processedData.chunks.length === 0 &&
      !processedData.mcpResult &&
      !processedData.generalSearchResults?.found
    ) {
      return res.json({
        answer:
          "❌ No relevant information found. Try rephrasing your question.",
        sources: [],
        metadata: {
          route: classification.route,
          toolsUsed: processedData.toolsUsed,
        },
        responseTime: Date.now() - startTime,
      });
    }

    // Use sessionId from request or default
    const currentSessionId = sessionId || "default";
    console.log(`🔑 Using sessionId: ${currentSessionId}`);

    // Generate memory-aware response with processed data
    console.log(`🤖 Generating response for session: ${currentSessionId}`);
    let result;
    try {
      result = await generateMemoryAwareResponse(
        query,
        {
          chunks: processedData.chunks,
          mcpResult: processedData.mcpResult,
          generalSearchResults: processedData.generalSearchResults,
          toolsUsed: processedData.toolsUsed,
          classification,
          enhancements,
        },
        geminiClient,
        memory,
        apiDetector,
        currentSessionId
      );
      console.log(`✅ Response generated successfully`);
    } catch (genError) {
      console.error("❌ Error generating response:", genError);
      throw genError;
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Response generated in ${responseTime}ms`);

    // Format response for frontend FIRST - before any async operations
    const formattedResponse = {
      answer: result.answer,
      sources: result.sources || [],
      metadata: {
        ...result.metadata,
        responseTime,
        chunkCount: processedData.chunks.length,
        sessionId: currentSessionId,
        route: classification.route,
        toolsUsed: processedData.toolsUsed,
        classification: classification,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📤 Preparing to send response for session: ${currentSessionId}`
    );
    const responseSize = JSON.stringify(formattedResponse).length;
    console.log(`📊 Response size: ${responseSize} bytes`);

    // Validate before sending
    if (res.headersSent) {
      console.error("❌ ERROR: Headers already sent!");
      return;
    }

    if (!result || !result.answer) {
      console.error("❌ Invalid result object:", result);
      return res.status(500).json({
        error: "Invalid response generated",
        timestamp: new Date().toISOString(),
      });
    }

    // SEND RESPONSE IMMEDIATELY - ABSOLUTELY CRITICAL
    console.log(`📤 Sending response NOW - this MUST complete`);

    // Send response synchronously - no async operations after this
    res.status(200).json(formattedResponse);

    // Log AFTER sending to verify it worked
    console.log(`✅ Response sent successfully!`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Headers sent: ${res.headersSent}`);
    console.log(`   Origin: ${req.headers.origin || "none"}`);

    // Save conversation history AFTER response is sent
    // Use setTimeout with longer delay to ensure response is fully received by client
    // This prevents nodemon from restarting during the response
    setTimeout(() => {
      memory
        .addConversationTurn(
          query,
          result.answer,
          {
            language: result.metadata?.language,
            api: result.metadata?.api,
            errorCodes: detectErrorCodes(query),
            chunkCount: processedData.chunks.length,
            responseTime: responseTime,
            route: classification.route,
            toolsUsed: processedData.toolsUsed,
          },
          currentSessionId
        )
        .catch((err) => {
          // Silently fail - response already sent
          console.error("⚠️ Failed to save conversation turn:", err.message);
        });
    }, 1000); // Wait 1 second after response to save memory

    // Explicitly return - response is complete
    return;
  } catch (error) {
    console.error("❌ Chat API error:", error);
    console.error("Error stack:", error.stack);

    // Send proper error response (CORS middleware handles headers)
    const errorResponse = {
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An error occurred while processing your request",
      timestamp: new Date().toISOString(),
    };

    if (!res.headersSent) {
      try {
        res.status(500).json(errorResponse);
        console.log(
          `✅ Error response sent to ${req.headers.origin || "unknown"}`
        );
      } catch (sendError) {
        console.error("❌ Failed to send error response:", sendError);
      }
    } else {
      console.error("⚠️ Cannot send error response - headers already sent");
    }
  }
});

// Get conversation history endpoint
app.get("/api/conversation/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentSessionId = sessionId || "default";

    // Get conversation history for the session
    const session = memory.getSession(currentSessionId);
    const conversationHistory = session?.conversationHistory || [];

    // Convert conversation history to frontend format (alternating user and assistant messages)
    const history = [];
    conversationHistory.forEach((turn, index) => {
      // Add user message
      history.push({
        id: `user_${currentSessionId}_${index}`,
        type: "user",
        content: turn.query,
        timestamp: turn.timestamp,
      });

      // Add assistant message
      history.push({
        id: `assistant_${currentSessionId}_${index}`,
        type: "assistant",
        content: turn.response,
        sources: [],
        metadata: turn.metadata || {},
        timestamp: turn.timestamp,
      });
    });

    res.json({
      history: history,
      sessionId: currentSessionId,
    });
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
    const currentSessionId = sessionId || "default";
    await memory.clearConversationHistory(currentSessionId);
    res.json({
      message: "Conversation history cleared successfully",
      sessionId: currentSessionId,
    });
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
    const currentSessionId = sessionId || "default";
    const preferences = memory.getUserPreferences(currentSessionId);
    res.json({
      preferences,
      sessionId: currentSessionId,
    });
  } catch (error) {
    console.error("❌ Get preferences error:", error);
    res.status(500).json({
      error: "Failed to retrieve user preferences",
      message: error.message,
    });
  }
});

// List all sessions endpoint (for testing/debugging)
app.get("/api/sessions", async (req, res) => {
  try {
    if (!memory) {
      return res.status(500).json({
        error: "Memory not initialized",
        sessions: [],
        total: 0,
      });
    }

    // Use the getAllSessions method if available
    let allSessions = [];
    if (typeof memory.getAllSessions === "function") {
      allSessions = memory.getAllSessions();
      console.log(
        `📋 Found ${allSessions.length} sessions via getAllSessions()`
      );
    } else {
      // Fallback: Access memory's internal sessions object
      const sessionIds = Object.keys(memory.memory?.sessions || {});
      console.log(`📋 Found ${sessionIds.length} session IDs in memory`);
      allSessions = sessionIds.map((sid) => {
        const session = memory.getSession(sid);
        return {
          id: sid,
          createdAt: session?.createdAt || null,
          lastActivity: session?.lastActivity || null,
          messageCount: session?.conversationHistory?.length || 0,
          preferences: session?.userPreferences || {},
        };
      });
    }

    res.json({
      sessions: allSessions,
      total: allSessions.length,
    });
  } catch (error) {
    console.error("❌ List sessions error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to list sessions",
      message: error.message,
      sessions: [],
      total: 0,
    });
  }
});

// Error handling middleware - MUST be after all routes
app.use((error, req, res, next) => {
  // Only handle errors if response hasn't been sent
  if (!res.headersSent) {
    console.error("❌ Unhandled error:", error);
    try {
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    } catch (sendError) {
      console.error("❌ Cannot send error response:", sendError);
    }
  } else {
    // Response already sent, just log the error
    console.error("❌ Error occurred after response was sent:", error);
  }
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

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - just log it
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
