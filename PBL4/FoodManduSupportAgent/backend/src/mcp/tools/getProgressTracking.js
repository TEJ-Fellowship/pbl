/**
 * Tool: Get Progress Tracking
 * Returns the progress stages and timeline of an order
 */

import { findOrder, calculateCurrentStage } from "./utils.js";

export const getProgressTracking = {
  name: "get_progress_tracking",
  description: "Get the progress stages and timeline of an order",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to get progress for",
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

      const stages = order.timeline.map((stage) => ({
        id:
          stage.stage === "order_placed"
            ? 1
            : stage.stage === "order_preparing"
            ? 2
            : stage.stage === "order_ready"
            ? 3
            : stage.stage === "on_the_way"
            ? 4
            : 5,
        name:
          stage.stage === "order_placed"
            ? "Order Placed"
            : stage.stage === "order_preparing"
            ? "Order being Prepared"
            : stage.stage === "order_ready"
            ? "Order Ready for Delivery"
            : stage.stage === "on_the_way"
            ? "Order is on the Way"
            : "Order Delivered",
        stage: stage.stage,
        status: stage.status,
        completed: stage.status === "completed",
        timestamp: stage.timestamp,
        description: stage.description,
      }));

      // Calculate current stage if not present or incorrect
      const currentStage = calculateCurrentStage(order);

      return {
        success: true,
        data: {
          orderId: order.orderId,
          currentStage: currentStage,
          elapsedMinutes: order.elapsedMinutes || 0,
          progress: {
            steps: stages,
          },
          timeline: order.timeline,
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
