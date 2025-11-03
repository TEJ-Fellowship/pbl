/**
 * Tool: Get Order Status
 * Returns the current status of an order
 */

import { findOrder, calculateCurrentStage } from "./utils.js";

export const getOrderStatus = {
  name: "get_order_status",
  description: "Get the current status of an order by order ID",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID or order number to check status for",
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

      const statusMap = {
        order_placed: "Order Placed",
        order_preparing: "Order being Prepared",
        order_ready: "Order Ready for Delivery",
        on_the_way: "Order is on the Way",
        delivered: "Order Delivered",
      };

      // Calculate current stage if not present or incorrect
      const currentStage = calculateCurrentStage(order);

      return {
        success: true,
        data: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          status: statusMap[order.status] || order.status,
          rawStatus: order.status,
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
