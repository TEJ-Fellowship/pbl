import "dotenv/config";
import { connectDB } from "../../config/db.js";
import Message from "../../models/Message.js";
import Conversation from "../../models/Conversation.js";

/**
 * Analytics Service for Shopify Merchant Support Agent
 * Tracks most-asked questions by merchant segment and generates insights
 */
export class AnalyticsService {
  constructor() {
    this.analyticsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Track a question and its context for analytics
   * @param {string} question - The user's question
   * @param {string} intent - Classified intent
   * @param {Object} merchantInfo - Merchant information
   * @param {string} sessionId - Session identifier
   * @param {number} confidence - Confidence score
   * @param {Array} sources - Sources used for the answer
   */
  async trackQuestion(
    question,
    intent,
    merchantInfo,
    sessionId,
    confidence,
    sources
  ) {
    try {
      await connectDB();

      // Create analytics document
      const analyticsDoc = {
        question: question,
        intent: intent,
        merchantInfo: {
          planTier: merchantInfo.merchantPlanTier || "unknown",
          storeType: merchantInfo.storeType || "unknown",
          industry: merchantInfo.industry || "unknown",
          experienceLevel: merchantInfo.experienceLevel || "unknown",
          location: merchantInfo.location || "unknown",
        },
        sessionId: sessionId,
        confidence: confidence,
        sources: sources.map((s) => ({
          title: s.title,
          category: s.category,
          score: s.score,
        })),
        timestamp: new Date(),
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      };

      // Store in MongoDB (you might want to create a separate Analytics model)
      // For now, we'll store it in the Message model with a special type
      const analyticsMessage = new Message({
        conversationId: null, // Analytics messages don't belong to conversations
        role: "analytics",
        content: JSON.stringify(analyticsDoc),
        metadata: {
          type: "analytics_tracking",
          question: question,
          intent: intent,
          merchantInfo: analyticsDoc.merchantInfo,
          confidence: confidence,
        },
      });

      await analyticsMessage.save();
      console.log(`📊 Tracked question: ${question} (${intent})`);
    } catch (error) {
      console.error("Error tracking question for analytics:", error);
    }
  }

  /**
   * Get analytics data for the dashboard
   * @param {Object} filters - Filters for the analytics (date range, merchant segment, etc.)
   * @returns {Object} Analytics data
   */
  async getAnalyticsData(filters = {}) {
    try {
      await connectDB();

      // Check cache first
      const cacheKey = JSON.stringify(filters);
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      // Build query
      const query = { "metadata.type": "analytics_tracking" };

      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) {
          query.timestamp.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.timestamp.$lte = new Date(filters.dateTo);
        }
      }

      if (filters.merchantSegment) {
        query["metadata.merchantInfo.planTier"] = filters.merchantSegment;
      }

      if (filters.intent) {
        query["metadata.intent"] = filters.intent;
      }

      // Get analytics data
      const analyticsData = await Message.find(query).sort({ timestamp: -1 });

      // Process data
      const processedData = this.processAnalyticsData(analyticsData);

      // Cache the result
      this.analyticsCache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now(),
      });

      return processedData;
    } catch (error) {
      console.error("Error getting analytics data:", error);
      return this.getDefaultAnalyticsData();
    }
  }

  /**
   * Process raw analytics data into insights
   * @param {Array} rawData - Raw analytics data from MongoDB
   * @returns {Object} Processed analytics data
   */
  processAnalyticsData(rawData) {
    const insights = {
      totalQuestions: rawData.length,
      topQuestions: this.getTopQuestions(rawData),
      intentDistribution: this.getIntentDistribution(rawData),
      merchantSegmentInsights: this.getMerchantSegmentInsights(rawData),
      confidenceTrends: this.getConfidenceTrends(rawData),
      sourceEffectiveness: this.getSourceEffectiveness(rawData),
      timeBasedInsights: this.getTimeBasedInsights(rawData),
    };

    return insights;
  }

  /**
   * Get top questions by frequency
   * @param {Array} data - Analytics data
   * @returns {Array} Top questions with frequency
   */
  getTopQuestions(data) {
    const questionCounts = {};

    data.forEach((item) => {
      const question = item.metadata.question.toLowerCase().trim();
      questionCounts[question] = (questionCounts[question] || 0) + 1;
    });

    return Object.entries(questionCounts)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get intent distribution
   * @param {Array} data - Analytics data
   * @returns {Object} Intent distribution
   */
  getIntentDistribution(data) {
    const intentCounts = {};

    data.forEach((item) => {
      const intent = item.metadata.intent;
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    return intentCounts;
  }

  /**
   * Get merchant segment insights
   * @param {Array} data - Analytics data
   * @returns {Object} Merchant segment insights
   */
  getMerchantSegmentInsights(data) {
    const segmentInsights = {
      byPlanTier: {},
      byStoreType: {},
      byIndustry: {},
      byExperienceLevel: {},
    };

    data.forEach((item) => {
      const merchantInfo = item.metadata.merchantInfo;

      // By plan tier
      const planTier = merchantInfo.planTier;
      if (!segmentInsights.byPlanTier[planTier]) {
        segmentInsights.byPlanTier[planTier] = { count: 0, intents: {} };
      }
      segmentInsights.byPlanTier[planTier].count++;
      segmentInsights.byPlanTier[planTier].intents[item.metadata.intent] =
        (segmentInsights.byPlanTier[planTier].intents[item.metadata.intent] ||
          0) + 1;

      // By store type
      const storeType = merchantInfo.storeType;
      if (!segmentInsights.byStoreType[storeType]) {
        segmentInsights.byStoreType[storeType] = { count: 0, intents: {} };
      }
      segmentInsights.byStoreType[storeType].count++;
      segmentInsights.byStoreType[storeType].intents[item.metadata.intent] =
        (segmentInsights.byStoreType[storeType].intents[item.metadata.intent] ||
          0) + 1;

      // By industry
      const industry = merchantInfo.industry;
      if (!segmentInsights.byIndustry[industry]) {
        segmentInsights.byIndustry[industry] = { count: 0, intents: {} };
      }
      segmentInsights.byIndustry[industry].count++;
      segmentInsights.byIndustry[industry].intents[item.metadata.intent] =
        (segmentInsights.byIndustry[industry].intents[item.metadata.intent] ||
          0) + 1;

      // By experience level
      const experienceLevel = merchantInfo.experienceLevel;
      if (!segmentInsights.byExperienceLevel[experienceLevel]) {
        segmentInsights.byExperienceLevel[experienceLevel] = {
          count: 0,
          intents: {},
        };
      }
      segmentInsights.byExperienceLevel[experienceLevel].count++;
      segmentInsights.byExperienceLevel[experienceLevel].intents[
        item.metadata.intent
      ] =
        (segmentInsights.byExperienceLevel[experienceLevel].intents[
          item.metadata.intent
        ] || 0) + 1;
    });

    return segmentInsights;
  }

  /**
   * Get confidence trends
   * @param {Array} data - Analytics data
   * @returns {Object} Confidence trends
   */
  getConfidenceTrends(data) {
    const trends = {
      averageConfidence: 0,
      confidenceDistribution: {
        high: 0, // > 0.8
        medium: 0, // 0.5 - 0.8
        low: 0, // < 0.5
      },
      confidenceByIntent: {},
    };

    let totalConfidence = 0;

    data.forEach((item) => {
      const confidence = item.metadata.confidence || 0;
      totalConfidence += confidence;

      // Distribution
      if (confidence > 0.8) {
        trends.confidenceDistribution.high++;
      } else if (confidence >= 0.5) {
        trends.confidenceDistribution.medium++;
      } else {
        trends.confidenceDistribution.low++;
      }

      // By intent
      const intent = item.metadata.intent;
      if (!trends.confidenceByIntent[intent]) {
        trends.confidenceByIntent[intent] = { total: 0, count: 0 };
      }
      trends.confidenceByIntent[intent].total += confidence;
      trends.confidenceByIntent[intent].count++;
    });

    trends.averageConfidence =
      data.length > 0 ? totalConfidence / data.length : 0;

    // Calculate averages for each intent
    Object.keys(trends.confidenceByIntent).forEach((intent) => {
      const intentData = trends.confidenceByIntent[intent];
      trends.confidenceByIntent[intent] = intentData.total / intentData.count;
    });

    return trends;
  }

  /**
   * Get source effectiveness
   * @param {Array} data - Analytics data
   * @returns {Object} Source effectiveness data
   */
  getSourceEffectiveness(data) {
    const sourceStats = {};

    data.forEach((item) => {
      const sources = item.metadata.sources || [];
      sources.forEach((source) => {
        const sourceKey = `${source.category}_${source.title}`;
        if (!sourceStats[sourceKey]) {
          sourceStats[sourceKey] = {
            title: source.title,
            category: source.category,
            usageCount: 0,
            averageScore: 0,
            totalScore: 0,
          };
        }
        sourceStats[sourceKey].usageCount++;
        sourceStats[sourceKey].totalScore += source.score;
        sourceStats[sourceKey].averageScore =
          sourceStats[sourceKey].totalScore / sourceStats[sourceKey].usageCount;
      });
    });

    return Object.values(sourceStats)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 20);
  }

  /**
   * Get time-based insights
   * @param {Array} data - Analytics data
   * @returns {Object} Time-based insights
   */
  getTimeBasedInsights(data) {
    const timeInsights = {
      byHour: {},
      byDay: {},
      byWeek: {},
    };

    data.forEach((item) => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const week = this.getWeekNumber(date);

      // By hour
      timeInsights.byHour[hour] = (timeInsights.byHour[hour] || 0) + 1;

      // By day
      timeInsights.byDay[day] = (timeInsights.byDay[day] || 0) + 1;

      // By week
      timeInsights.byWeek[week] = (timeInsights.byWeek[week] || 0) + 1;
    });

    return timeInsights;
  }

  /**
   * Get week number from date
   * @param {Date} date - Date object
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get default analytics data when no data is available
   * @returns {Object} Default analytics data
   */
  getDefaultAnalyticsData() {
    return {
      totalQuestions: 0,
      topQuestions: [],
      intentDistribution: {},
      merchantSegmentInsights: {
        byPlanTier: {},
        byStoreType: {},
        byIndustry: {},
        byExperienceLevel: {},
      },
      confidenceTrends: {
        averageConfidence: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        confidenceByIntent: {},
      },
      sourceEffectiveness: [],
      timeBasedInsights: {
        byHour: {},
        byDay: {},
        byWeek: {},
      },
    };
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.analyticsCache.clear();
  }
}

export default AnalyticsService;
