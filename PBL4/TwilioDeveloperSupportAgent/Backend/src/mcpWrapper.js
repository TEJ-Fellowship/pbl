// Backend/src/mcpWrapper.js
// Enhanced MCP-style wrapper for Twilio Developer Support Agent
// Purpose: build structured prompt from context blocks, add weights/prioritization, integrate tools

import WebSearchTool from "./webSearchTool.js";

const DEFAULT_MAX_BLOCKS = 8;

function blockToText(block) {
  // block: { id, type, title, content, metadata, weight }
  return `---BLOCK START---
TYPE: ${block.type}
TITLE: ${block.title || "untitled"}
METADATA: ${JSON.stringify(block.metadata || {})}
CONTENT:
${block.content}
---BLOCK END---`;
}

/**
 * Build a single prompt fragment from the top-weighted context blocks
 * @param {Array} blocks
 * @returns {string}
 */
export function buildContextPrompt(blocks = []) {
  // Sort by weight desc, then keep top K
  const sorted = blocks
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, DEFAULT_MAX_BLOCKS);

  // Join blocks into a single string prompt chunk
  return sorted.map(blockToText).join("\n\n");
}

/**
 * Generate response by composing a structured prompt and calling the provided geminiClient adapter.
 * The geminiClient is expected to have a `generate({ prompt, maxTokens })` method that returns { text }
 */
export async function generateResponse({
  geminiClient,
  query,
  contextBlocks = [],
  instructions = "",
  maxTokens = 1024,
}) {
  const contextPrompt = buildContextPrompt(contextBlocks);

  // Compose final prompt
  const prompt = [
    "You are an expert Twilio developer assistant. Use ONLY the context blocks below to answer.",
    "If the answer is not present in the context, respond concisely and ask for clarification or more info.",
    "Context Blocks (sorted top-first):",
    contextPrompt,
    "Additional Instructions:",
    instructions,
    "User Query:",
    query,
    "Answer:",
  ].join("\n\n");

  // Call existing Gemini function (assumes geminiClient.generate returns { text })
  const response = await geminiClient.generate({
    prompt,
    maxTokens,
  });

  // return whatever the adapter returned (keeps shape flexible)
  return response;
}

/**
 * Enhanced MCP Tool Manager
 */
class MCPToolManager {
  constructor() {
    this.tools = new Map();
    this.webSearchTool = new WebSearchTool();
    this.initializeTools();
  }

