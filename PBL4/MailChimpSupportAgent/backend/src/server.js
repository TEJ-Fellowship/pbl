import express from "express";
import cors from "cors";
import MailChimpFAQInterface from "./faq-interface.js";
import config from "../config/config.js";
import QueryClassifier, {
  classifyQuery,
  detectGreetingOrGeneralQuery,
} from "./utils/queryClassifier.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize FAQ Interface (singleton)
let faqInterface = null;
let isInitializing = false;
let initPromise = null;
let queryClassifier = null;

async function initializeFAQInterface() {
  if (faqInterface) {
    return faqInterface;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      faqInterface = new MailChimpFAQInterface();
      await faqInterface.initialize();
      // Initialize AI-powered classifier (lazy if not already)
      if (!queryClassifier) {
        queryClassifier = new QueryClassifier(null);
      }
      console.log("✅ FAQ Interface initialized successfully");
      return faqInterface;
    } catch (error) {
      console.error("❌ Failed to initialize FAQ Interface:", error);
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

// Helper function to safely save messages with session existence check
async function saveMessageToMemory(sessionId, role, content, metadata = null) {
  if (!faqInterface?.memory || !sessionId) {
    return;
  }

  try {
    // Check if session exists, if not create it
    const exists = await faqInterface.memory.sessionExists(sessionId);
    if (!exists) {
      console.log(`📝 Auto-creating session ${sessionId}...`);
      await faqInterface.memory.createSessionWithId(sessionId, "web-user");
    }

    // Now save the message
    await faqInterface.memory.addMessage(sessionId, role, content, metadata);
  } catch (err) {
    console.log(`⚠️ Failed to save ${role} message to memory: ${err.message}`);
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "MailChimp Support Agent API",
  });
});

