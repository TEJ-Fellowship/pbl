#!/usr/bin/env node
/**
 * TRUE Model Context Protocol (MCP) Server
 * Implements MCP specification using @modelcontextprotocol/sdk
 * 
 * This server communicates via stdio using JSON-RPC 2.0 protocol
 * and can be connected to Claude Desktop or other MCP clients.
 * 
 * Usage:
 *   node mcpServer.js
 * 
 * Claude Desktop Config:
 *   Add to claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "foodmandu": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/backend/src/mcp/mcpServer.js"]
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import all tool definitions
import { allTools } from "./tools/index.js";

// Import shared tool executor
import { executeToolHandler } from "./toolExecutor.js";

/**
 * Initialize MCP Server
 */
const server = new Server(
  {
    name: "foodmandu-support-agent",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler: List all available tools
 * MCP Request: tools/list
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("📋 MCP Request: tools/list");
  
  // Return tools in MCP format (schema only, no handlers)
  const tools = allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  console.error(`✅ Returning ${tools.length} tools`);
  
  return { tools };
});

/**
 * Handler: Execute a tool
 * MCP Request: tools/call
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.error(`🔧 MCP Request: tools/call - ${name}`);
  console.error(`   Arguments:`, JSON.stringify(args, null, 2));

  try {
    // Find the tool
    const tool = allTools.find((t) => t.name === name);
    
    if (!tool) {
      console.error(`❌ Tool not found: ${name}`);
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute tool using shared executor
    const result = await executeToolHandler(name, args);

    console.error(`✅ Tool executed successfully`);
    console.error(`   Result:`, JSON.stringify(result, null, 2).substring(0, 200));

    // Return result in MCP format
    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      // Handle errors
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: result.error || "Tool execution failed",
              success: false,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    console.error(`❌ Error executing tool ${name}:`, error.message);
    console.error(`   Stack:`, error.stack);
    
    // Return error in MCP format
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message,
            success: false,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the MCP server with stdio transport
 */
async function main() {
  console.error("🚀 Starting TRUE MCP Server for Foodmandu Support Agent");
  console.error("📡 Protocol: Model Context Protocol (JSON-RPC 2.0)");
  console.error("🔌 Transport: stdio (Standard Input/Output)");
  console.error(`📦 Tools available: ${allTools.length}`);
  console.error("");
  console.error("Waiting for MCP client connection...");
  console.error("(Connect via Claude Desktop or MCP Inspector)");
  console.error("");

  // Create stdio transport
  const transport = new StdioServerTransport();
  
  // Connect server to transport
  await server.connect(transport);
  
  console.error("✅ MCP Server connected and ready!");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// Run the server
main().catch((error) => {
  console.error("💥 Fatal error starting MCP server:");
  console.error(error);
  process.exit(1);
});




