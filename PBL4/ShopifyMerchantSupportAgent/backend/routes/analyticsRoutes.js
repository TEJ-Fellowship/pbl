import express from "express";
import {
  getAnalyticsDashboard,
  getMerchantSegmentAnalytics,
  getTopQuestionsByIntent,
  getConfidenceTrends,
  clearAnalyticsCache,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Get analytics dashboard data
router.get("/dashboard", getAnalyticsDashboard);

// Get analytics data for a specific merchant segment
router.get("/segment/:segment", getMerchantSegmentAnalytics);

// Get top questions for a specific intent
router.get("/questions/:intent", getTopQuestionsByIntent);

// Get confidence trends over time
router.get("/confidence-trends", getConfidenceTrends);

// Clear analytics cache
router.post("/clear-cache", clearAnalyticsCache);

export default router;