// Session initialization/resume endpoint
app.post("/api/session/init", async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    if (!faqInterface) {
      await initializeFAQInterface();
    }

    // If sessionId provided, try to resume or create it
    if (sessionId && faqInterface.memory) {
      const exists = await faqInterface.memory.sessionExists(sessionId);

      if (exists) {
        // Session exists, get stats and resume
        const stats = await faqInterface.memory.getSessionStats(sessionId);
        return res.json({
          status: "success",
          sessionId: sessionId,
          resumed: true,
          messages: stats.messages || 0,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Session doesn't exist, create it in the database with the provided UUID
        console.log(
          `Session ${sessionId} not found, creating it in database...`
        );
        try {
          await faqInterface.memory.createSessionWithId(
            sessionId,
            userId || "web-user"
          );
          console.log(`✅ Created new session: ${sessionId}`);
          return res.json({
            status: "success",
            sessionId: sessionId,
            resumed: false,
            messages: 0,
            timestamp: new Date().toISOString(),
          });
        } catch (createErr) {
          console.error(`❌ Failed to create session: ${createErr.message}`);
          throw createErr;
        }
      }
    }

    // No sessionId provided, shouldn't happen with current frontend
    // but fallback to creating one
    const newSessionId = faqInterface.memory
      ? await faqInterface.memory.createSession(userId || "web-user")
      : null;

    res.json({
      status: "success",
      sessionId: newSessionId,
      resumed: false,
      messages: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error initializing session:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// System status endpoint
app.get("/api/status", async (req, res) => {
  try {
    if (!faqInterface) {
      await initializeFAQInterface();
    }

    const status = {
      gemini: config.GEMINI_API_KEY ? "✅ Connected" : "❌ Missing",
      pinecone: config.PINECONE_API_KEY ? "✅ Connected" : "❌ Missing",
      postgresql: config.DB_NAME ? "✅ Configured" : "❌ Not Configured",
      hybridSearch: faqInterface.hybridSearchAvailable
        ? "✅ Active"
        : "❌ Inactive",
      localChunks: faqInterface.localChunks
        ? faqInterface.localChunks.length
        : 0,
      mcpClient: faqInterface.mcpAvailable ? "✅ Connected" : "❌ Disconnected",
      initialized: !!faqInterface,
    };

    res.json({
      status: "ok",
      system: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Ask question endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Question is required and must be a non-empty string",
      });
    }

    // Initialize if needed
    if (!faqInterface) {
      await initializeFAQInterface();
    }

    console.log(`📨 Received question: "${question}"`);

    // Get or create session ID (used throughout for memory tracking)
    const sessionId = req.body.sessionId || `api-${req.ip}-${Date.now()}`;

    // Save user question to memory
    await saveMessageToMemory(sessionId, "user", question);

    // Classify the query using Gemini if available
    const classification = await classifyQuery(
      question,
      faqInterface.geminiAvailable ? faqInterface.model : null
    );
    console.log(
      `🏷️  Query classified as: ${
        classification.category || "general"
      } (confidence: ${(classification.confidence * 100).toFixed(1)}%)`
    );
    if (classification.reasoning) {
      console.log(`💭 Reasoning: ${classification.reasoning}`);
    }

    // Early greeting/general detection
    const greetingDetection = detectGreetingOrGeneralQuery(question);
    if (
      (greetingDetection.isGreeting ||
        greetingDetection.isGeneralHelpRequest) &&
      !greetingDetection.mailchimpRelated
    ) {
      const name = greetingDetection.extractedName;
      const base =
        name && name.trim()
          ? `Hi ${name}! It's great to hear from you again.`
          : "Hi! Thanks for reaching out.";
      const greetResponse = `${base}\n\nHow can I help you with Mailchimp today?`;

      // Save assistant response to memory
      await saveMessageToMemory(sessionId, "assistant", greetResponse);

      return res.json({
        status: "success",
        response: greetResponse,
        classification: {
          category: "greeting",
          confidence: 1,
          reasoning: "Non-MailChimp greeting/general help",
        },
        sources: [],
        isGreeting: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Use our enhanced AI-powered query classifier to determine the best approach
    let approach = "HYBRID_SEARCH";
    let queryType = "documentation";
    try {
      if (!queryClassifier)
        queryClassifier = new QueryClassifier(
          faqInterface.geminiAvailable ? faqInterface.model : null
        );

      // Get detailed classification with context
      const context = {
        mcpAvailable: faqInterface.mcpAvailable,
        hybridSearchAvailable: faqInterface.hybridSearchAvailable,
        previousClassification: classification,
      };

      const cls = await queryClassifier.classifyQuery(question, 0.5, context);
      approach = cls.approach || "HYBRID_SEARCH";
      queryType = cls.category || "documentation";

      console.log(`🧭 Routing approach: ${approach} (${queryType})`);
      console.log(`💭 Reasoning: ${cls.reasoning || "No reasoning provided"}`);

      // If conversational and not MailChimp-related, ask for clarification
      if (
        cls.approach === "CONVERSATIONAL" &&
        !greetingDetection.mailchimpRelated
      ) {
        const clarification = `I can help with MailChimp-related questions. Could you please specify what you'd like to do in MailChimp? For example: create a campaign, import contacts, set up automation, or view analytics.`;

        // Save assistant response to memory
        await saveMessageToMemory(sessionId, "assistant", clarification);

        return res.json({
          status: "success",
          response: clarification,
          classification: {
            category: queryType,
            confidence: cls.confidence || classification.confidence,
            reasoning:
              cls.reasoning || "Conversational query without MailChimp intent",
            approach: approach,
          },
          sources: [],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log(`⚠️ Query routing fallback: ${e.message}`);
      approach = "HYBRID_SEARCH";
      queryType = "documentation";
    }

    // Process question using the FAQ interface
    let response = "";
    let sources = [];
    let toolUsed = null;
    let confidence = null;

    // Try MCP tools first if available (after classification)
    const shouldTryMCP =
      faqInterface.mcpAvailable &&
      (approach === "MCP_TOOLS_ONLY" || approach === "COMBINED");
    if (shouldTryMCP) {
      try {
        console.log("🔧 Checking if MCP tools can handle this query...");
        const mcpResult = await faqInterface.processWithMCPTools(question);

        if (mcpResult.success) {
          response = mcpResult.response;
          toolUsed = mcpResult.tool;
          confidence = mcpResult.confidence || 0.8;

          // Save assistant response to memory
          await saveMessageToMemory(sessionId, "assistant", response);

          return res.json({
            status: "success",
            response,
            toolUsed,
            confidence,
            classification: {
              category: queryType || classification.category,
              confidence: classification.confidence,
              reasoning: classification.reasoning,
              approach: "MCP_TOOLS_ONLY",
            },
            sources: [],
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.log(`⚠️  MCP processing failed: ${error.message}`);
        console.log("🔄 MCP unavailable/failed, continue with search...");
      }
    }

    // Handle conversational queries with simple responses (no sources)
    if (approach === "CONVERSATIONAL") {
      console.log("💬 Handling as conversational query...");

      // Retrieve recent messages and recalled context for this session
      let recentMessages = [];
      let recalled = [];

      if (faqInterface.memory) {
        try {
          recentMessages = await faqInterface.memory.getRecentMessages(
            sessionId,
            8
          );
          recalled = await faqInterface.memory.recallRelevant(
            sessionId,
            question,
            3
          );
        } catch (err) {
          console.log(`⚠️ Memory retrieval failed: ${err.message}`);
        }
      }

      // Generate conversational response using the unified generateAnswer method
      const conversationalResponse = await faqInterface.generateAnswer(
        question,
        [], // No chunks needed for conversational queries
        {
          recentMessages,
          recalled,
        },
        "conversational", // source type
        "conversational" // queryType
      );

      // Save assistant response to memory
      await saveMessageToMemory(sessionId, "assistant", conversationalResponse);

      return res.json({
        status: "success",
        response: conversationalResponse,
        classification: {
          category: queryType,
          confidence: classification.confidence || 0.9,
          reasoning: "Conversational query - simple response without sources",
          approach: "CONVERSATIONAL",
        },
        sources: [], // No sources for conversational queries
        timestamp: new Date().toISOString(),
      });
    }

    // Semantic/Hybrid search path
    console.log("🔍 Searching knowledge base...");
    const chunks = await faqInterface.searchSimilarChunks(question, 5);

    if (chunks.length === 0) {
      const noResultsResponse = greetingDetection.mailchimpRelated
        ? "I couldn't find specific information about your question in the MailChimp documentation. Please try rephrasing your question or contact MailChimp support for assistance."
        : "Could you please specify your question about MailChimp? For example: How do I create a campaign? How do I import contacts? What's a good open rate?";

      // Save assistant response to memory
      await saveMessageToMemory(sessionId, "assistant", noResultsResponse);

      return res.json({
        status: "success",
        response: noResultsResponse,
        classification: {
          category: queryType || classification.category,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
          approach: approach || "HYBRID_SEARCH",
        },
        sources: [],
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📚 Found ${chunks.length} relevant sources`);

    // Retrieve memory for context-aware responses
    let recentMessages = [];
    let recalled = [];

    if (faqInterface.memory) {
      try {
        recentMessages = await faqInterface.memory.getRecentMessages(
          sessionId,
          8
        );
        recalled = await faqInterface.memory.recallRelevant(
          sessionId,
          question,
          3
        );
      } catch (err) {
        console.log(`⚠️ Memory retrieval failed: ${err.message}`);
      }
    }

    // Generate answer
    console.log("🤖 Generating answer...");
    response = await faqInterface.generateAnswer(
      question,
      chunks,
      {
        recentMessages,
        recalled,
      },
      "docs", // source type - from documentation
      "documentation" // queryType
    );

    // Format sources
    sources = chunks.map((chunk, index) => {
      const metadata = chunk.metadata || {};
      return {
        id: index + 1,
        title: metadata.title || "Untitled",
        heading: metadata.heading || "",
        category: metadata.category || "general",
        difficulty: metadata.difficulty || "intermediate",
        score: ((chunk.score || 0) * 100).toFixed(1) + "%",
        url: metadata.url || null,
      };
    });

    // Save assistant response to memory
    await saveMessageToMemory(sessionId, "assistant", response);

    res.json({
      status: "success",
      response,
      classification: {
        category: queryType || classification.category,
        confidence: classification.confidence,
        approach: approach || "HYBRID_SEARCH",
      },
      sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error processing question:", error);
    res.status(500).json({
      status: "error",
      message:
        error.message || "An error occurred while processing your question",
      timestamp: new Date().toISOString(),
    });
  }
});

// Initialize on startup
initializeFAQInterface()
  .then(() => {
    console.log("🚀 Starting MailChimp Support Agent API server...");
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status: http://localhost:${PORT}/api/status`);
      console.log(`💬 Ask endpoint: http://localhost:${PORT}/api/ask`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  if (faqInterface && faqInterface.mcpClient) {
    faqInterface.mcpClient.cleanup();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  if (faqInterface && faqInterface.mcpClient) {
    faqInterface.mcpClient.cleanup();
  }
  process.exit(0);
});

export default app;
