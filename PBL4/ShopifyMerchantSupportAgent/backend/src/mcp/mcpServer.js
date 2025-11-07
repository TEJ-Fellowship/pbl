import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import all tool classes (using default exports)
import CalculatorTool from "./calculatorTool.js";
import WebSearchTool from "./webSearchTool.js";
import ShopifyStatusTool from "./shopifyStatusTool.js";
import DateTimeTool from "./dateTimeTool.js";
import CodeValidatorTool from "./codeValidatorTool.js";
import CurrencyConverterTool from "./currencyConverterTool.js";
import ThemeCompatibilityTool from "./themeCompatibilityTool.js";

/**
 * MCP Server for Shopify Merchant Support Agent Tools
 * 
 * This server implements the Model Context Protocol (MCP) to expose
 * all tools via a standardized protocol interface.
 * 
 * Architecture:
 * - Server registers all tools with MCP protocol
 * - Tools are exposed via JSON-RPC messages
 * - Client connects via stdio transport (in-process)
 * - Maintains backward compatibility with direct tool calls
 */
class MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "shopify-merchant-support-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize all tools
    this.tools = new Map();
    this.initializeTools();

    // Setup request handlers
    this.setupHandlers();
  }

  /**
   * Initialize all tool instances
   */
  initializeTools() {
    this.tools.set("calculator", new CalculatorTool());
    this.tools.set("web_search", new WebSearchTool());
    this.tools.set("shopify_status", new ShopifyStatusTool());
    this.tools.set("date_time", new DateTimeTool());
    this.tools.set("code_validator", new CodeValidatorTool());
    this.tools.set("currency_converter", new CurrencyConverterTool());
    this.tools.set("theme_compatibility", new ThemeCompatibilityTool());

    console.log("🔧 MCP Server: Initialized", this.tools.size, "tools");
  }

  /**
   * Setup MCP protocol request handlers
   */
  setupHandlers() {
    // Handle tools/list request - returns available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];

      for (const [name, tool] of this.tools) {
        // Get tool metadata
        const toolInfo = tool.getToolInfo ? tool.getToolInfo() : {
          name: tool.name,
          description: tool.description,
        };

        // Map tool to MCP tool schema
        const mcpTool = {
          name: name,
          description: toolInfo.description || tool.description,
          inputSchema: this.getToolInputSchema(name, tool),
        };

        tools.push(mcpTool);
      }

      return { tools };
    });

    // Handle tools/call request - executes a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.tools.has(name)) {
        throw new Error(`Tool ${name} not found`);
      }

      const tool = this.tools.get(name);

      try {
        // Execute tool based on its type
        let result;
        const query = args.query || args.text || "";

        switch (name) {
          case "calculator":
            result = await tool.calculate(query);
            break;
          case "web_search":
            const confidence = args.confidence || 0.5;
            result = await tool.search(query, confidence);
            break;
          case "shopify_status":
            result = await tool.checkStatus(query);
            break;
          case "date_time":
            result = await tool.processDateTime(query);
            break;
          case "code_validator":
            result = await tool.validateCode(query);
            break;
          case "currency_converter":
            result = await tool.convert(query);
            break;
          case "theme_compatibility":
            result = await tool.checkCompatibility(query);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Format result as MCP response
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.message,
                operations: [],
                calculations: [],
                validations: [],
                summary: null,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Get input schema for a tool
   * @param {string} toolName - Name of the tool
   * @param {Object} tool - Tool instance
   * @returns {Object} JSON Schema for tool inputs
   */
  getToolInputSchema(toolName, tool) {
    const baseSchema = {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user query or input text",
        },
      },
      required: ["query"],
    };

    // Add tool-specific properties
    switch (toolName) {
      case "web_search":
        baseSchema.properties.confidence = {
          type: "number",
          description: "Confidence score (0-1) for search relevance",
          default: 0.5,
        };
        break;
      case "calculator":
        // Calculator uses query only
        break;
      case "shopify_status":
        // Status tool uses query only
        break;
      case "date_time":
        // Date/time tool uses query only
        break;
      case "code_validator":
        // Code validator uses query only
        break;
      case "currency_converter":
        // Currency converter uses query only
        break;
      case "theme_compatibility":
        // Theme compatibility uses query only
        break;
    }

    return baseSchema;
  }

  /**
   * Start the MCP server
   * @param {Object} transport - Transport layer (stdio, HTTP, etc.)
   */
  async start(transport) {
    await this.server.connect(transport);
    console.log("🚀 MCP Server started and connected");
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    // Cleanup if needed
    console.log("🛑 MCP Server stopped");
  }
}

// Export singleton instance
let serverInstance = null;

/**
 * Get or create MCP server instance
 * @returns {MCPServer} Server instance
 */
export function getMCPServer() {
  if (!serverInstance) {
    serverInstance = new MCPServer();
  }
  return serverInstance;
}

/**
 * Start MCP server with stdio transport (for in-process communication)
 * @returns {Promise<MCPServer>} Server instance
 */
export async function startMCPServer() {
  const server = getMCPServer();
  const transport = new StdioServerTransport();
  await server.start(transport);
  return server;
}

export default MCPServer;

