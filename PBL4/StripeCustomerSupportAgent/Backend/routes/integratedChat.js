import express from "express";
import {
  generateResponseWithMCP,
  generateResponseWithMemoryAndMCP,
  loadVectorStore,
  initGeminiClient,
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

const router = express.Router();

// Initialize services (singleton pattern)
let services = null;

async function initializeServices() {
  if (services) return services;

  try {
    console.log("🔧 Initializing integrated chat services...");

    // Initialize core services
    const geminiClient = initGeminiClient();
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
router.post("/", async (req, res) => {
  try {
    const { message, sessionId, userId = "web_user" } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Message and sessionId are required",
      });
    }

    console.log(`💬 Processing message: "${message.substring(0, 50)}..."`);

    // Initialize services if not already done
    const {
      geminiClient,
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

    // Step 1: Classify the query to decide approach
    const enabledTools = mcpService.getEnabledTools();
    console.log("🔍 Enabled MCP Tools:", enabledTools);

    const classification = await queryClassifier.classifyQuery(
      message,
      0.5,
      enabledTools
    );

    console.log(
      `📊 Classification: ${classification.approach} - ${classification.reasoning}`
    );
    console.log("🔍 Classification details:", classification);

    let result;
    let chunks = [];
    let searchQuery = message;

    // Step 2: Route based on classification
    if (classification.approach === "MCP_TOOLS_ONLY") {
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
        // Fallback to hybrid search if MCP fails
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

export default router;
