/**
 * Tool: Get Route Information
 * Returns route details including road route coordinates
 */

import { findOrder } from "./utils.js";

export const getRouteInfo = {
  name: "get_route_info",
  description:
    "Get route information including coordinates and estimated distance for an order",
  inputSchema: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "The order ID to get route info for",
      },
      userLat: {
        type: "number",
        description: "Optional: User's current latitude",
      },
      userLng: {
        type: "number",
        description: "Optional: User's current longitude",
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

      const restaurantLat = order.restaurant.address.latitude;
      const restaurantLng = order.restaurant.address.longitude;

      const destinationLat = userLat
        ? parseFloat(userLat)
        : order.customer.deliveryAddress.latitude;
      const destinationLng = userLng
        ? parseFloat(userLng)
        : order.customer.deliveryAddress.longitude;

      // Fetch road route from OSRM
      let roadRoute = null;
      try {
        const routeResponse = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${restaurantLng},${restaurantLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`
        );
        const routeData = await routeResponse.json();

        if (
          routeData.code === "Ok" &&
          routeData.routes &&
          routeData.routes[0]
        ) {
          const routeCoords = routeData.routes[0].geometry.coordinates;
          roadRoute = routeCoords.map((coord) => [coord[1], coord[0]]);
        }
      } catch (error) {
        console.error("❌ Error fetching road route:", error.message);
      }

      return {
        success: true,
        data: {
          orderId: order.orderId,
          route: {
            origin: {
              lat: restaurantLat,
              lng: restaurantLng,
              name: order.restaurant.name,
            },
            destination: {
              lat: destinationLat,
              lng: destinationLng,
            },
            roadRoute: roadRoute,
            estimatedDistance: order.delivery?.estimatedDistance || null,
            estimatedDuration: order.delivery?.estimatedDuration || null,
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
