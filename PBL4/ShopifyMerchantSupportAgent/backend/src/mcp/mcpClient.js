import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * MCP Client for Shopify Merchant Support Agent
 *
 * This client connects to the MCP server and provides a high-level
 * interface for tool execution that maintains backward compatibility
 * with the existing orchestrator interface.
 *
 * Architecture:
 * - Client connects to MCP server via stdio transport
 * - Provides same interface as direct tool calls
 * - Handles protocol overhead transparently
 * - Maintains connection state
 */
class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
    this.serverProcess = null;
  }

  /**
   * Connect to MCP server
   * For in-process communication, we'll use a different approach
   * since stdio requires a separate process. We'll use direct method calls
   * with protocol simulation for now, or HTTP transport.
   *
   * @param {Object} options - Connection options
   */
  async connect(options = {}) {
    try {
      // For in-process communication, we'll use direct server access
      // instead of stdio transport (which requires separate process)
      // This maintains the protocol structure while keeping performance

      if (options.useDirectServer) {
        // Direct server access for in-process (no protocol overhead)
        // This maintains the protocol structure while keeping performance
        const { getMCPServer } = await import("./mcpServer.js");
        this.server = getMCPServer();
        // Ensure server is initialized
        if (!this.server.tools || this.server.tools.size === 0) {
          this.server.initializeTools();
        }
        this.connected = true;
        console.log("🔌 MCP Client: Connected via direct server access");
        return;
      }

      // For true client-server architecture, use stdio transport
      // This requires the server to run as a separate process
      this.client = new Client(
        {
          name: "shopify-merchant-support-agent",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      // Create stdio transport
      // Note: This requires server to be spawned as child process
      if (options.serverCommand) {
        const { spawn } = await import("child_process");
        this.serverProcess = spawn(
          options.serverCommand,
          options.serverArgs || [],
          {
            stdio: ["pipe", "pipe", "pipe"],
          }
        );

        this.transport = new StdioClientTransport({
          command: options.serverCommand,
          args: options.serverArgs || [],
        });
      } else {
        // Use HTTP transport if server URL provided
        if (options.serverUrl) {
          const { SSEClientTransport } = await import(
            "@modelcontextprotocol/sdk/client/sse.js"
          );
          this.transport = new SSEClientTransport(new URL(options.serverUrl));
        } else {
          throw new Error("No transport method specified");
        }
      }

      await this.client.connect(this.transport);
      this.connected = true;
      console.log("🔌 MCP Client: Connected to MCP server");
    } catch (error) {
      console.error("MCP Client connection error:", error);
      throw error;
    }
  }

  /**
   * List available tools
   * @returns {Promise<Array>} Array of available tools
   */
  async listTools() {
    if (!this.connected) {
      throw new Error("Client not connected");
    }

    if (this.server) {
      // Direct server access - call server method directly
      const tools = [];
      for (const [name, tool] of this.server.tools) {
        const toolInfo = tool.getToolInfo
          ? tool.getToolInfo()
          : {
              name: tool.name,
              description: tool.description,
            };
        tools.push({
          name: name,
          description: toolInfo.description || tool.description,
        });
      }
      return { tools };
    }

    // Protocol-based access
    const response = await this.client.request(
      {
        method: "tools/list",
      },
      {}
    );

    return response;
  }

  /**
   * Call a tool via MCP protocol
   * @param {string} toolName - Name of the tool to call
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   */
  async callTool(toolName, args) {
    if (!this.connected) {
      throw new Error("Client not connected");
    }

    if (this.server) {
      // Direct server access - execute tool directly
      // This simulates the protocol but uses direct calls for performance
      const tool = this.server.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const query = args.query || args.text || "";
      let result;

      switch (toolName) {
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
          throw new Error(`Unknown tool: ${toolName}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        isError: false,
      };
    }

    // Protocol-based access via JSON-RPC
    const response = await this.client.request(
      {
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      },
      {}
    );

    // Parse response
    if (response.content && response.content[0]) {
      try {
        const result = JSON.parse(response.content[0].text);
        return result;
      } catch (e) {
        // If not JSON, return as-is
        return {
          summary: response.content[0].text,
          error: response.isError ? "Tool execution failed" : null,
        };
      }
    }

    return {
      error: "Invalid response from tool",
      summary: null,
    };
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
    this.connected = false;
    console.log("🔌 MCP Client: Disconnected");
  }

  /**
   * Check if client is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
let clientInstance = null;

/**
 * Get or create MCP client instance
 * @param {Object} options - Connection options
 * @returns {Promise<MCPClient>} Client instance
 */
export async function getMCPClient(options = {}) {
  if (!clientInstance) {
    clientInstance = new MCPClient();
    // Connect with direct server access by default (in-process)
    await clientInstance.connect({
      useDirectServer: true,
      ...options,
    });
  }
  return clientInstance;
}

export default MCPClient;
