/**
 * Tool: Get Driver Information
 * Returns driver/delivery person details
 */

import { findOrder } from "./utils.js";

export const getDriverInfo = {
  name: "get_driver_info",
  description:
    "Get information about the driver/delivery person assigned to an order",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to get driver info for",
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

      if (!order.delivery || !order.delivery.driver) {
        return {
          success: false,
          error: "Driver not assigned to this order yet",
        };
      }

      return {
        success: true,
        data: {
          orderId: order.orderId,
          driver: {
            name: order.delivery.driver.name,
            phone: order.delivery.driver.phone,
            vehicle: {
              type: order.delivery.driver.vehicle.type,
              number: order.delivery.driver.vehicle.number,
              model: order.delivery.driver.vehicle.model,
            },
            rating: order.delivery.driver.rating,
            totalDeliveries: order.delivery.driver.totalDeliveries,
          },
          deliveryStatus: order.delivery.status,
          assignedAt: order.delivery.assignedAt,
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
