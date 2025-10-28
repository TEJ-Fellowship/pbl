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
    this.cacheExpiry = 30 * 1000; // 30 seconds cache for more real-time updates
  }

  /**
   * Clear the analytics cache (useful when new messages are added)
   */
  clearCache() {
    const size = this.analyticsCache.size;
    this.analyticsCache.clear();
    console.log(`🗑️ Cleared analytics cache (${size} entries)`);
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
      // Remove redundant connectDB call - connection should already be established
      // await connectDB();

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
      // Remove redundant connectDB call - connection should already be established
      // await connectDB();

      // Check cache first
      const cacheKey = JSON.stringify(filters);
      console.log(`📊 Cache key for request: ${cacheKey}`);
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        const age = Date.now() - cached.timestamp;
        console.log(
          `📊 Cache hit! Age: ${age}ms (expiry: ${this.cacheExpiry}ms)`
        );
        if (age < this.cacheExpiry) {
          console.log(`📊 Returning cached data`);
          return cached.data;
        } else {
          console.log(`📊 Cache expired, fetching fresh data`);
        }
      } else {
        console.log(`📊 Cache miss, fetching fresh data`);
      }

      // Build query for user messages - these are the actual questions
      const query = { role: "user" };

      if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) {
          query.timestamp.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.timestamp.$lte = new Date(filters.dateTo);
        }
      }

      // Get all user messages (questions)
      const userMessages = await Message.find(query)
        .sort({ timestamp: -1 })
        .populate("conversationId");

      console.log(
        `📊 Found ${userMessages.length} user messages for analytics`
      );

      // Log the most recent user message to see timing
      if (userMessages.length > 0) {
        const mostRecent = userMessages[0];
        console.log(`📊 Most recent user message:`, {
          content: mostRecent.content?.substring(0, 80),
          timestamp: mostRecent.timestamp,
          ageSeconds:
            (Date.now() - new Date(mostRecent.timestamp).getTime()) / 1000,
        });
      }

      // Now get corresponding assistant messages to extract intent and merchant info
      const processedMessages = await Promise.all(
        userMessages.map(async (userMsg, index) => {
          // Find the next assistant message in the same conversation
          // Use limit(1) to ensure we only get ONE assistant message
          const assistantMsg = await Message.findOne({
            conversationId: userMsg.conversationId,
            role: "assistant",
            timestamp: { $gte: userMsg.timestamp },
          })
            .sort({ timestamp: 1 })
            .limit(1)
            .lean();

          // Log first message to see if assistant message is found
          if (index === 0) {
            console.log(
              `📊 Looking for assistant message for user message: "${userMsg.content.substring(
                0,
                50
              )}..."`
            );
            console.log(`📊 Assistant message found: ${!!assistantMsg}`);
            if (assistantMsg) {
              console.log(
                `📊 Assistant message timestamp: ${assistantMsg.timestamp}`
              );
              console.log(
                `📊 Time difference: ${
                  new Date(assistantMsg.timestamp).getTime() -
                  new Date(userMsg.timestamp).getTime()
                }ms`
              );
            }
          }

          // Extract data from assistant message if available
          let rawIntent = assistantMsg?.metadata?.intentClassification?.intent;

          // Debug: Log the full metadata structure for first message
          if (index === 0) {
            console.log(
              `📊 First message metadata keys:`,
              Object.keys(assistantMsg?.metadata || {})
            );
            console.log(
              `📊 First message intentClassification:`,
              assistantMsg?.metadata?.intentClassification
            );
          }

          // Fallback to "general" if not found
          if (!rawIntent) {
            rawIntent = "general";
          }

          // Log intent for first few messages to understand what we're getting
          if (index < 3) {
            console.log(`📊 Message ${index}: Raw intent="${rawIntent}"`);
          }

          // Normalize intent to match frontend expectations
          // The intent classification service returns: setup, troubleshooting, optimization, billing, general
          // But we might also have "general_inquiry" from older data
          let intent = rawIntent;

          // Handle legacy or variant intent names
          if (rawIntent === "general_inquiry") {
            intent = "general";
          } else if (
            rawIntent &&
            ![
              "setup",
              "troubleshooting",
              "optimization",
              "billing",
              "general",
            ].includes(rawIntent.toLowerCase())
          ) {
            // If the intent doesn't match any expected value, log it and default to general
            console.log(
              `⚠️ Unexpected intent value: "${rawIntent}", defaulting to "general"`
            );
            intent = "general";
          }

          // Normalize to lowercase for consistency
          intent = intent.toLowerCase();

          if (index < 3) {
            console.log(`📊 Message ${index}: Final intent="${intent}"`);
          }
          // Extract merchant info from multiTurnContext
          const rawMerchantInfo =
            assistantMsg?.metadata?.multiTurnContext?.userPreferences;
          const merchantInfo = rawMerchantInfo || {
            merchantPlanTier: "unknown",
            storeType: "unknown",
            industry: "unknown",
            experienceLevel: "unknown",
            location: "unknown",
          };

          // Debug merchant info - log first message to understand structure
          if (index === 0) {
            console.log("📊 Extracting merchant info from assistant message");
            console.log(
              "Raw merchant info:",
              JSON.stringify(rawMerchantInfo, null, 2)
            );
          }

          const confidence =
            assistantMsg?.metadata?.intentClassification?.confidence || 0;

          return {
            question: userMsg.content,
            intent: intent,
            merchantInfo: merchantInfo,
            confidence: confidence,
            timestamp: userMsg.timestamp,
            sources: assistantMsg?.metadata?.searchResults || [],
          };
        })
      );

      // Apply merchant segment and intent filters
      let filteredData = processedMessages;

      console.log(
        `📊 Filtering ${processedMessages.length} processed messages`
      );
      console.log(`📊 Filters applied:`, filters);

      // Debug: Show what intents we actually have in the data
      const uniqueIntents = [
        ...new Set(processedMessages.map((m) => m.intent)),
      ];
      console.log(`📊 Unique intents found in data:`, uniqueIntents);

      // Show distribution of intents
      const intentDistribution = {};
      processedMessages.forEach((m) => {
        const intent = m.intent || "general";
        intentDistribution[intent] = (intentDistribution[intent] || 0) + 1;
      });
      console.log(`📊 Intent distribution in data:`, intentDistribution);

      // Show sample of messages with their intents for debugging
      if (processedMessages.length > 0) {
        console.log(
          `📊 Sample processed messages (first 3):`,
          processedMessages.slice(0, 3).map((m) => ({
            question: m.question?.substring(0, 50) || "none",
            intent: m.intent,
            hasMerchantInfo: !!m.merchantInfo,
          }))
        );
      }

      if (filters.merchantSegment) {
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter((item) => {
          const merchantPlanTier =
            item.merchantInfo?.merchantPlanTier || "unknown";
          const matches =
            merchantPlanTier.toLowerCase() ===
            filters.merchantSegment.toLowerCase();
          console.log(
            `📊 Checking merchantPlanTier: ${merchantPlanTier.toLowerCase()} vs ${filters.merchantSegment.toLowerCase()} - ${matches}`
          );
          return matches;
        });
        console.log(
          `📊 Filtered by merchantSegment: ${beforeCount} -> ${filteredData.length}`
        );
      }

      if (filters.intent) {
        const beforeCount = filteredData.length;
        const filterIntent = filters.intent.toLowerCase();
        console.log(`📊 Filtering by intent: "${filterIntent}"`);

        // Debug: Show what intents we have before filtering
        const intentCountsBefore = {};
        filteredData.forEach((item) => {
          const intent = (item.intent || "general").toLowerCase();
          intentCountsBefore[intent] = (intentCountsBefore[intent] || 0) + 1;
        });
        console.log(
          `📊 Intent distribution before filtering:`,
          intentCountsBefore
        );

        let matchCount = 0;
        filteredData = filteredData.filter((item) => {
          const intent = item.intent || "general";
          const itemIntent = intent.toLowerCase();
          const matches = itemIntent === filterIntent;

          // Log sample matches for debugging
          if (matches && matchCount < 3) {
            console.log(
              `📊 ✅ Match ${
                matchCount + 1
              }: "${itemIntent}" === "${filterIntent}" (question: "${
                item.question?.substring(0, 50) || item.question
              }...")`
            );
            matchCount++;
          }

          return matches;
        });
        console.log(
          `📊 Filtered by intent: ${beforeCount} -> ${filteredData.length} messages (looking for "${filterIntent}")`
        );
      }

      console.log(`📊 Final filtered count: ${filteredData.length}`);

      // Debug: Log some sample data
      if (filteredData.length > 0) {
        console.log(
          "📊 Sample filtered data:",
          JSON.stringify(filteredData[0], null, 2)
        );
      }

      // Process data
      const processedData = this.processAnalyticsData(filteredData);

      console.log("📊 Processed data summary:", {
        totalQuestions: processedData.totalQuestions,
        topQuestionsCount: processedData.topQuestions.length,
        intentDistribution: processedData.intentDistribution,
        merchantSegmentInsights: processedData.merchantSegmentInsights
          ? Object.keys(processedData.merchantSegmentInsights.byPlanTier || {})
              .length
          : 0,
        sampleTopQuestion: processedData.topQuestions[0] || "none",
        sampleIntentEntry:
          Object.entries(processedData.intentDistribution || {})[0] || "none",
      });

      // Log detailed debug info
      if (processedData.topQuestions.length > 0) {
        console.log(
          "📊 Sample top questions:",
          processedData.topQuestions.slice(0, 3)
        );
      }

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
    console.log(`📊 Processing analytics data with ${rawData.length} items`);

    const insights = {
      totalQuestions: rawData.length,
      topQuestions: this.getTopQuestions(rawData),
      intentDistribution: this.getIntentDistribution(rawData),
      merchantSegmentInsights: this.getMerchantSegmentInsights(rawData),
      confidenceTrends: this.getConfidenceTrends(rawData),
      sourceEffectiveness: this.getSourceEffectiveness(rawData),
      timeBasedInsights: this.getTimeBasedInsights(rawData),
    };

    console.log(`📊 Processed insights:`, {
      totalQuestions: insights.totalQuestions,
      topQuestionsCount: insights.topQuestions.length,
      intentCount: Object.keys(insights.intentDistribution).length,
    });

    return insights;
  }

  /**
   * Get top questions by frequency
   * @param {Array} data - Analytics data
   * @returns {Array} Top questions with frequency
   */
  getTopQuestions(data) {
    console.log(`📊 getTopQuestions called with ${data.length} items`);
    const questionCounts = {};

    data.forEach((item) => {
      const question = (item.question || "").trim();
      if (question && question.length > 3) {
        // Only count meaningful questions
        // Normalize to lowercase and remove extra whitespace
        const normalizedQuestion = question
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

        if (normalizedQuestion) {
          questionCounts[normalizedQuestion] =
            (questionCounts[normalizedQuestion] || 0) + 1;
        }
      }
    });

    console.log(`📊 Unique questions: ${Object.keys(questionCounts).length}`);

    const result = Object.entries(questionCounts)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log(`📊 Top questions found: ${result.length}`);
    if (result.length > 0) {
      console.log(
        `📊 Top question: "${result[0].question}" (${result[0].count} times)`
      );
      console.log(
        `📊 Top questions summary:`,
        result.map((q) => `${q.count}x: "${q.question.substring(0, 60)}..."`)
      );
    } else {
      console.log("⚠️ No top questions found - checking data...");
      if (data.length > 0) {
        console.log(
          "Sample data items:",
          data.slice(0, 5).map((item) => ({
            hasQuestion: !!item.question,
            questionLength: item.question?.length || 0,
            question: item.question?.substring(0, 80) || "none",
          }))
        );
      } else {
        console.log("⚠️ No data to process for top questions");
      }
    }

    return result;
  }

  /**
   * Get intent distribution
   * @param {Array} data - Analytics data
   * @returns {Object} Intent distribution
   */
  getIntentDistribution(data) {
    console.log(`📊 getIntentDistribution called with ${data.length} items`);
    const intentCounts = {};

    data.forEach((item) => {
      const intent = item.intent || "general";
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    console.log(`📊 Intent distribution:`, intentCounts);
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
      const merchantInfo = item.merchantInfo || {};

      // By plan tier
      const planTier = merchantInfo.merchantPlanTier || "unknown";
      if (!segmentInsights.byPlanTier[planTier]) {
        segmentInsights.byPlanTier[planTier] = { count: 0, intents: {} };
      }
      segmentInsights.byPlanTier[planTier].count++;
      const intent = item.intent || "general_inquiry";
      segmentInsights.byPlanTier[planTier].intents[intent] =
        (segmentInsights.byPlanTier[planTier].intents[intent] || 0) + 1;

      // By store type
      const storeType = merchantInfo.storeType || "unknown";
      if (!segmentInsights.byStoreType[storeType]) {
        segmentInsights.byStoreType[storeType] = { count: 0, intents: {} };
      }
      segmentInsights.byStoreType[storeType].count++;
      segmentInsights.byStoreType[storeType].intents[intent] =
        (segmentInsights.byStoreType[storeType].intents[intent] || 0) + 1;

      // By industry
      const industry = merchantInfo.industry || "unknown";
      if (!segmentInsights.byIndustry[industry]) {
        segmentInsights.byIndustry[industry] = { count: 0, intents: {} };
      }
      segmentInsights.byIndustry[industry].count++;
      segmentInsights.byIndustry[industry].intents[intent] =
        (segmentInsights.byIndustry[industry].intents[intent] || 0) + 1;

      // By experience level
      const experienceLevel = merchantInfo.experienceLevel || "unknown";
      if (!segmentInsights.byExperienceLevel[experienceLevel]) {
        segmentInsights.byExperienceLevel[experienceLevel] = {
          count: 0,
          intents: {},
        };
      }
      segmentInsights.byExperienceLevel[experienceLevel].count++;
      segmentInsights.byExperienceLevel[experienceLevel].intents[intent] =
        (segmentInsights.byExperienceLevel[experienceLevel].intents[intent] ||
          0) + 1;
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
      const confidence = item.confidence || 0;
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
      const intent = item.intent || "general_inquiry";
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
      const sources = item.sources || [];
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
        const score = source.score || 0;
        sourceStats[sourceKey].totalScore += score;
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
