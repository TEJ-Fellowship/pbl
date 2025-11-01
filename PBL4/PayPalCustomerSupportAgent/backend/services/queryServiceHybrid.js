const MCPToolsService = require("../../mcp-server/serviceAdapter.cjs");
const QueryRouter = require("./QueryRouter.js");
const { handleGeneralQuery } = require("./handlers/generalHandler.js");
const { handleMCPOnlyQuery } = require("./handlers/mcpOnlyHandler.js");
const {
  handleDocumentationOnlyQuery,
} = require("./handlers/documentationOnlyHandler.js");
const { handleHybridQuery } = require("./handlers/hybridHandler.js");
const { getChatHistory, pool } = require("./chat/chatHistory.js");
const { PINECONE_INDEX } = require("./config/constants.js");

/**
 * Main query handler - routes queries based on classification
 */
async function handleQuery(query, sessionId) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Connect to PostgreSQL (if needed)
  let dbClient = null;

  try {
    // STEP 1: Classify query using AI router
    console.log("🔍 Classifying query...");
    const queryRouter = new QueryRouter(genAI);
    const chatHistory = sessionId ? await getChatHistory(sessionId, 5) : [];
    const classification = await queryRouter.classify(query, {
      sessionHistory: chatHistory,
    });

    console.log(
      "📊 Classification result:",
      JSON.stringify(classification, null, 2)
    );
    console.log(`🎯 Query Type: ${classification.query_type}`);
    console.log(
      `🏷️ Issue Type: ${
        classification.primary_issue_type || classification.issue_type
      }`
    );

    // STEP 2: Route to appropriate handler based on query_type
    switch (classification.query_type) {
      case "general": {
        // General knowledge query - no searches needed
        console.log("🌐 Routing to general knowledge handler");
        return await handleGeneralQuery(query, genAI, sessionId);
      }

      case "mcp_only": {
        // MCP tools only - skip hybrid search
        console.log("🔧 Routing to MCP-only handler");
        const mcpTools = new MCPToolsService();
        return await handleMCPOnlyQuery(
          query,
          classification,
          genAI,
          mcpTools,
          sessionId
        );
      }

      case "documentation_only": {
        // Hybrid search only - skip MCP tools
        console.log("📚 Routing to documentation-only handler");
        const { Pinecone } = await import("@pinecone-database/pinecone");
        const { pipeline } = await import("@xenova/transformers");

        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });
        const index = pinecone.index(PINECONE_INDEX);
        const embedder = await pipeline(
          "feature-extraction",
          "Xenova/all-mpnet-base-v2"
        );

        dbClient = await pool.connect();
        return await handleDocumentationOnlyQuery(
          query,
          classification,
          genAI,
          embedder,
          index,
          dbClient,
          sessionId
        );
      }

      case "hybrid": {
        // Both MCP tools and hybrid search
        console.log("🔄 Routing to hybrid handler");
        const { Pinecone } = await import("@pinecone-database/pinecone");
        const { pipeline } = await import("@xenova/transformers");

        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });
        const index = pinecone.index(PINECONE_INDEX);
        const embedder = await pipeline(
          "feature-extraction",
          "Xenova/all-mpnet-base-v2"
        );

        dbClient = await pool.connect();
        const mcpTools = new MCPToolsService();
        return await handleHybridQuery(
          query,
          classification,
          genAI,
          mcpTools,
          embedder,
          index,
          dbClient,
          sessionId
        );
      }

      default: {
        // Fallback to general if unknown query type
        console.log("⚠️ Unknown query type, routing to general handler");
        return await handleGeneralQuery(query, genAI, sessionId);
      }
    }
  } catch (error) {
    console.error("Error in handleQuery:", error);
    return {
      answer:
        "I'm sorry, I encountered an error processing your request. Please try again or contact PayPal support.",
      sentiment: { sentiment: "neutral", confidence: "low" },
    };
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
}

module.exports = { handleQuery };
