/**
 * Tool: Get Order Details
 * Returns complete order information
 */

import { findOrder } from "./utils.js";

export const getOrderDetails = {
  name: "get_order_details",
  description:
    "Get complete details of an order including items, customer, and restaurant info",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to get details for",
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

      return {
        success: true,
        data: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            address: order.customer.deliveryAddress,
          },
          restaurant: {
            name: order.restaurant.name,
            phone: order.restaurant.phone,
            address: order.restaurant.address,
          },
          createdAt: order.createdAt,
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
