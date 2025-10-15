import {
  format,
  isAfter,
  isBefore,
  addDays,
  subDays,
  parseISO,
} from "date-fns";

/**
 * Date/Time Tool for Time-Aware Stripe Queries
 * Handles time-sensitive queries and provides temporal context
 */
class DateTimeTool {
  constructor() {
    this.name = "datetime";
    this.description = "Provide time-aware context for Stripe queries";
    this.timezone = "UTC";
  }

  /**
   * Execute date/time analysis
   * @param {string} query - User query
   * @returns {Object} - Time analysis with confidence score
   */
  async execute(query) {
    try {
      console.log(`⏰ DateTime Tool: Processing "${query}"`);

      const analysis = this.analyzeTimeContext(query);
      const confidence = this.calculateConfidence(analysis);

      return {
        success: true,
        result: analysis,
        confidence,
        message: this.generateResponse(analysis, query),
      };
    } catch (error) {
      console.error("❌ DateTime Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Analyze time context from query
   * @param {string} query - User query
   * @returns {Object} - Time analysis
   */
  analyzeTimeContext(query) {
    const now = new Date();
    const analysis = {
      currentTime: now,
      timeReferences: this.extractTimeReferences(query),
      businessHours: this.checkBusinessHours(now),
      timezoneContext: this.getTimezoneContext(),
      temporalRelevance: this.assessTemporalRelevance(query, now),
      formattedTime: this.formatTimeContext(now),
    };

    return analysis;
  }

  /**
   * Extract time references from query
   * @param {string} query - User query
   * @returns {Array} - Array of time references
   */
  extractTimeReferences(query) {
    const timeRefs = [];
    const queryLower = query.toLowerCase();

    // Relative time references
    const relativePatterns = [
      { pattern: /now|currently|right now/, type: "current", value: "now" },
      { pattern: /today/, type: "day", value: "today" },
      { pattern: /yesterday/, type: "day", value: "yesterday" },
      { pattern: /tomorrow/, type: "day", value: "tomorrow" },
      { pattern: /this week/, type: "week", value: "this_week" },
      { pattern: /last week/, type: "week", value: "last_week" },
      { pattern: /this month/, type: "month", value: "this_month" },
      { pattern: /last month/, type: "month", value: "last_month" },
    ];

    relativePatterns.forEach(({ pattern, type, value }) => {
      if (pattern.test(queryLower)) {
        timeRefs.push({ type, value, confidence: 0.9 });
      }
    });

    // Specific time patterns
    const specificPatterns = [
      { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, type: "time" },
      { pattern: /(\d{1,2})\s*(am|pm)/i, type: "time" },
      { pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/, type: "date" },
      {
        pattern:
          /january|february|march|april|may|june|july|august|september|october|november|december/i,
        type: "month",
      },
    ];

    specificPatterns.forEach(({ pattern, type }) => {
      const matches = query.match(pattern);
      if (matches) {
        timeRefs.push({ type, value: matches[0], confidence: 0.8 });
      }
    });

    return timeRefs;
  }

  /**
   * Check if current time is within business hours
   * @param {Date} date - Current date
   * @returns {Object} - Business hours analysis
   */
  checkBusinessHours(date) {
    const hour = date.getUTCHours();
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday

    const isWeekday = day >= 1 && day <= 5; // Monday to Friday
    const isBusinessHours = hour >= 9 && hour <= 17; // 9 AM to 5 PM UTC

    return {
      isBusinessHours: isWeekday && isBusinessHours,
      isWeekday,
      hour,
      day,
      nextBusinessDay: this.getNextBusinessDay(date),
      businessHoursStart: this.getBusinessHoursStart(date),
      businessHoursEnd: this.getBusinessHoursEnd(date),
    };
  }

  /**
   * Get timezone context
   * @returns {Object} - Timezone information
   */
  getTimezoneContext() {
    const now = new Date();
    const timezones = [
      { name: "UTC", offset: 0 },
      { name: "EST", offset: -5 },
      { name: "PST", offset: -8 },
      { name: "GMT", offset: 0 },
    ];

    return {
      current: "UTC",
      available: timezones,
      localTime: format(now, "yyyy-MM-dd HH:mm:ss"),
      utcTime: format(now, "yyyy-MM-dd HH:mm:ss") + " UTC",
    };
  }

  /**
   * Assess temporal relevance of query
   * @param {string} query - User query
   * @param {Date} now - Current time
   * @returns {Object} - Temporal relevance analysis
   */
  assessTemporalRelevance(query, now) {
    const queryLower = query.toLowerCase();
    let relevance = 0.5; // Base relevance

    // High relevance for time-sensitive queries
    const timeSensitiveKeywords = [
      "down",
      "not working",
      "error",
      "issue",
      "problem",
      "status",
      "outage",
      "maintenance",
      "scheduled",
    ];

    if (timeSensitiveKeywords.some((keyword) => queryLower.includes(keyword))) {
      relevance += 0.3;
    }

    // High relevance for current time references
    if (queryLower.includes("now") || queryLower.includes("currently")) {
      relevance += 0.2;
    }

    // Lower relevance for historical queries
    if (queryLower.includes("yesterday") || queryLower.includes("last week")) {
      relevance -= 0.2;
    }

    return {
      score: Math.min(1, Math.max(0, relevance)),
      isTimeSensitive: relevance > 0.7,
      urgency: this.assessUrgency(query, now),
    };
  }

  /**
   * Assess urgency of query
   * @param {string} query - User query
   * @param {Date} now - Current time
   * @returns {string} - Urgency level
   */
  assessUrgency(query, now) {
    const queryLower = query.toLowerCase();

    if (queryLower.includes("critical") || queryLower.includes("urgent")) {
      return "high";
    }

    if (queryLower.includes("down") || queryLower.includes("not working")) {
      return "medium";
    }

    if (queryLower.includes("help") || queryLower.includes("how")) {
      return "low";
    }

    return "normal";
  }

  /**
   * Format time context for display
   * @param {Date} date - Current date
   * @returns {Object} - Formatted time information
   */
  formatTimeContext(date) {
    return {
      timestamp: date.toISOString(),
      readable: format(date, "EEEE, MMMM do, yyyy 'at' h:mm a"),
      short: format(date, "MMM dd, yyyy HH:mm"),
      unix: Math.floor(date.getTime() / 1000),
    };
  }

  /**
   * Get next business day
   * @param {Date} date - Current date
   * @returns {Date} - Next business day
   */
  getNextBusinessDay(date) {
    let nextDay = addDays(date, 1);
    while (nextDay.getUTCDay() === 0 || nextDay.getUTCDay() === 6) {
      nextDay = addDays(nextDay, 1);
    }
    return nextDay;
  }

  /**
   * Get business hours start for current day
   * @param {Date} date - Current date
   * @returns {Date} - Business hours start
   */
  getBusinessHoursStart(date) {
    const start = new Date(date);
    start.setUTCHours(9, 0, 0, 0);
    return start;
  }

  /**
   * Get business hours end for current day
   * @param {Date} date - Current date
   * @returns {Date} - Business hours end
   */
  getBusinessHoursEnd(date) {
    const end = new Date(date);
    end.setUTCHours(17, 0, 0, 0);
    return end;
  }

  /**
   * Calculate confidence score
   * @param {Object} analysis - Time analysis
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(analysis) {
    let confidence = 0.7; // Base confidence

    // Higher confidence with more time references
    if (analysis.timeReferences.length > 0) {
      confidence += 0.2;
    }

    // Higher confidence for time-sensitive queries
    if (analysis.temporalRelevance.isTimeSensitive) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Generate human-readable response
   * @param {Object} analysis - Time analysis
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(analysis, query) {
    let response = `⏰ **Time Context:**\n\n`;

    response += `🕐 Current Time: ${analysis.formattedTime.readable}\n`;
    response += `📅 Date: ${analysis.formattedTime.short}\n`;
    response += `🌍 Timezone: ${analysis.timezoneContext.current}\n\n`;

    // Business hours status
    if (analysis.businessHours.isBusinessHours) {
      response += `✅ **Business Hours**: Currently within Stripe's business hours\n`;
    } else if (analysis.businessHours.isWeekday) {
      response += `⏰ **Business Hours**: Outside business hours (9 AM - 5 PM UTC)\n`;
    } else {
      response += `📅 **Weekend**: Outside business days (Monday - Friday)\n`;
    }

    // Time references
    if (analysis.timeReferences.length > 0) {
      response += `\n🔍 **Time References Found:**\n`;
      analysis.timeReferences.forEach((ref) => {
        response += `• ${ref.type}: ${ref.value}\n`;
      });
    }

    // Temporal relevance
    if (analysis.temporalRelevance.isTimeSensitive) {
      response += `\n⚡ **Time-Sensitive Query**: This appears to be a time-sensitive inquiry\n`;
    }

    // Urgency assessment
    if (analysis.temporalRelevance.urgency !== "normal") {
      response += `\n🚨 **Urgency Level**: ${analysis.temporalRelevance.urgency.toUpperCase()}\n`;
    }

    return response.trim();
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const timeIndicators = [
      /now|currently|right now/,
      /today|yesterday|tomorrow/,
      /time|date|when/,
      /business hours|weekend/,
      /down.*now|not working.*now/,
    ];

    return timeIndicators.some((pattern) => pattern.test(query.toLowerCase()));
  }
}

export default DateTimeTool;
