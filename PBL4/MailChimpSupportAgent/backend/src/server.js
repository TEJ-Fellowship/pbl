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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "MailChimp Support Agent API",
  });
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
      const name = greetingDetection.extractedName || null;
      const base = name
        ? `Hey ${name}! Thanks for reaching out.`
        : "Hey! Thanks for reaching out.";
      const greetResponse = `${base}\nHow can I help you today? Please specify your question about MailChimp so I can assist you better.\n\nFor example:\n• How do I create a campaign?\n• How do I import contacts?\n• What's a good open rate?\n• How do I set up automation?`;
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

    // Semantic/Hybrid search path
    console.log("🔍 Searching knowledge base...");
    const chunks = await faqInterface.searchSimilarChunks(question, 5);

    if (chunks.length === 0) {
      return res.json({
        status: "success",
        response: greetingDetection.mailchimpRelated
          ? "I couldn't find specific information about your question in the MailChimp documentation. Please try rephrasing your question or contact MailChimp support for assistance."
          : "Could you please specify your question about MailChimp? For example: How do I create a campaign? How do I import contacts? What's a good open rate?",
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

    // Generate answer
    console.log("🤖 Generating answer...");
    response = await faqInterface.generateAnswer(question, chunks);

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
      };
    });

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
