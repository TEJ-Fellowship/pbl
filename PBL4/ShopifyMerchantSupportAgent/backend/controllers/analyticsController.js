import "dotenv/config";
import { AnalyticsService } from "../src/services/analyticsService.js";

const analyticsService = new AnalyticsService();

/**
 * Get analytics dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      merchantSegment: req.query.merchantSegment,
      intent: req.query.intent,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: analyticsData,
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting analytics dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get analytics data",
      message: error.message,
    });
  }
};

/**
 * Get analytics data for a specific merchant segment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMerchantSegmentAnalytics = async (req, res) => {
  try {
    const { segment } = req.params;
    const filters = {
      merchantSegment: segment,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: analyticsData,
      segment: segment,
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting merchant segment analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get merchant segment analytics",
      message: error.message,
    });
  }
};

/**
 * Get top questions for a specific intent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTopQuestionsByIntent = async (req, res) => {
  try {
    const { intent } = req.params;
    const filters = {
      intent: intent,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: {
        intent: intent,
        topQuestions: analyticsData.topQuestions,
        totalQuestions: analyticsData.totalQuestions,
        intentDistribution: analyticsData.intentDistribution,
      },
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting top questions by intent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get top questions by intent",
      message: error.message,
    });
  }
};

/**
 * Get confidence trends over time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getConfidenceTrends = async (req, res) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      merchantSegment: req.query.merchantSegment,
    };

    // Remove undefined filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const analyticsData = await analyticsService.getAnalyticsData(filters);

    res.json({
      success: true,
      data: {
        confidenceTrends: analyticsData.confidenceTrends,
        sourceEffectiveness: analyticsData.sourceEffectiveness,
      },
      filters: filters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting confidence trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get confidence trends",
      message: error.message,
    });
  }
};

/**
 * Clear analytics cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const clearAnalyticsCache = async (req, res) => {
  try {
    analyticsService.clearCache();

    res.json({
      success: true,
      message: "Analytics cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing analytics cache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear analytics cache",
      message: error.message,
    });
  }
};