  /**
   * Initialize available tools
   */
  initializeTools() {
    this.tools.set("web_search", {
      name: "Web Search",
      description: "Search for recent Twilio updates, issues, and community discussions",
      execute: async (query, options = {}) => {
        return await this.webSearchTool.search(query, options);
      },
    });

    this.tools.set("twilio_updates", {
      name: "Twilio Updates",
      description: "Search for recent Twilio updates and news",
      execute: async (query, options = {}) => {
        return await this.webSearchTool.searchTwilioUpdates(query, options);
      },
    });

    this.tools.set("error_solutions", {
      name: "Error Solutions",
      description: "Search for solutions to specific Twilio error codes",
      execute: async (errorCode, query = "", options = {}) => {
        return await this.webSearchTool.searchErrorSolutions(errorCode, query, options);
      },
    });

    this.tools.set("community_discussions", {
      name: "Community Discussions",
      description: "Search for community discussions and forum posts",
      execute: async (query, options = {}) => {
        return await this.webSearchTool.searchCommunityDiscussions(query, options);
      },
    });
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName, ...args) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    try {
      console.log(`🔧 Executing tool: ${tool.name}`);
      const result = await tool.execute(...args);
      console.log(`✅ Tool '${tool.name}' executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Tool '${tool.name}' failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
    }));
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName) {
    return this.tools.has(toolName);
  }
}

/**
 * Enhanced response generation with tool integration
 */
export async function generateEnhancedResponse({
  geminiClient,
  query,
  contextBlocks = [],
  instructions = "",
  maxTokens = 1024,
  useWebSearch = false,
  toolManager = null,
}) {
  let enhancedContextBlocks = [...contextBlocks];
  let webSearchResults = null;

  // Use web search if enabled and tool manager available
  if (useWebSearch && toolManager) {
    try {
      console.log("🔍 Performing web search for additional context...");
      
      // Determine search strategy based on query
      const errorCodes = extractErrorCodes(query);
      if (errorCodes.length > 0) {
        // Search for error-specific solutions
        webSearchResults = await toolManager.executeTool("error_solutions", errorCodes[0], query);
      } else if (isUpdateQuery(query)) {
        // Search for recent updates
        webSearchResults = await toolManager.executeTool("twilio_updates", query);
      } else {
        // General web search
        webSearchResults = await toolManager.executeTool("web_search", query);
      }

      // Convert web search results to context blocks
      if (webSearchResults && webSearchResults.results && webSearchResults.results.length > 0) {
        const webBlocks = webSearchResults.results.slice(0, 3).map((result, index) => ({
          id: `web_${index}`,
          type: "web_search",
          title: result.title,
          content: `${result.snippet}\n\nSource: ${result.url}`,
          metadata: {
            source: result.source,
            url: result.url,
            relevance: result.relevance,
            timestamp: result.timestamp,
          },
          weight: result.relevance * 0.8, // Slightly lower weight than documentation
        }));

        enhancedContextBlocks.push(...webBlocks);
        console.log(`📊 Added ${webBlocks.length} web search results to context`);
      }
    } catch (error) {
      console.warn("⚠️ Web search failed, continuing without web results:", error.message);
    }
  }

  // Build context prompt with enhanced blocks
  const contextPrompt = buildContextPrompt(enhancedContextBlocks);

  // Compose final prompt
  const prompt = [
    "You are an expert Twilio developer assistant. Use the context blocks below to provide accurate, up-to-date information.",
    "Context includes both official documentation and recent web search results.",
    "If the answer is not present in the context, respond concisely and ask for clarification.",
    "Context Blocks (sorted by relevance):",
    contextPrompt,
    "Additional Instructions:",
    instructions,
    "User Query:",
    query,
    "Answer:",
  ].join("\n\n");

  // Call existing Gemini function
  const response = await geminiClient.generate({
    prompt,
    maxTokens,
  });

  // Add web search metadata to response
  if (webSearchResults) {
    response.webSearchResults = {
      query: webSearchResults.query,
      totalFound: webSearchResults.totalFound,
      resultsUsed: Math.min(3, webSearchResults.results.length),
    };
  }

  return response;
}

/**
 * Extract error codes from query
 */
function extractErrorCodes(query) {
  const errorPatterns = [
    /\b(2\d{4})\b/g, // Twilio error codes
    /\b(3\d{4})\b/g, // HTTP status codes
    /\b(4\d{2})\b/g, // HTTP client errors
    /\b(5\d{2})\b/g, // HTTP server errors
  ];

  const codes = [];
  errorPatterns.forEach((pattern) => {
    const matches = query.match(pattern);
    if (matches) {
      codes.push(...matches);
    }
  });

  return codes;
}

/**
 * Check if query is asking for updates
 */
function isUpdateQuery(query) {
  const updateKeywords = [
    "update", "new", "recent", "latest", "change", "announcement",
    "news", "release", "version", "2024", "2025"
  ];
  
  const queryLower = query.toLowerCase();
  return updateKeywords.some(keyword => queryLower.includes(keyword));
}

// Create global tool manager instance
const toolManager = new MCPToolManager();

// default export for backward compatibility with `import mcp from "./mcpWrapper.js"`
export default {
  buildContextPrompt,
  generateResponse,
  generateEnhancedResponse,
  toolManager,
  MCPToolManager,
};
