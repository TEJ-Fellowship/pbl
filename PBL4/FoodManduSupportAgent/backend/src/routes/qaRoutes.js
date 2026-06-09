import express from "express";
import {
  handleChat,
  getChatHistory,
  healthCheck,
  trackOrder,
  getAllOrders,
  getOrderById,
  getAnalyticsPeakTimes,
  getAnalyticsProblemAreas,
  getAnalyticsOverview,
} from "../controllers/qacontrollers.js";
import { validateChatRequest } from "../middlewares/validateRequest.js";
import {
  callTool,
  listTools,
  batchCallTools,
} from "../controllers/mcpController.js";

const router = express.Router();

// Health check endpoint
router.get("/health", healthCheck); // GET /api/health

// Chat endpoints
router.post("/chat", validateChatRequest, handleChat); // POST /api/chat
router.get("/chat/history", getChatHistory); // GET /api/chat/history

// Order endpoints
router.get("/orders", getAllOrders); // GET /api/orders (get all orders)
router.get("/orders/:orderId", getOrderById); // GET /api/orders/:orderId (get specific order)

// Order tracking endpoint
router.get("/track", trackOrder); // GET /api/track?orderId=123&userLat=27.7&userLng=85.3

// MCP (Model Context Protocol) endpoints
router.get("/mcp/tools", listTools); // GET /api/mcp/tools (list all available tools)
router.post("/mcp/tools/call", callTool); // POST /api/mcp/tools/call (call a single tool)
router.post("/mcp/tools/batch", batchCallTools); // POST /api/mcp/tools/batch (call multiple tools)

// Analytics endpoints
router.get("/analytics/overview", getAnalyticsOverview); // GET /api/analytics/overview?days=7
router.get("/analytics/peak-times", getAnalyticsPeakTimes); // GET /api/analytics/peak-times?days=7
router.get("/analytics/problem-areas", getAnalyticsProblemAreas); // GET /api/analytics/problem-areas?days=7

export default router;
