import "dotenv/config";
import { connectDB } from "../../config/db.js";
import Feedback from "../../models/Feedback.js";
import Message from "../../models/Message.js";

/**
 * Feedback Service for Shopify Merchant Support Agent
 * Handles feedback collection, analysis, and auto-retrain mechanisms
 */
export class FeedbackService {
  constructor() {
    this.feedbackCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Store user feedback for a message
   * @param {Object} feedbackData - Feedback data
   * @returns {Object} Stored feedback with analysis
   */
  async storeFeedback(feedbackData) {
    try {
      // Remove redundant connectDB call - connection should already be established
      // await connectDB();

      const {
        messageId,
        sessionId,
        conversationId,
        feedback,
        rating,
        comment,
        query,
        answer,
        intent,
        confidence,
        sources,
        mcpTools,
        merchantInfo,
        processingTime,
        modelUsed,
      } = feedbackData;

      // Create feedback document
      const feedbackDoc = new Feedback({
        messageId,
        sessionId,
        conversationId,
        feedback,
        rating,
        comment,
        query,
        answer,
        intent,
        confidence,
        sources,
        mcpTools,
        merchantInfo,
        processingTime,
        modelUsed,
      });

      // Analyze feedback
      feedbackDoc.analyzeFeedback();
      feedbackDoc.determineRetrainFlags();

      // Save to database
      await feedbackDoc.save();

      console.log(`📝 Stored feedback: ${feedback} for message ${messageId}`);

      // Update message with feedback
      await Message.findByIdAndUpdate(messageId, {
        $set: {
          "metadata.feedback": {
            type: feedback,
            rating: rating,
            comment: comment,
            timestamp: new Date(),
          },
        },
      });

      return {
        success: true,
        feedback: feedbackDoc,
        analysis: feedbackDoc.feedbackAnalysis,
        retrainFlags: feedbackDoc.retrainFlags,
      };
    } catch (error) {
      console.error("Error storing feedback:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get feedback statistics
   * @param {Object} filters - Filters for statistics
   * @returns {Object} Feedback statistics
   */
  async getFeedbackStats(filters = {}) {
    try {
      await connectDB();

      // Check cache first
      const cacheKey = JSON.stringify(filters);
      if (this.feedbackCache.has(cacheKey)) {
        const cached = this.feedbackCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const stats = await Feedback.getFeedbackStats(filters);

      // Cache the result
      this.feedbackCache.set(cacheKey, {
        data: stats,
        timestamp: Date.now(),
      });

      return stats;
    } catch (error) {
      console.error("Error getting feedback stats:", error);
      return {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        avgRating: 0,
        avgConfidence: 0,
        needsRetrain: 0,
      };
    }
  }

  /**
   * Get feedback by intent
   * @param {string} intent - Intent to filter by
   * @param {number} limit - Maximum number of results
   * @returns {Array} Feedback data
   */
  async getFeedbackByIntent(intent, limit = 100) {
    try {
      await connectDB();
      return await Feedback.getFeedbackByIntent(intent, limit);
    } catch (error) {
      console.error("Error getting feedback by intent:", error);
      return [];
    }
  }

  /**
   * Get feedback requiring retraining
   * @param {string} priority - Minimum priority level
   * @returns {Array} Retrain candidates
   */
  async getRetrainCandidates(priority = "medium") {
    try {
      await connectDB();
      return await Feedback.getRetrainCandidates(priority);
    } catch (error) {
      console.error("Error getting retrain candidates:", error);
      return [];
    }
  }

  /**
   * Analyze feedback patterns for insights
   * @param {Object} filters - Filters for analysis
   * @returns {Object} Analysis insights
   */
  async analyzeFeedbackPatterns(filters = {}) {
    try {
      await connectDB();

      const pipeline = [
        { $match: filters },
        {
          $group: {
            _id: {
              intent: "$intent",
              feedback: "$feedback",
            },
            count: { $sum: 1 },
            avgConfidence: { $avg: "$confidence.score" },
            avgRating: { $avg: "$rating" },
            needsRetrain: {
              $sum: {
                $cond: [{ $eq: ["$retrainFlags.needsRetrain", true] }, 1, 0],
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id.intent",
            feedbackBreakdown: {
              $push: {
                feedback: "$_id.feedback",
                count: "$count",
                avgConfidence: "$avgConfidence",
                avgRating: "$avgRating",
                needsRetrain: "$needsRetrain",
              },
            },
            totalCount: { $sum: "$count" },
            totalRetrain: { $sum: "$needsRetrain" },
          },
        },
        {
          $project: {
            intent: "$_id",
            feedbackBreakdown: 1,
            totalCount: 1,
            totalRetrain: 1,
            retrainRate: { $divide: ["$totalRetrain", "$totalCount"] },
          },
        },
        { $sort: { totalCount: -1 } },
      ];

      const patterns = await Feedback.aggregate(pipeline);

      // Analyze patterns for insights
      const insights = {
        patterns: patterns,
        recommendations: [],
        criticalIssues: [],
        improvementAreas: [],
      };

      patterns.forEach((pattern) => {
        const negativeFeedback = pattern.feedbackBreakdown.find(
          (f) => f.feedback === "negative"
        );
        const positiveFeedback = pattern.feedbackBreakdown.find(
          (f) => f.feedback === "positive"
        );

        // Identify critical issues
        if (pattern.retrainRate > 0.3) {
          insights.criticalIssues.push({
            intent: pattern.intent,
            retrainRate: pattern.retrainRate,
            issue: "High retrain rate indicates systematic problems",
          });
        }

        // Identify improvement areas
        if (
          negativeFeedback &&
          negativeFeedback.count > positiveFeedback?.count
        ) {
          insights.improvementAreas.push({
            intent: pattern.intent,
            negativeCount: negativeFeedback.count,
            positiveCount: positiveFeedback?.count || 0,
            issue: "More negative than positive feedback",
          });
        }

        // Generate recommendations
        if (pattern.retrainRate > 0.2) {
          insights.recommendations.push({
            intent: pattern.intent,
            recommendation:
              "Consider retraining retrieval weights for this intent",
            priority: "high",
          });
        }

        if (negativeFeedback && negativeFeedback.avgConfidence < 0.5) {
          insights.recommendations.push({
            intent: pattern.intent,
            recommendation: "Improve confidence scoring for this intent",
            priority: "medium",
          });
        }
      });

      return insights;
    } catch (error) {
      console.error("Error analyzing feedback patterns:", error);
      return {
        patterns: [],
        recommendations: [],
        criticalIssues: [],
        improvementAreas: [],
      };
    }
  }

  /**
   * Auto-retrain mechanism based on feedback
   * @param {Object} retrainConfig - Retraining configuration
   * @returns {Object} Retraining results
   */
  async autoRetrain(retrainConfig = {}) {
    try {
      await connectDB();

      const {
        priority = "medium",
        maxCandidates = 50,
        retrainThreshold = 0.2,
      } = retrainConfig;

      // Get retrain candidates
      const candidates = await this.getRetrainCandidates(priority);

      if (candidates.length === 0) {
        return {
          success: true,
          message: "No retrain candidates found",
          candidatesProcessed: 0,
        };
      }

      // Analyze candidates
      const retrainGroups = {
        low_confidence: candidates.filter(
          (c) => c.retrainFlags.retrainReason === "low_confidence"
        ),
        negative_feedback: candidates.filter(
          (c) => c.retrainFlags.retrainReason === "negative_feedback"
        ),
        source_quality: candidates.filter(
          (c) => c.retrainFlags.retrainReason === "source_quality"
        ),
        intent_mismatch: candidates.filter(
          (c) => c.retrainFlags.retrainReason === "intent_mismatch"
        ),
      };

      // Process retraining for each group
      const retrainResults = {
        low_confidence: await this.retrainConfidenceScoring(
          retrainGroups.low_confidence
        ),
        negative_feedback: await this.retrainRetrievalWeights(
          retrainGroups.negative_feedback
        ),
        source_quality: await this.retrainSourceRanking(
          retrainGroups.source_quality
        ),
        intent_mismatch: await this.retrainIntentClassification(
          retrainGroups.intent_mismatch
        ),
      };

      // Mark candidates as processed
      const candidateIds = candidates.map((c) => c._id);
      await Feedback.updateMany(
        { _id: { $in: candidateIds } },
        {
          $set: {
            "retrainFlags.needsRetrain": false,
            "retrainFlags.processedAt": new Date(),
          },
        }
      );

      console.log(
        `🔄 Auto-retrain completed: ${candidates.length} candidates processed`
      );

      return {
        success: true,
        candidatesProcessed: candidates.length,
        retrainResults: retrainResults,
        message: "Auto-retrain completed successfully",
      };
    } catch (error) {
      console.error("Error in auto-retrain:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrain confidence scoring based on low confidence feedback
   * @param {Array} candidates - Low confidence candidates
   * @returns {Object} Retraining results
   */
  async retrainConfidenceScoring(candidates) {
    // Simulate confidence scoring retraining
    // In a real implementation, this would adjust confidence scoring parameters
    console.log(
      `🎯 Retraining confidence scoring for ${candidates.length} candidates`
    );

    return {
      method: "confidence_scoring",
      candidatesProcessed: candidates.length,
      adjustments: {
        thresholdAdjustment: 0.05,
        weightAdjustments: {
          crossEncoder: 0.35,
          entityMatching: 0.25,
          sourceQuality: 0.2,
          completeness: 0.15,
          intentConfidence: 0.05,
        },
      },
    };
  }

  /**
   * Retrain retrieval weights based on negative feedback
   * @param {Array} candidates - Negative feedback candidates
   * @returns {Object} Retraining results
   */
  async retrainRetrievalWeights(candidates) {
    // Simulate retrieval weight retraining
    // In a real implementation, this would adjust retrieval weights
    console.log(
      `🔍 Retraining retrieval weights for ${candidates.length} candidates`
    );

    return {
      method: "retrieval_weights",
      candidatesProcessed: candidates.length,
      adjustments: {
        semanticWeight: 0.75,
        keywordWeight: 0.25,
        diversityBoost: 0.2,
        minRelevanceScore: 0.15,
      },
    };
  }

  /**
   * Retrain source ranking based on source quality issues
   * @param {Array} candidates - Source quality candidates
   * @returns {Object} Retraining results
   */
  async retrainSourceRanking(candidates) {
    // Simulate source ranking retraining
    // In a real implementation, this would adjust source ranking weights
    console.log(
      `📚 Retraining source ranking for ${candidates.length} candidates`
    );

    return {
      method: "source_ranking",
      candidatesProcessed: candidates.length,
      adjustments: {
        sourceWeights: {
          api_admin_graphql: 1.1,
          api_admin_rest: 1.1,
          helpcenter: 0.9,
          forum: 0.7,
        },
      },
    };
  }

  /**
   * Retrain intent classification based on intent mismatch
   * @param {Array} candidates - Intent mismatch candidates
   * @returns {Object} Retraining results
   */
  async retrainIntentClassification(candidates) {
    // Simulate intent classification retraining
    // In a real implementation, this would adjust intent classification parameters
    console.log(
      `🎯 Retraining intent classification for ${candidates.length} candidates`
    );

    return {
      method: "intent_classification",
      candidatesProcessed: candidates.length,
      adjustments: {
        keywordWeights: {
          setup: 1.2,
          troubleshooting: 1.1,
          optimization: 1.0,
          billing: 1.1,
        },
        confidenceThreshold: 0.7,
      },
    };
  }

  /**
   * Clear feedback cache
   */
  clearCache() {
    this.feedbackCache.clear();
  }
}

export default FeedbackService;
