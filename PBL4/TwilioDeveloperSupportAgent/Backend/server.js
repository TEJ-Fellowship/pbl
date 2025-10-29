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

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174", // Allow both frontend ports
      "http://localhost:3000", // Common React dev server port
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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

    // Generate memory-aware response with processed data
    const result = await generateMemoryAwareResponse(
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
      route: classification.route,
      toolsUsed: processedData.toolsUsed,
    });

    // Format response for frontend
    const formattedResponse = {
      answer: result.answer,
      sources: result.sources || [],
      metadata: {
        ...result.metadata,
        responseTime,
        chunkCount: processedData.chunks.length,
        sessionId: sessionId || "default",
        route: classification.route,
        toolsUsed: processedData.toolsUsed,
        classification: classification,
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
    const context = memory.getConversationContext();
    res.json({
      history: context.recentHistory || [],
      sessionId: sessionId || "default",
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

// MCP Tools API endpoints
app.post("/api/mcp/tools", async (req, res) => {
  try {
    const { tool, args } = req.body;

    if (!tool) {
      return res.status(400).json({
        error: "Tool name is required",
      });
    }

    // Import the tool methods directly
    const { default: TwilioTools } = await import("./src/tools.js");
    const toolsInstance = new TwilioTools();

    let toolResult;
    switch (tool) {
      case "enhance_chat_context":
        toolResult = toolsInstance.analyzeQuery(
          args.query || "",
          args.context || ""
        );
        break;
      case "validate_twilio_code":
        toolResult = toolsInstance.validateTwilioCode(
          args.code || "",
          args.language || "javascript"
        );
        break;
      case "lookup_error_code":
        toolResult = toolsInstance.lookupErrorCode(args.errorCode || "");
        break;
      case "detect_programming_language":
        toolResult = toolsInstance.detectLanguage(args.text || "");
        break;
      case "web_search":
        toolResult = await toolsInstance.performWebSearch(
          args.query || "",
          args.maxResults || 5
        );
        break;
      case "check_twilio_status":
        toolResult = await toolsInstance.checkTwilioStatus(
          args.service || null
        );
        break;
      case "validate_webhook_signature":
        toolResult = toolsInstance.validateWebhookSignature(
          args.signature || "",
          args.url || "",
          args.payload || "",
          args.authToken || ""
        );
        break;
      case "calculate_rate_limits":
        toolResult = toolsInstance.calculateRateLimits(
          args.apiType || "sms",
          args.requestsPerSecond || 1,
          args.requestsPerMinute || 100,
          args.accountTier || "pay-as-you-go"
        );
        break;
      case "execute_twilio_code":
        toolResult = await toolsInstance.executeTwilioCode(
          args.code || "",
          args.language || "nodejs",
          args.testMode !== false
        );
        break;
      default:
        return res.status(400).json({
          error: `Unknown tool: ${tool}`,
          availableTools: [
            "enhance_chat_context",
            "validate_twilio_code",
            "lookup_error_code",
            "detect_programming_language",
            "web_search",
            "check_twilio_status",
            "validate_webhook_signature",
            "calculate_rate_limits",
            "execute_twilio_code",
          ],
        });
    }

    res.json({
      success: true,
      tool,
      result: toolResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ MCP tool execution error:", error);
    res.status(500).json({
      error: "MCP tool execution failed",
      message: error.message,
      tool: req.body.tool,
    });
  }
});

// Get available MCP tools
app.get("/api/mcp/tools", async (req, res) => {
  try {
    const tools = [
      {
        name: "enhance_chat_context",
        description: "Analyze queries for language/API detection",
        parameters: {
          query: {
            type: "string",
            required: true,
            description: "User query to analyze",
          },
          context: {
            type: "string",
            required: false,
            description: "Additional context",
          },
        },
      },
      {
        name: "validate_twilio_code",
        description: "Validate Twilio code snippets",
        parameters: {
          code: {
            type: "string",
            required: true,
            description: "Code to validate",
          },
          language: {
            type: "string",
            required: false,
            description: "Programming language",
          },
        },
      },
      {
        name: "lookup_error_code",
        description: "Look up Twilio error codes",
        parameters: {
          errorCode: {
            type: "string",
            required: true,
            description: "Error code to look up",
          },
        },
      },
      {
        name: "detect_programming_language",
        description: "Auto-detect programming language",
        parameters: {
          text: {
            type: "string",
            required: true,
            description: "Text to analyze",
          },
        },
      },
      {
        name: "web_search",
        description: "Search Twilio documentation",
        parameters: {
          query: {
            type: "string",
            required: true,
            description: "Search query",
          },
          maxResults: {
            type: "number",
            required: false,
            description: "Max results (default: 5)",
          },
        },
      },
      {
        name: "check_twilio_status",
        description: "Check Twilio service status",
        parameters: {
          service: {
            type: "string",
            required: false,
            description: "Service to check (sms, voice, etc.)",
          },
        },
      },
      {
        name: "validate_webhook_signature",
        description: "Validate webhook signatures",
        parameters: {
          signature: {
            type: "string",
            required: true,
            description: "X-Twilio-Signature header",
          },
          url: { type: "string", required: true, description: "Webhook URL" },
          payload: {
            type: "string",
            required: true,
            description: "Webhook payload",
          },
          authToken: {
            type: "string",
            required: true,
            description: "Twilio Auth Token",
          },
        },
      },
      {
        name: "calculate_rate_limits",
        description: "Calculate rate limit compliance",
        parameters: {
          apiType: {
            type: "string",
            required: true,
            description: "API type (sms, voice, etc.)",
          },
          requestsPerSecond: {
            type: "number",
            required: true,
            description: "Requests per second",
          },
          requestsPerMinute: {
            type: "number",
            required: true,
            description: "Requests per minute",
          },
          accountTier: {
            type: "string",
            required: false,
            description: "Account tier (default: pay-as-you-go)",
          },
        },
      },
      {
        name: "execute_twilio_code",
        description: "Execute code in sandbox",
        parameters: {
          code: {
            type: "string",
            required: true,
            description: "Code to execute",
          },
          language: {
            type: "string",
            required: false,
            description: "Programming language",
          },
          testMode: {
            type: "boolean",
            required: false,
            description: "Run in test mode (default: true)",
          },
        },
      },
    ];

    res.json({
      success: true,
      tools,
      count: tools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Get MCP tools error:", error);
    res.status(500).json({
      error: "Failed to retrieve MCP tools",
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
