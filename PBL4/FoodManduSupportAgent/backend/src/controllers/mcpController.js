/**
 * MCP Controller
 * Handles HTTP requests for MCP tool calls
 */

import { handleToolCall, getAvailableTools } from "../mcp/server.js";

/**
 * Call an MCP tool
 * POST /api/mcp/tools/call
 */
export const callTool = async (req, res) => {
  try {
    const { tool, args } = req.body;

    if (!tool) {
      return res.status(400).json({
        success: false,
        error: "Tool name is required",
      });
    }

    console.log(`🔧 MCP Tool Call: ${tool}`);
    const result = await handleToolCall(tool, args || {});

    if (result.success) {
      res.status(200).json({
        success: true,
        tool,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        tool,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("❌ Error calling MCP tool:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to execute tool",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Get list of available tools
 * GET /api/mcp/tools
 */
export const listTools = async (req, res) => {
  try {
    const tools = getAvailableTools();

    res.status(200).json({
      success: true,
      tools,
      count: tools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error listing MCP tools:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to list tools",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Batch call multiple tools
 * POST /api/mcp/tools/batch
 */
export const batchCallTools = async (req, res) => {
  try {
    const { calls } = req.body;

    if (!Array.isArray(calls) || calls.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Calls must be a non-empty array",
      });
    }

    const results = await Promise.all(
      calls.map(async ({ tool, args }) => {
        const result = await handleToolCall(tool, args || {});
        return {
          tool,
          success: result.success,
          data: result.data,
          error: result.error,
        };
      })
    );

    res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error in batch tool call:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to execute batch tools",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
