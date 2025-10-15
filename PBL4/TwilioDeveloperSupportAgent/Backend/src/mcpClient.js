// Backend/src/mcpClient.js
// Simple MCP Client for existing Twilio chat functionality

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import chalk from "chalk";

export class TwilioMCPClient {
  constructor() {
    this.client = null;
    this.tools = new Map();
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log(chalk.blue("🔗 Connecting to MCP server..."));

      // Create transport to connect to our MCP server
      const transport = new StdioClientTransport({
        command: "node",
        args: ["./src/mcpServer.js"],
        cwd: process.cwd(),
      });

      this.client = new Client(
        {
          name: "twilio-chat-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      await this.client.connect(transport);
      this.isConnected = true;

      // List available tools
      const toolsResponse = await this.client.request({
        method: "tools/list",
      });

      // Store tool information
      for (const tool of toolsResponse.tools) {
        this.tools.set(tool.name, tool);
      }

      console.log(chalk.green("🔗 MCP Client connected successfully"));
      console.log(
        chalk.cyan(
          `📋 Available tools: ${Array.from(this.tools.keys()).join(", ")}`
        )
      );

      return true;
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to connect to MCP server:"),
        error.message
      );
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log(chalk.yellow("🔌 MCP Client disconnected"));
    }
  }

  async callTool(toolName, args) {
    if (!this.isConnected) {
      throw new Error("MCP client not connected");
    }

    if (!this.tools.has(toolName)) {
      throw new Error(`Tool '${toolName}' not available`);
    }

    try {
      console.log(chalk.blue(`🔧 Calling MCP tool: ${toolName}`));

      const response = await this.client.request({
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      });

      const result = response.content[0]?.text
        ? JSON.parse(response.content[0].text)
        : response.content;

      console.log(chalk.green(`✅ Tool ${toolName} executed successfully`));

      return {
        success: true,
        toolName,
        result,
        isError: response.isError || false,
      };
    } catch (error) {
      console.error(chalk.red(`❌ Tool ${toolName} failed:`), error.message);
      return {
        success: false,
        toolName,
        error: error.message,
        isError: true,
      };
    }
  }

  // MCP Tool methods
  async enhanceChatContext(query, context = "") {
    return await this.callTool("enhance_chat_context", {
      query,
      context,
    });
  }

  async validateTwilioCode(code, language = "javascript") {
    return await this.callTool("validate_twilio_code", {
      code,
      language,
    });
  }

  async lookupErrorCode(errorCode) {
    return await this.callTool("lookup_error_code", {
      errorCode,
    });
  }

  async detectProgrammingLanguage(text) {
    return await this.callTool("detect_programming_language", {
      text,
    });
  }

  async webSearch(query, maxResults = 5) {
    return await this.callTool("web_search", {
      query,
      maxResults,
    });
  }

  getAvailableTools() {
    return Array.from(this.tools.keys());
  }

  isToolAvailable(toolName) {
    return this.tools.has(toolName);
  }
}
