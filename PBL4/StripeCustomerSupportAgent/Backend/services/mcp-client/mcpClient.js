import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * MCP Client - Connects to MCP server via stdio transport
 */
class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.availableTools = [];
  }

  /**
   * Initialize and connect to MCP server
   * @param {Object} serverConfig - {command, args, env}
   * @returns {Promise<boolean>}
   */
  async initialize(serverConfig) {
    try {
      console.log("🔌 [MCPClient] Initializing...");
      console.log("📋 [MCPClient] Server command:", serverConfig.command);
      console.log(
        "📋 [MCPClient] Server args:",
        JSON.stringify(serverConfig.args || [])
      );

      this.client = new Client(
        {
          name: "stripe-support-agent",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      this.transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env || {},
      });

      console.log("🔌 [MCPClient] Connecting to server...");
      console.log(
        "📋 [MCPClient] Full command:",
        `${serverConfig.command} ${(serverConfig.args || []).join(" ")}`
      );

      await this.client.connect(this.transport);
      console.log("✅ [MCPClient] Connected successfully");

      console.log("📋 [MCPClient] Requesting tools list...");
      const toolsList = await this.client.listTools();
      this.availableTools = toolsList.tools || [];
      console.log(
        `📋 [MCPClient] Available tools (${
          this.availableTools.length
        }): ${this.availableTools.map((t) => t.name).join(", ")}`
      );

      if (this.availableTools.length === 0) {
        console.warn("⚠️ [MCPClient] No tools available from server!");
      }

      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("❌ [MCPClient] Connection failed:", error.message);
      console.error("❌ [MCPClient] Error stack:", error.stack);
      console.error("❌ [MCPClient] Server config:", {
        command: serverConfig.command,
        args: serverConfig.args,
        hasEnv: !!serverConfig.env,
      });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Call an MCP tool
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>}
   */
  async callTool(toolName, args = {}) {
    if (!this.isConnected || !this.client) {
      throw new Error("MCP client not connected");
    }

    try {
      console.log(`🔧 [MCPClient] Calling tool: ${toolName}`);
      console.log(`📤 [MCPClient] Arguments:`, JSON.stringify(args, null, 2));

      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      console.log(`✅ [MCPClient] Tool call successful`);
      console.log(
        `📥 [MCPClient] Response items: ${
          Array.isArray(result.content) ? result.content.length : "N/A"
        }`
      );

      // Parse the JSON response from MCP server
      let parsedResult = null;
      if (result.content && result.content.length > 0) {
        const textContent = result.content[0]?.text;
        if (textContent) {
          try {
            parsedResult = JSON.parse(textContent);
            console.log(`📥 [MCPClient] Parsed result:`, {
              success: parsedResult.success,
              hasResults: !!parsedResult.results,
              confidence: parsedResult.confidence,
            });
          } catch (e) {
            parsedResult = { text: textContent };
          }
        }
      }

      return {
        success: !result.isError,
        content: result.content,
        parsedResult: parsedResult,
        isError: result.isError || false,
      };
    } catch (error) {
      console.error(`❌ [MCPClient] Tool call failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        content: null,
        parsedResult: null,
      };
    }
  }

  /**
   * Get list of available tools
   * @returns {Array}
   */
  getAvailableTools() {
    return this.availableTools.map((tool) => tool.name);
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      try {
        await this.client.close();
        console.log("🔌 [MCPClient] Connection closed");
      } catch (error) {
        console.error("❌ [MCPClient] Close error:", error.message);
      }
    }
    this.isConnected = false;
  }
}

export default MCPClient;
