import "dotenv/config";
import { FeedbackService } from "../src/services/feedbackService.js";

const feedbackService = new FeedbackService();

/**
 * Store user feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const storeFeedback = async (req, res) => {
  try {
    const { messageId, sessionId, conversationId, feedback, rating, comment } =
      req.body;

    if (!messageId || !sessionId || !conversationId || !feedback) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: messageId, sessionId, conversationId, feedback",
      });
    }

    // Get message data for context
    const Message = (await import("../models/Message.js")).default;
    const message = await Message.findById(messageId).populate(
      "conversationId"
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found",
      });
    }

    // Prepare feedback data
    const feedbackData = {
      messageId,
      sessionId,
      conversationId,
      feedback,
      rating,
      comment,
      query: message.content,
      answer: message.metadata?.answer || message.content,
      intent:
        message.metadata?.intentClassification?.intent || "general_inquiry",
      confidence: message.metadata?.confidence || {
        score: 0,
        level: "Unknown",
        factors: [],
      },
      sources: message.metadata?.searchResults || [],
      mcpTools: message.metadata?.mcpTools || {
        toolsUsed: [],
        toolResults: {},
      },
      merchantInfo: message.metadata?.multiTurnContext?.userPreferences || {},
      processingTime: message.metadata?.processingTime || 0,
      modelUsed: message.metadata?.modelUsed || "unknown",
    };

    const result = await feedbackService.storeFeedback(feedbackData);

    if (result.success) {
      res.json({
        success: true,
        message: "Feedback stored successfully",
        feedback: result.feedback,
        analysis: result.analysis,
        retrainFlags: result.retrainFlags,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error storing feedback:", error);
    res.status(500).json({
      success: false,
      error: "Failed to store feedback",
      message: error.message,
    });
  }
};

/**
 * Get feedback statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFeedbackStats = async (req, res) => {
  try {
    const filters = {
      createdAt: {
        $gte: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
        $lte: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
      },
      intent: req.query.intent,
      feedback: req.query.feedback,
      "merchantInfo.planTier": req.query.merchantSegment,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const stats = await feedbackService.getFeedbackStats(filters);

    res.json({
      success: true,
      data: stats,
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback statistics",
      message: error.message,
    });
  }
};

/**
 * Get feedback by intent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFeedbackByIntent = async (req, res) => {
  try {
    const { intent } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const feedback = await feedbackService.getFeedbackByIntent(intent, limit);

    res.json({
      success: true,
      data: feedback,
      intent: intent,
      limit: limit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting feedback by intent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get feedback by intent",
      message: error.message,
    });
  }
};

/**
 * Analyze feedback patterns
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const analyzeFeedbackPatterns = async (req, res) => {
  try {
    const filters = {
      createdAt: {
        $gte: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
        $lte: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
      },
      "merchantInfo.planTier": req.query.merchantSegment,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const analysis = await feedbackService.analyzeFeedbackPatterns(filters);

    res.json({
      success: true,
      data: analysis,
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error analyzing feedback patterns:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze feedback patterns",
      message: error.message,
    });
  }
};

/**
 * Get retrain candidates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRetrainCandidates = async (req, res) => {
  try {
    const priority = req.query.priority || "medium";

    const candidates = await feedbackService.getRetrainCandidates(priority);

    res.json({
      success: true,
      data: candidates,
      priority: priority,
      count: candidates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting retrain candidates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get retrain candidates",
      message: error.message,
    });
  }
};

/**
 * Trigger auto-retrain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const triggerAutoRetrain = async (req, res) => {
  try {
    const retrainConfig = {
      priority: req.body.priority || "medium",
      maxCandidates: req.body.maxCandidates || 50,
      retrainThreshold: req.body.retrainThreshold || 0.2,
    };

    const result = await feedbackService.autoRetrain(retrainConfig);

    if (result.success) {
      res.json({
        success: true,
        message: "Auto-retrain completed successfully",
        data: result,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error triggering auto-retrain:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trigger auto-retrain",
      message: error.message,
    });
  }
};

/**
 * Clear feedback cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const clearFeedbackCache = async (req, res) => {
  try {
    feedbackService.clearCache();

    res.json({
      success: true,
      message: "Feedback cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing feedback cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear feedback cache",
      message: error.message,
    });
  }
};
