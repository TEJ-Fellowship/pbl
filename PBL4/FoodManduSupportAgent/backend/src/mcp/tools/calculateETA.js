/**
 * Tool: Calculate Estimated Time of Arrival
 * Calculates the ETA for order delivery
 */

import { findOrder, calculateCurrentStage } from "./utils.js";

export const calculateETA = {
  name: "calculate_eta",
  description: "Calculate the estimated time of arrival for an order",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to calculate ETA for",
      },
    },
    required: ["orderId"],
  },
  handler: async ({ orderId }) => {
    try {
      const order = findOrder(orderId);
      if (!order) {
        return {
          success: false,
          error: "Order not found",
        };
      }

      const eta = order.currentETA || 0;
      const elapsedMinutes = order.elapsedMinutes || 0;
      const orderPlacedAt = order.createdAt;

      // Calculate estimated delivery time
      const estimatedDeliveryTime = new Date(
        new Date(orderPlacedAt).getTime() + eta * 60 * 1000
      );

      // Calculate current stage if not present
      const currentStage = calculateCurrentStage(order);

      return {
        success: true,
        data: {
          orderId: order.orderId,
          eta: eta,
          elapsedMinutes: elapsedMinutes,
          estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
          orderPlacedAt: orderPlacedAt,
          status: order.status,
          currentStage: currentStage,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
