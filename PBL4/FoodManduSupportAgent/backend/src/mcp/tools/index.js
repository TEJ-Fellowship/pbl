/**
 * MCP Tools Index
 * Exports all MCP tools for order tracking and support
 */

import { getOrderStatus } from "./getOrderStatus.js";
import { getLocationTracking } from "./getLocationTracking.js";
import { calculateETA } from "./calculateETA.js";
import { getOrderDetails } from "./getOrderDetails.js";
import { getDriverInfo } from "./getDriverInfo.js";
import { getProgressTracking } from "./getProgressTracking.js";
import { getRouteInfo } from "./getRouteInfo.js";
import { checkPaymentStatus } from "./checkPaymentStatus.js";
import { checkWeatherDelay } from "./checkWeatherDelay.js";
import { validateAddress } from "./validateAddress.js";
import { checkFestivalSchedule } from "./checkFestivalSchedule.js";
import { suggestFestivalFood } from "./suggestFestivalFood.js";
import { getRegionalPreferences } from "./getRegionalPreferences.js";
import { webSearchRestaurant } from "./webSearchRestaurant.js";
import { getCurrentWeather } from "./getCurrentWeather.js";
import { suggestWeatherBasedFood } from "./suggestWeatherBasedFood.js";

// Export individual tools
export {
  getOrderStatus,
  getLocationTracking,
  calculateETA,
  getOrderDetails,
  getDriverInfo,
  getProgressTracking,
  getRouteInfo,
  checkPaymentStatus,
  checkWeatherDelay,
  validateAddress,
  checkFestivalSchedule,
  suggestFestivalFood,
  getRegionalPreferences,
  webSearchRestaurant,
  getCurrentWeather,
  suggestWeatherBasedFood,
};

// Export all tools as an array
export const allTools = [
  getOrderStatus,
  getLocationTracking,
  calculateETA,
  getOrderDetails,
  getDriverInfo,
  getProgressTracking,
  getRouteInfo,
  checkPaymentStatus,
  checkWeatherDelay,
  validateAddress,
  checkFestivalSchedule,
  suggestFestivalFood,
  getRegionalPreferences,
  webSearchRestaurant,
  getCurrentWeather,
  suggestWeatherBasedFood,
];
