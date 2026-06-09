/**
 * React Hook for using MCP Tools
 */

import { useState, useCallback } from "react";
import * as mcpClient from "../services/mcpClient.js";

/**
 * Custom hook for MCP tool operations
 */
export const useMCPTools = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callTool = useCallback(async (tool, args = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mcpClient.callTool(tool, args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchCallTools = useCallback(async (calls) => {
    setLoading(true);
    setError(null);
    try {
      const results = await mcpClient.batchCallTools(calls);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    callTool,
    batchCallTools,
    // Convenience methods
    getOrderStatus: useCallback(
      (orderId) => callTool("get_order_status", { orderId }),
      [callTool]
    ),
    getLocationTracking: useCallback(
      (orderId, userLat, userLng) => {
        const args = { orderId };
        if (userLat !== null && userLng !== null) {
          args.userLat = userLat;
          args.userLng = userLng;
        }
        return callTool("get_location_tracking", args);
      },
      [callTool]
    ),
    calculateETA: useCallback(
      (orderId) => callTool("calculate_eta", { orderId }),
      [callTool]
    ),
    getOrderDetails: useCallback(
      (orderId) => callTool("get_order_details", { orderId }),
      [callTool]
    ),
    getDriverInfo: useCallback(
      (orderId) => callTool("get_driver_info", { orderId }),
      [callTool]
    ),
    getProgressTracking: useCallback(
      (orderId) => callTool("get_progress_tracking", { orderId }),
      [callTool]
    ),
    getRouteInfo: useCallback(
      (orderId, userLat, userLng) => {
        const args = { orderId };
        if (userLat !== null && userLng !== null) {
          args.userLat = userLat;
          args.userLng = userLng;
        }
        return callTool("get_route_info", args);
      },
      [callTool]
    ),
    getComprehensiveTracking: useCallback(async (orderId, userLat, userLng) => {
      return await mcpClient.getComprehensiveTracking(
        orderId,
        userLat,
        userLng
      );
    }, []),
  };
};
