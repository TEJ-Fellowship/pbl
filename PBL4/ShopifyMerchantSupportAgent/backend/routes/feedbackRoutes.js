import express from "express";
import {
  storeFeedback,
  getFeedbackStats,
  getFeedbackByIntent,
  analyzeFeedbackPatterns,
  getRetrainCandidates,
  triggerAutoRetrain,
  clearFeedbackCache,
} from "../controllers/feedbackController.js";

const router = express.Router();

// Store user feedback
router.post("/store", storeFeedback);

// Get feedback statistics
router.get("/stats", getFeedbackStats);

// Get feedback by intent
router.get("/intent/:intent", getFeedbackByIntent);

// Analyze feedback patterns
router.get("/analyze", analyzeFeedbackPatterns);

// Get retrain candidates
router.get("/retrain-candidates", getRetrainCandidates);

// Trigger auto-retrain
router.post("/auto-retrain", triggerAutoRetrain);

// Clear feedback cache
router.post("/clear-cache", clearFeedbackCache);

export default router;
