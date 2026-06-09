/**
 * Tool: Get Location Tracking
 * Returns the current location of the delivery person
 */

import { findOrder, calculateCurrentStage } from "./utils.js";

export const getLocationTracking = {
  name: "get_location_tracking",
  description: "Get the current location of the delivery person for an order",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to track location for",
      },
      userLat: {
        type: "number",
        description: "Optional: User's current latitude for better tracking",
      },
      userLng: {
        type: "number",
        description: "Optional: User's current longitude for better tracking",
      },
    },
    required: ["orderId"],
  },
  handler: async ({ orderId, userLat, userLng }) => {
    try {
      const order = findOrder(orderId);
      if (!order) {
        return {
          success: false,
          error: "Order not found",
        };
      }

      // Get delivery person location
      let deliveryLat = order.delivery.currentLocation.latitude;
      let deliveryLng = order.delivery.currentLocation.longitude;

      // Add slight movement simulation if on the way
      if (order.status === "on_the_way") {
        const randomOffsetLat = (Math.random() - 0.5) * 0.0002;
        const randomOffsetLng = (Math.random() - 0.5) * 0.0002;
        deliveryLat += randomOffsetLat;
        deliveryLng += randomOffsetLng;
      }

      // Determine destination
      const destinationLat = userLat
        ? parseFloat(userLat)
        : order.customer.deliveryAddress.latitude;
      const destinationLng = userLng
        ? parseFloat(userLng)
        : order.customer.deliveryAddress.longitude;

      return {
        success: true,
        data: {
          orderId: order.orderId,
          deliveryPerson: {
            lat: deliveryLat,
            lng: deliveryLng,
            lastUpdated:
              order.delivery.currentLocation.lastUpdated ||
              new Date().toISOString(),
          },
          destination: {
            lat: destinationLat,
            lng: destinationLng,
          },
          restaurant: {
            lat: order.restaurant.address.latitude,
            lng: order.restaurant.address.longitude,
          },
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
