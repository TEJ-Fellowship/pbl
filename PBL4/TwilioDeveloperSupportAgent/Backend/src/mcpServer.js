// Backend/src/mcpServer.js
// Simple MCP Server for existing Twilio chat functionality only

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";

class SimpleTwilioMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "twilio-chat-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    // Simple tool for chat context enhancement
    this.server.setRequestHandler(
      {
        method: "tools/list",
      },
      async () => {
        return {
          tools: [
            {
              name: "chat_context_enhancer",
              description:
                "Enhance chat context with additional Twilio information",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "User query to enhance context for",
                  },
                  context: {
                    type: "string",
                    description: "Current conversation context",
                  },
                },
                required: ["query"],
              },
            },
          ],
        };
      }
    );

    // Tool call handler
    this.server.setRequestHandler(
      {
        method: "tools/call",
      },
      async (request) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case "chat_context_enhancer":
              return await this.handleChatContextEnhancer(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                  tool: name,
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  async handleChatContextEnhancer(args) {
    const { query, context = "" } = args;

    try {
      // Simple context enhancement based on query analysis
      const enhancements = this.analyzeQuery(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "chat_context_enhancer",
              enhancements,
              query,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Context enhancement failed: ${error.message}`);
    }
  }

  analyzeQuery(query) {
    const queryLower = query.toLowerCase();
    const enhancements = {
      detectedLanguage: null,
      detectedAPI: null,
      suggestedFocus: "general",
      additionalContext: "",
    };

    // Detect programming language
    if (/\b(python|py|pip|flask|django)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "python";
    } else if (/\b(node|nodejs|npm|express|javascript|js)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "javascript";
    } else if (/\b(php|composer|laravel)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "php";
    } else if (/\b(java|maven|gradle)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "java";
    }

    // Detect API type
    if (/\b(sms|message|text)\b/.test(queryLower)) {
      enhancements.detectedAPI = "sms";
    } else if (/\b(voice|call|phone)\b/.test(queryLower)) {
      enhancements.detectedAPI = "voice";
    } else if (/\b(video|meeting|room)\b/.test(queryLower)) {
      enhancements.detectedAPI = "video";
    } else if (/\b(webhook|callback|notification)\b/.test(queryLower)) {
      enhancements.detectedAPI = "webhook";
    }

    // Suggest focus area
    if (/\b(error|problem|issue|debug)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "debugging";
    } else if (/\b(how to|tutorial|getting started|setup)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "getting_started";
    } else if (/\b(best practice|security|recommendation)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "best_practices";
    }

    // Add contextual suggestions
    if (enhancements.detectedLanguage && enhancements.detectedAPI) {
      enhancements.additionalContext = `Focus on ${enhancements.detectedAPI} API implementation in ${enhancements.detectedLanguage}`;
    }

    return enhancements;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log(
      chalk.green("🚀 Simple Twilio MCP Server started successfully")
    );
  }
}

// Start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith("mcpServer.js")) {
  const server = new SimpleTwilioMCPServer();
  server.start().catch(console.error);
}

export default SimpleTwilioMCPServer;
