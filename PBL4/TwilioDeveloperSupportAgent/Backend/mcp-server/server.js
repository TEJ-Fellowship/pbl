#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import WebSearchTool from "../src/webSearchTool.js";

class TwilioWebSearchMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "twilio-web-search-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.webSearchTool = new WebSearchTool();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "web_search",
            description: "Search for recent Twilio updates, issues, and community discussions",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to execute",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return (default: 10)",
                  default: 10,
                },
                searchEngines: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["google", "duckduckgo"],
                  },
                  description: "Search engines to use (default: ['google', 'duckduckgo'])",
                  default: ["google", "duckduckgo"],
                },
                includeRecent: {
                  type: "boolean",
                  description: "Whether to prioritize recent results (default: true)",
                  default: true,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "twilio_updates",
            description: "Search specifically for recent Twilio updates and news",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for Twilio updates",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "error_solutions",
            description: "Search for solutions to specific Twilio error codes",
            inputSchema: {
              type: "object",
              properties: {
                errorCode: {
                  type: "string",
                  description: "The Twilio error code to search for",
                },
                query: {
                  type: "string",
                  description: "Additional search context (optional)",
                  default: "",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return (default: 8)",
                  default: 8,
                },
              },
              required: ["errorCode"],
            },
          },
          {
            name: "community_discussions",
            description: "Search for community discussions and forum posts about Twilio",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query for community discussions",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return (default: 6)",
                  default: 6,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_stats",
            description: "Get statistics about the web search tool",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "web_search":
            return await this.handleWebSearch(args);

          case "twilio_updates":
            return await this.handleTwilioUpdates(args);

          case "error_solutions":
            return await this.handleErrorSolutions(args);

          case "community_discussions":
            return await this.handleCommunityDiscussions(args);

          case "search_stats":
            return await this.handleSearchStats();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing tool '${name}': ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleWebSearch(args) {
    const { query, maxResults = 10, searchEngines = ["google", "duckduckgo"], includeRecent = true } = args;
    
    const results = await this.webSearchTool.search(query, {
      maxResults,
      searchEngines,
      includeRecent,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async handleTwilioUpdates(args) {
    const { query, maxResults = 5 } = args;
    
    const results = await this.webSearchTool.searchTwilioUpdates(query, {
      maxResults,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async handleErrorSolutions(args) {
    const { errorCode, query = "", maxResults = 8 } = args;
    
    const results = await this.webSearchTool.searchErrorSolutions(errorCode, query, {
      maxResults,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async handleCommunityDiscussions(args) {
    const { query, maxResults = 6 } = args;
    
    const results = await this.webSearchTool.searchCommunityDiscussions(query, {
      maxResults,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  async handleSearchStats() {
    const stats = this.webSearchTool.getSearchStats();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Twilio Web Search MCP Server running on stdio");
  }
}

// Start the server
const server = new TwilioWebSearchMCPServer();
server.run().catch(console.error);
