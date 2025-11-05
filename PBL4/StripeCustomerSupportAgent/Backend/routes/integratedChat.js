import express from "express";
import {
  generateResponseWithMCP,
  generateResponseWithMemoryAndMCP,
  loadVectorStore,
  initGeminiClient,
  initGeminiClient2,
  initGeminiClient3,
  initGeminiEmbeddings,
  retrieveChunksWithHybridSearch,
  calculateConfidence,
} from "../scripts/integratedChat.js";
import MemoryController from "../controllers/memoryController.js";
import MCPIntegrationService from "../services/mcpIntegrationService.js";
import QueryClassifier from "../services/queryClassifier.js";
import HybridSearch from "../hybridSearch.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
import config from "../config/config.js";
import { generateConversationalResponse as generateConversationalResponseService } from "../scripts/integratedChat.js";
import { optionalAuth, requireUserId } from "../middleware/optionalAuth.js";

/**
 * Generate simple conversational response from memory only
 */
async function generateConversationalResponse(
  query,
  memoryContext,
  geminiClient
) {
  return await generateConversationalResponseService(
    query,
    memoryContext,
    geminiClient
  );
}

const router = express.Router();

// Apply optional auth to all integrated chat routes
router.use(optionalAuth);

// Initialize services (singleton pattern)
let services = null;

async function initializeServices() {
  if (services) return services;

  try {
    console.log("🔧 Initializing integrated chat services...");

    // Initialize core services
    const geminiClient = initGeminiClient();
    const geminiClient2 = initGeminiClient2();
    const geminiClient3 = initGeminiClient3();
    const embeddings = initGeminiEmbeddings();
    const vectorStore = await loadVectorStore();
    const memoryController = new MemoryController();
    const mcpService = new MCPIntegrationService();
    const queryClassifier = new QueryClassifier(mcpService.orchestrator);

    // Initialize PostgreSQL BM25 service for hybrid search
    const postgresBM25Service = new PostgreSQLBM25Service();
    const hybridSearch = new HybridSearch(
      vectorStore,
      embeddings,
      postgresBM25Service
    );

    // Initialize hybrid search
    await hybridSearch.initialize();

    // Wait for MCP service to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    services = {
      geminiClient,
      geminiClient2,
      geminiClient3,
      embeddings,
      vectorStore,
      memoryController,
      mcpService,
      queryClassifier,
      hybridSearch,
    };

    console.log("✅ Integrated chat services initialized");
    return services;
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    throw error;
  }
}

