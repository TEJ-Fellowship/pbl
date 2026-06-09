/**
 * MCP Client Service
 * Client for interacting with MCP (Model Context Protocol) tools
 */

const MCP_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Get list of available MCP tools
 */
export const getAvailableTools = async () => {
  try {
    const response = await fetch(`${MCP_BASE_URL}/mcp/tools`);
    const result = await response.json();

    if (result.success) {
      return result.tools;
    }
    throw new Error(result.error || "Failed to fetch tools");
  } catch (error) {
    console.error("❌ Error fetching MCP tools:", error);
    throw error;
  }
};

/**
 * Call a single MCP tool
 * @param {string} tool - Tool name
 * @param {object} args - Tool arguments
 */
export const callTool = async (tool, args = {}) => {
  try {
    const response = await fetch(`${MCP_BASE_URL}/mcp/tools/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool, args }),
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || "Tool execution failed");
  } catch (error) {
    console.error(`❌ Error calling tool ${tool}:`, error);
    throw error;
  }
};

/**
 * Call multiple tools in batch
 * @param {Array} calls - Array of {tool, args} objects
 */
export const batchCallTools = async (calls) => {
  try {
    const response = await fetch(`${MCP_BASE_URL}/mcp/tools/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ calls }),
    });

    const result = await response.json();

    if (result.success) {
      return result.results;
    }
    throw new Error(result.error || "Batch tool execution failed");
  } catch (error) {
    console.error("❌ Error in batch tool call:", error);
    throw error;
  }
};

/**
 * Order Tracking Tools - Convenience wrappers
 */

/**
 * Get order status using MCP tool
 */
export const getOrderStatus = async (orderId) => {
  return await callTool("get_order_status", { orderId });
};

/**
 * Get location tracking using MCP tool
 */
export const getLocationTracking = async (
  orderId,
  userLat = null,
  userLng = null
) => {
  const args = { orderId };
  if (userLat !== null && userLng !== null) {
    args.userLat = userLat;
    args.userLng = userLng;
  }
  return await callTool("get_location_tracking", args);
};

/**
 * Calculate ETA using MCP tool
 */
export const calculateETA = async (orderId) => {
  return await callTool("calculate_eta", { orderId });
};

/**
 * Get order details using MCP tool
 */
export const getOrderDetails = async (orderId) => {
  return await callTool("get_order_details", { orderId });
};

/**
 * Get driver information using MCP tool
 */
export const getDriverInfo = async (orderId) => {
  return await callTool("get_driver_info", { orderId });
};

/**
 * Get progress tracking using MCP tool
 */
export const getProgressTracking = async (orderId) => {
  return await callTool("get_progress_tracking", { orderId });
};

/**
 * Get route information using MCP tool
 */
export const getRouteInfo = async (orderId, userLat = null, userLng = null) => {
  const args = { orderId };
  if (userLat !== null && userLng !== null) {
    args.userLat = userLat;
    args.userLng = userLng;
  }
  return await callTool("get_route_info", args);
};

/**
 * Get comprehensive tracking data by combining multiple tools
 */
export const getComprehensiveTracking = async (
  orderId,
  userLat = null,
  userLng = null
) => {
  try {
    // Call multiple tools in parallel
    const [status, location, eta, progress, route, driver] = await Promise.all([
      getOrderStatus(orderId),
      getLocationTracking(orderId, userLat, userLng),
      calculateETA(orderId),
      getProgressTracking(orderId),
      getRouteInfo(orderId, userLat, userLng),
      getDriverInfo(orderId).catch(() => null), // Driver might not be assigned yet
    ]);

    return {
      success: true,
      orderId,
      status,
      location,
      eta,
      progress,
      route,
      driver,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error getting comprehensive tracking:", error);
    throw error;
  }
};
