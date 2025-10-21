import express from "express";
import {
  handleChat,
  getChatHistory,
  healthCheck,
  trackOrder,
  getAllOrders,
  getOrderById,
} from "../controllers/qacontrollers.js";
import { validateChatRequest } from "../middlewares/validateRequest.js";

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

export default router;
