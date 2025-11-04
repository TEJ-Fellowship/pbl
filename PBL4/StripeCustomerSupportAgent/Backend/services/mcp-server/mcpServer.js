import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import CalculatorTool from "../mcp-tools/calculatorTool.js";
import StatusCheckerTool from "../mcp-tools/statusCheckerTool.js";
import WebSearchTool from "../mcp-tools/webSearchTool.js";
import CodeValidatorTool from "../mcp-tools/codeValidatorTool.js";
import DateTimeTool from "../mcp-tools/dateTimeTool.js";
import CurrencyConverterTool from "../mcp-tools/currencyConverterTool.js";

/**
 * MCP Server - Exposes tools via Model Context Protocol
 * Runs as standalone server process using stdio transport
 */
class MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "stripe-support-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.setupTools();
    this.setupHandlers();
  }

  /**
   * Initialize tool instances
   */
  setupTools() {
    console.log("🔧 [MCPServer] Setting up tools...");

    this.tools.set("calculator", new CalculatorTool());
    this.tools.set("status_checker", new StatusCheckerTool());
    this.tools.set("web_search", new WebSearchTool());
    this.tools.set("code_validator", new CodeValidatorTool());
    this.tools.set("datetime", new DateTimeTool());
    this.tools.set("currency_converter", new CurrencyConverterTool());

    console.log(`✅ [MCPServer] Initialized ${this.tools.size} tools`);
  }

  /**
   * Setup MCP protocol handlers
   */
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log("📋 [MCPServer] tools/list called");

      const toolList = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "User query to process",
            },
          },
          required: ["query"],
        },
      }));

      console.log(`📤 [MCPServer] Returning ${toolList.length} tools`);
      return { tools: toolList };
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`🔧 [MCPServer] tools/call received for: ${name}`);
      console.log(`📥 [MCPServer] Arguments:`, JSON.stringify(args, null, 2));

      const tool = this.tools.get(name);
      if (!tool) {
        console.error(`❌ [MCPServer] Tool not found: ${name}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Tool '${name}' not found`,
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        const query = args?.query || "";
        console.log(`🚀 [MCPServer] Executing tool: ${name}`);
        console.log(`📥 [MCPServer] Query: "${query.substring(0, 60)}..."`);

        const result = await tool.execute(query);

        console.log(`✅ [MCPServer] Tool execution completed`);
        console.log(`📥 [MCPServer] Result:`, {
          success: result.success,
          hasResults: !!result.results,
          confidence: result.confidence,
          messageLength: result.message?.length || 0,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
          isError: !result.success,
        };
      } catch (error) {
        console.error(`❌ [MCPServer] Tool execution error:`, error.message);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start() {
    console.log("🚀 [MCPServer] Starting MCP server...");

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log("✅ [MCPServer] MCP server started and ready");
    console.log(
      "📋 [MCPServer] Available tools:",
      Array.from(this.tools.keys()).join(", ")
    );
  }
}

// Start server if run directly (check if this is the main module)
const isMainModule =
  process.argv[1] &&
  (process.argv[1].includes("mcpServer.js") ||
    import.meta.url === `file://${process.argv[1]}`);

if (isMainModule) {
  const server = new MCPServer();
  server.start().catch((error) => {
    console.error("❌ [MCPServer] Failed to start:", error);
    process.exit(1);
  });
}

export default MCPServer;