// Enhanced chat endpoint with full integrated functionality
router.post("/", requireUserId, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    // Get userId from auth middleware (authenticated) or request body (anonymous)
    const userId = req.userId;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Message and sessionId are required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required. Please log in or provide a user ID.",
      });
    }

    console.log("-".repeat(60));
    console.log("\n💬 Processing message: " + message.substring(0, 50) + "...");

    // Initialize services if not already done
    const {
      geminiClient,
      geminiClient2,
      geminiClient3,
      embeddings,
      vectorStore,
      memoryController,
      mcpService,
      queryClassifier,
      hybridSearch,
    } = await initializeServices();

    // Initialize memory session if not exists
    try {
      await memoryController.initializeSession(sessionId, userId, {
        project: "stripe_support",
        context: "customer_support_with_mcp",
        startTime: new Date().toISOString(),
      });
    } catch (error) {
      console.log(
        "⚠️ Session already exists or initialization failed:",
        error.message
      );
    }

    // Process user message with memory system
    await memoryController.processUserMessage(message, {
      timestamp: new Date().toISOString(),
      source: "web_interface",
    });

    console.log("-".repeat(60));
    // Step 1: Classify the query to decide approach
    const enabledTools = mcpService.getEnabledTools();
    console.log("\n🔍 Enabled MCP Tools:", enabledTools);

    const classification = await queryClassifier.classifyQuery(
      message,
      0.5,
      enabledTools
    );

    console.log("🔍 Classification details:", classification);

    let result;
    let chunks = [];
    let searchQuery = message;

    // Step 2: Route based on classification
    // Handle CONVERSATIONAL approach FIRST (highest priority)
    if (classification.approach === "CONVERSATIONAL") {
      console.log("\n Using CONVERSATIONAL approach - memory-only response");

      // Get lightweight memory context WITHOUT reformulation to save Gemini usage
      const [recentContext, longTermContext, sessionContext] =
        await Promise.all([
          Promise.resolve(memoryController.getRecentContext()),
          memoryController.getLongTermContext(
            message,
            Boolean(classification.isConversationQuery)
          ),
          memoryController.getSessionContext(),
        ]);

      const memoryContext = {
        recentContext,
        longTermContext,
        sessionContext,
        // No reformulation for conversational branch
      };

      result = await generateConversationalResponse(
        message,
        memoryContext,
        geminiClient2
      );
    } else if (classification.approach === "MCP_TOOLS_ONLY") {
      console.log("🔧 Using MCP tools only approach");

      // Try MCP tools first
      const mcpResult = await mcpService.processQueryWithMCP(message, 0.5);

      console.log("🔍 MCP Result:", mcpResult);
      console.log("🔍 MCP Tools Used:", mcpResult.toolsUsed);

      if (mcpResult.success && mcpResult.enhancedResponse) {
        // Generate response using MCP tools only
        result = await generateResponseWithMCP(
          message,
          [], // No chunks needed for MCP-only
          geminiClient,
          mcpService,
          0.8, // High confidence for MCP tools
          mcpResult.enhancedResponse,
          mcpResult.toolsUsed || [],
          mcpResult.confidence || 0
        );
      } else {
        // Check if this is a conversation query before falling back to hybrid search
        if (classification.isConversationQuery) {
          console.log(
            "💬 Detected conversation query - using memory-only response"
          );

          // Get memory context for conversational response
          const memoryContext = await memoryController.getCompleteMemoryContext(
            message
          );

          result = await generateConversationalResponse(
            message,
            memoryContext,
            geminiClient2
          );
        } else {
          // Fallback to hybrid search if MCP fails and it's not a conversation query
          console.log("⚠️ MCP tools failed, falling back to hybrid search");

          // Get complete memory context for query reformulation
          const memoryContext = await memoryController.getCompleteMemoryContext(
            message
          );

          // Use reformulated query for retrieval
          searchQuery = memoryContext.reformulatedQuery || message;
          console.log(
            `🔍 Searching with reformulated query: "${searchQuery.substring(
              0,
              60
            )}..."`
          );

          chunks = await retrieveChunksWithHybridSearch(
            searchQuery,
            vectorStore,
            embeddings,
            hybridSearch
          );

          if (chunks.length === 0) {
            return res.status(404).json({
              success: false,
              error:
                "No relevant information found. Try rephrasing your question.",
            });
          }

          const confidence = calculateConfidence(chunks);
          result = await generateResponseWithMemoryAndMCP(
            message,
            chunks,
            geminiClient,
            memoryContext,
            mcpService,
            confidence
          );
        }
      }
    } else if (classification.approach === "HYBRID_SEARCH") {
      console.log("🔍 Using hybrid search approach");

      // Get complete memory context for query reformulation
      const memoryContext = await memoryController.getCompleteMemoryContext(
        message
      );

      // Use reformulated query for retrieval
      searchQuery = memoryContext.reformulatedQuery || message;
      console.log(
        `🔍 Searching with reformulated query: "${searchQuery.substring(
          0,
          60
        )}..."`
      );

      // Retrieve relevant chunks using hybrid search
      chunks = await retrieveChunksWithHybridSearch(
        searchQuery,
        vectorStore,
        embeddings,
        hybridSearch
      );

      if (chunks.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No relevant information found. Try rephrasing your question.",
        });
      }

      // Calculate confidence score
      const confidence = calculateConfidence(chunks);
      console.log(`📊 Document confidence: ${(confidence * 100).toFixed(1)}%`);

      // Generate response with memory context
      result = await generateResponseWithMemoryAndMCP(
        message,
        chunks,
        geminiClient,
        memoryContext,
        mcpService,
        confidence
      );
    } else if (classification.approach === "COMBINED") {
      console.log("🔧🔍 Using combined approach (MCP + Hybrid search)");

      // Get complete memory context for query reformulation
      const memoryContext = await memoryController.getCompleteMemoryContext(
        message
      );

      // Use reformulated query for retrieval
      searchQuery = memoryContext.reformulatedQuery || message;
      console.log(
        `🔍 Searching with reformulated query: "${searchQuery.substring(
          0,
          60
        )}..."`
      );

      // Get both MCP and hybrid search results
      const [mcpResult, hybridResult] = await Promise.allSettled([
        mcpService.processQueryWithMCP(message, 0.5), // Use original query for MCP
        retrieveChunksWithHybridSearch(
          searchQuery, // Use reformulated query for hybrid search
          vectorStore,
          embeddings,
          hybridSearch
        ),
      ]);

      // Extract MCP results if successful
      let mcpEnhancement = "";
      let mcpToolsUsed = [];
      let mcpConfidence = 0;

      if (mcpResult.status === "fulfilled" && mcpResult.value.success) {
        mcpEnhancement = mcpResult.value.enhancedResponse || "";
        mcpToolsUsed = mcpResult.value.toolsUsed || [];
        mcpConfidence = mcpResult.value.confidence || 0;
        console.log(`✅ MCP tools used: ${mcpToolsUsed.join(", ")}`);
        console.log(`📊 MCP confidence: ${(mcpConfidence * 100).toFixed(1)}%`);
      }

      // Use hybrid search results if available
      if (
        hybridResult.status === "fulfilled" &&
        hybridResult.value.length > 0
      ) {
        chunks = hybridResult.value;
      }

      if (chunks.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No relevant information found. Try rephrasing your question.",
        });
      }

      // Calculate confidence score
      const confidence = calculateConfidence(chunks);
      console.log(`📊 Document confidence: ${(confidence * 100).toFixed(1)}%`);

      // Generate response with both MCP and hybrid search
      result = await generateResponseWithMemoryAndMCP(
        message,
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
      throw new Error(
        `Unknown classification approach: ${classification.approach}`
      );
    }

    // Process assistant response with memory system
    await memoryController.processAssistantResponse(result.answer, {
      timestamp: new Date().toISOString(),
      sources: result.sources?.length || 0,
      searchQuery:
        classification.approach === "MCP_TOOLS_ONLY"
          ? message
          : searchQuery || message,
      mcpToolsUsed: result.mcpToolsUsed?.length || 0,
      mcpConfidence: result.mcpConfidence || 0,
    });

    // Update session token usage after processing messages
    try {
      await memoryController.postgresMemory.updateSessionTokenUsage(sessionId);
      console.log("✅ Session token usage updated");
    } catch (tokenError) {
      console.error("❌ Failed to update token usage:", tokenError);
    }

    // Automatic conversation summarization (every 4 messages)
    // This aligns with Client 3 usage: gemini-2.0-flash-lite for session summarization
    try {
      const sessionStats = await memoryController.getSessionStats();
      if (
        sessionStats &&
        sessionStats.total_messages &&
        sessionStats.total_messages > 0 &&
        sessionStats.total_messages % 4 === 0
      ) {
        console.log(
          `\n📝 Auto-creating conversation summary (message #${sessionStats.total_messages})`
        );
        await memoryController.createConversationSummary();
        console.log("✅ Conversation summary created automatically");
      }
    } catch (summaryError) {
      // Non-critical error - don't break the flow
      console.warn(
        "⚠️ Failed to auto-create conversation summary:",
        summaryError.message
      );
    }

    // Prepare response
    const response = {
      success: true,
      data: {
        message: result.answer,
        confidence: result.overallConfidence || result.mcpConfidence || 0.8,
        sources: result.sources || [],
        mcpToolsUsed: result.mcpToolsUsed || [],
        mcpConfidence: result.mcpConfidence || 0,
        classification: classification.approach,
        reasoning: classification.reasoning,
        searchQuery: searchQuery,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `✅ Response generated with confidence: ${(
        response.data.confidence * 100
      ).toFixed(1)}%`
    );
    console.log(
      `🔧 MCP tools used: ${response.data.mcpToolsUsed.join(", ") || "None"}`
    );
    console.log(`📚 Sources: ${response.data.sources.length}`);
    console.log("🔍 Backend - sources details:", response.data.sources);

    res.json(response);
  } catch (error) {
    console.error("❌ Integrated chat error:", error);
    if (error?.rateLimit || error?.status === 429) {
      const retryAfter = Math.max(
        1,
        parseInt(error.retryAfterSeconds || 15, 10)
      );
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Please retry after a short wait.",
        retryAfterSeconds: retryAfter,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Get MCP system status
router.get("/mcp-status", async (req, res) => {
  try {
    const { mcpService } = await initializeServices();
    const mcpStatus = mcpService.getToolManagementInfo();

    res.json({
      success: true,
      data: mcpStatus,
    });
  } catch (error) {
    console.error("❌ MCP status error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get query classifier status
router.get("/classifier-status", async (req, res) => {
  try {
    const { queryClassifier } = await initializeServices();
    const classifierStats = queryClassifier.getStats();

    res.json({
      success: true,
      data: classifierStats,
    });
  } catch (error) {
    console.error("❌ Classifier status error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get system health with all services
router.get("/health", async (req, res) => {
  try {
    const services = await initializeServices();

    res.json({
      success: true,
      data: {
        services: {
          gemini: "✅ Initialized",
          embeddings: "✅ Initialized",
          vectorStore: "✅ Initialized",
          memoryController: "✅ Initialized",
          mcpService: "✅ Initialized",
          queryClassifier: "✅ Initialized",
          hybridSearch: "✅ Initialized",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Health check error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manually trigger conversation summarization for a session
router.post("/summarize/:sessionId", requireUserId, async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Get userId from auth middleware (authenticated) or request body (anonymous)
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required. Please log in or provide a user ID.",
      });
    }

    console.log(`📝 Manual summarization request for session: ${sessionId}`);

    const { memoryController } = await initializeServices();

    // Initialize session if needed
    await memoryController.initializeSession(sessionId, userId, {
      project: "stripe_support",
      context: "customer_support_with_mcp",
    });

    // Create conversation summary
    const summary = await memoryController.createConversationSummary();

    console.log(`✅ Conversation summary created for session: ${sessionId}`);

    res.json({
      success: true,
      data: {
        sessionId,
        summary: {
          summaryText: summary.summary_text,
          keyTopics: summary.key_topics || [],
          createdAt: summary.created_at,
        },
        message: "Conversation summary created successfully",
      },
    });
  } catch (error) {
    console.error("❌ Summarization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create conversation summary",
    });
  }
});

export default router;
