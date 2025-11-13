/**
 * MCP Server HTTP Wrapper
 * Exposes MCP tools via HTTP endpoints for web client access
 * 
 * NOTE: This is the HTTP interface. For TRUE MCP (stdio/JSON-RPC),
 * see mcpServer.js which implements the Model Context Protocol spec.
 */

import { allTools } from "./tools/index.js";
import { executeToolHandler } from "./toolExecutor.js";

/**
 * Handle MCP tool call via HTTP
 * Uses shared tool executor for consistency with MCP server
 */
export const handleToolCall = async (toolName, args) => {
  try {
    // Use shared executor
    const result = await executeToolHandler(toolName, args);
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
