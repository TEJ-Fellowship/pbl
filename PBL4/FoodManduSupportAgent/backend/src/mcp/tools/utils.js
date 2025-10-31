/**
 * Shared utility functions for MCP tools
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load orders from JSON file
 * @returns {Array} Array of orders
 */
export const loadOrders = () => {
  try {
    const ordersPath = path.join(__dirname, "../../dummy data/orders.json");
    const ordersData = fs.readFileSync(ordersPath, "utf8");
    return JSON.parse(ordersData);
  } catch (error) {
    console.error("❌ Error loading orders:", error.message);
    return [];
  }
};

/**
 * Find an order by ID or order number
 * @param {string} orderId - Order ID or order number
 * @returns {Object|null} Order object or null if not found
 */
export const findOrder = (orderId) => {
  const orders = loadOrders();
  return orders.find((o) => o.orderId === orderId || o.orderNumber === orderId);
};

/**
 * Calculate current stage from order status/timeline
 * @param {Object} order - Order object
 * @returns {number} Current stage (0-4)
 */
export const calculateCurrentStage = (order) => {
  // If currentStage is already set and valid, use it
  if (
    order.currentStage !== undefined &&
    order.currentStage !== null &&
    order.currentStage >= 0
  ) {
    return order.currentStage;
  }

  // Calculate from status
  const statusStageMap = {
    order_placed: 0,
    order_preparing: 1,
    order_ready: 2,
    on_the_way: 3,
    delivered: 4,
  };

  if (order.status && statusStageMap.hasOwnProperty(order.status)) {
    return statusStageMap[order.status];
  }

  // Calculate from timeline - find the first in_progress or last completed stage
  if (order.timeline && Array.isArray(order.timeline)) {
    let highestCompleted = -1;
    let inProgressStage = -1;

    order.timeline.forEach((stage, index) => {
      const stageMap = {
        order_placed: 0,
        order_preparing: 1,
        order_ready: 2,
        on_the_way: 3,
        delivered: 4,
      };

      const stageNum = stageMap[stage.stage] ?? -1;

      if (stage.status === "completed" && stageNum > highestCompleted) {
        highestCompleted = stageNum;
      }
      if (stage.status === "in_progress" && stageNum > -1) {
        inProgressStage = stageNum;
      }
    });

    // If there's an in-progress stage, use it
    if (inProgressStage > -1) {
      return inProgressStage;
    }

    // Otherwise, use the next stage after highest completed
    if (highestCompleted >= 0 && highestCompleted < 4) {
      return highestCompleted + 1;
    }

    return highestCompleted >= 0 ? highestCompleted : 0;
  }

  // Default fallback
  return 0;
};
