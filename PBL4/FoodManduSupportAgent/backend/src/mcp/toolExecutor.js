/**
 * Shared Tool Executor
 * 
 * This module provides a unified interface for executing MCP tools.
 * Both the MCP server (stdio/JSON-RPC) and HTTP API use this executor.
 * 
 * This separation ensures:
 * - Single source of truth for tool execution logic
 * - Consistent behavior across MCP and HTTP interfaces
 * - Easy testing and maintenance
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
 * Map of tool names to their handler functions
 */
const toolHandlers = {
  get_order_status: getOrderStatus.handler,
  get_location_tracking: getLocationTracking.handler,
  calculate_eta: calculateETA.handler,
  get_order_details: getOrderDetails.handler,
  get_driver_info: getDriverInfo.handler,
  get_progress_tracking: getProgressTracking.handler,
  get_route_info: getRouteInfo.handler,
  check_weather_delay: checkWeatherDelay.handler,
  validate_address: validateAddress.handler,
  check_payment_status: checkPaymentStatus.handler,
  check_festival_schedule: checkFestivalSchedule.handler,
  suggest_festival_food: suggestFestivalFood.handler,
  get_regional_preferences: getRegionalPreferences.handler,
  web_search_restaurant: webSearchRestaurant.handler,
  get_current_weather: getCurrentWeather.handler,
  suggest_weather_based_food: suggestWeatherBasedFood.handler,
};

/**
 * Execute a tool by name with given arguments
 * 
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments to pass to the tool
 * @returns {Promise<object>} Tool execution result
 */
export async function executeToolHandler(toolName, args = {}) {
  // Special handling for get_all_details (composite tool)
  if (toolName === "get_all_details") {
    return await executeGetAllDetails(args);
  }

  // Get the handler function
  const handler = toolHandlers[toolName];

  if (!handler) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  }

  try {
    // Execute the handler
    const result = await handler(args);
    return result;
  } catch (error) {
    console.error(`❌ Error executing tool ${toolName}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Special handler for get_all_details
 * Calls multiple tools in parallel and aggregates results
 */
async function executeGetAllDetails(args) {
  const { orderId, userLat, userLng } = args;

  if (!orderId) {
    return {
      success: false,
      error: "orderId is required for get_all_details",
    };
  }

  try {
    // Call all tools in parallel
    const [status, location, eta, progress, route, driver] = await Promise.all([
      toolHandlers.get_order_status({ orderId }),
      toolHandlers.get_location_tracking({ orderId, userLat, userLng }),
      toolHandlers.calculate_eta({ orderId }),
      toolHandlers.get_progress_tracking({ orderId }),
      toolHandlers.get_route_info({ orderId, userLat, userLng }),
      toolHandlers.get_driver_info({ orderId })
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
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get list of all available tool names
 */
export function getAvailableToolNames() {
  return Object.keys(toolHandlers);
}

/**
 * Check if a tool exists
 */
export function toolExists(toolName) {
  return toolName === "get_all_details" || toolName in toolHandlers;
}




