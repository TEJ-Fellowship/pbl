/**
 * MCP Server HTTP Wrapper
 * Exposes MCP tools via HTTP endpoints for web client access
 */

import {
  getOrderStatus,
  getLocationTracking,
  calculateETA,
  getOrderDetails,
  getDriverInfo,
  getProgressTracking,
  getRouteInfo,
  checkWeatherDelay,
  validateAddress,
  checkPaymentStatus,
  checkFestivalSchedule,
  suggestFestivalFood,
  getRegionalPreferences,
  webSearchRestaurant,
  getCurrentWeather,
  suggestWeatherBasedFood,
} from "./tools/index.js";

/**
 * Handle MCP tool call via HTTP
 */
export const handleToolCall = async (toolName, args) => {
  try {
    let result;

    // Handle comprehensive tracking (calls multiple tools)
    if (toolName === "get_all_details") {
      const { orderId, userLat, userLng } = args;

      // Call all tools in parallel
      const [status, location, eta, progress, route, driver] =
        await Promise.all([
          getOrderStatus.handler({ orderId }),
          getLocationTracking.handler({ orderId, userLat, userLng }),
          calculateETA.handler({ orderId }),
          getProgressTracking.handler({ orderId }),
          getRouteInfo.handler({ orderId, userLat, userLng }),
          getDriverInfo
            .handler({ orderId })
            .catch(() => ({ success: false, data: null })),
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
    }

    switch (toolName) {
      case "get_order_status":
        result = await getOrderStatus.handler(args);
        break;
      case "get_location_tracking":
        result = await getLocationTracking.handler(args);
        break;
      case "calculate_eta":
        result = await calculateETA.handler(args);
        break;
      case "get_order_details":
        result = await getOrderDetails.handler(args);
        break;
      case "get_driver_info":
        result = await getDriverInfo.handler(args);
        break;
      case "get_progress_tracking":
        result = await getProgressTracking.handler(args);
        break;
      case "get_route_info":
        result = await getRouteInfo.handler(args);
        break;
      case "check_weather_delay":
        result = await checkWeatherDelay.handler(args);
        break;
      case "validate_address":
        result = await validateAddress.handler(args);
        break;
      case "check_payment_status":
        result = await checkPaymentStatus.handler(args);
        break;
      case "check_festival_schedule":
        result = await checkFestivalSchedule.handler(args);
        break;
      case "suggest_festival_food":
        result = await suggestFestivalFood.handler(args);
        break;
      case "get_regional_preferences":
        result = await getRegionalPreferences.handler(args);
        break;
      case "web_search_restaurant":
        result = await webSearchRestaurant.handler(args);
        break;
      case "get_current_weather":
        result = await getCurrentWeather.handler(args);
        break;
      case "suggest_weather_based_food":
        result = await suggestWeatherBasedFood.handler(args);
        break;
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }

    return result;
  } catch (error) {
    console.error(`❌ Error executing tool ${toolName}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all available tools metadata
 */
export const getAvailableTools = () => {
  return [
    {
      name: "get_order_status",
      description: "Get the current status of an order by order ID",
      inputSchema: getOrderStatus.inputSchema,
    },
    {
      name: "get_location_tracking",
      description:
        "Get the current location of the delivery person for an order",
      inputSchema: getLocationTracking.inputSchema,
    },
    {
      name: "calculate_eta",
      description: "Calculate the estimated time of arrival for an order",
      inputSchema: calculateETA.inputSchema,
    },
    {
      name: "get_order_details",
      description:
        "Get complete details of an order including items, customer, and restaurant info",
      inputSchema: getOrderDetails.inputSchema,
    },
    {
      name: "get_driver_info",
      description:
        "Get information about the driver/delivery person assigned to an order",
      inputSchema: getDriverInfo.inputSchema,
    },
    {
      name: "get_progress_tracking",
      description: "Get the progress stages and timeline of an order",
      inputSchema: getProgressTracking.inputSchema,
    },
    {
      name: "get_route_info",
      description:
        "Get route information including coordinates and estimated distance for an order",
      inputSchema: getRouteInfo.inputSchema,
    },
    {
      name: "check_weather_delay",
      description:
        "Check current weather conditions in Kathmandu and estimate potential delivery delays",
      inputSchema: checkWeatherDelay.inputSchema,
    },
    {
      name: "validate_address",
      description: "Validate if an address is within Kathmandu Valley delivery coverage",
      inputSchema: validateAddress.inputSchema,
    },
    {
      name: "check_payment_status",
      description: "Check the status of payment gateways (eSewa, Khalti)",
      inputSchema: checkPaymentStatus.inputSchema,
    },
    {
      name: "check_festival_schedule",
      description:
        "Check if current or specified date is during a Nepali festival with expected high order volumes",
      inputSchema: checkFestivalSchedule.inputSchema,
    },
    {
      name: "suggest_festival_food",
      description:
        "Suggest traditional Nepali festival foods based on festival name or regional preferences",
      inputSchema: suggestFestivalFood.inputSchema,
    },
    {
      name: "get_regional_preferences",
      description:
        "Get food preferences, typical orders, and cultural insights for specific regions in Nepal",
      inputSchema: getRegionalPreferences.inputSchema,
    },
    {
      name: "web_search_restaurant",
      description:
        "Search for restaurant information including menu, reviews, hours, and ratings",
      inputSchema: webSearchRestaurant.inputSchema,
    },
    {
      name: "get_current_weather",
      description:
        "Get current weather information including temperature, condition, humidity, precipitation, and wind speed",
      inputSchema: getCurrentWeather.inputSchema,
    },
    {
      name: "suggest_weather_based_food",
      description:
        "Suggest food and cuisine types based on current weather conditions, temperature, and time of day",
      inputSchema: suggestWeatherBasedFood.inputSchema,
    },
  ];
};
