import {
  format,
  parseISO,
  isValid,
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  isWithinInterval,
  formatDistanceToNow,
  formatDistance,
  parse,
  isValid as isValidDate,
} from "date-fns";

/**
 * Date/Time MCP Tool for Shopify Merchant Support Agent
 * Handles time-sensitive queries and Shopify-specific time operations
 */
export class DateTimeTool {
  constructor() {
    this.name = "date_time";
    this.description =
      "Handle date/time operations and time-sensitive Shopify queries";
    this.timezone = "UTC"; // Default to UTC, can be configured per merchant
  }

  /**
   * Extract date/time expressions from natural language queries
   * @param {string} query - The user query containing date/time expressions
   * @returns {Array} Array of date/time expressions found
   */
  extractDateTimeExpressions(query) {
    const patterns = [
      // ISO dates: "2024-01-15", "2024-01-15T10:30:00Z"
      /\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?/g,
      // US dates: "01/15/2024", "1/15/24"
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      // European dates: "15/01/2024"
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      // Relative dates: "today", "yesterday", "tomorrow", "next week"
      /\b(today|yesterday|tomorrow|next week|last week|this week|next month|last month|this month|next year|last year|this year)\b/gi,
      // Time expressions: "10:30 AM", "2:30 PM", "14:30"
      /\d{1,2}:\d{2}(\s?(AM|PM|am|pm))?/g,
      // Duration expressions: "3 days", "2 weeks", "1 month"
      /\d+\s+(day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes)\b/gi,
      // Shopify-specific time patterns
      /\b(order date|created at|updated at|published at|scheduled for)\b/gi,
    ];

    const expressions = [];
    patterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        expressions.push(...matches);
      }
    });

    return [...new Set(expressions)]; // Remove duplicates
  }

  /**
   * Parse various date formats into Date objects
   * @param {string} dateString - Date string to parse
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseDate(dateString) {
    if (!dateString) return null;

    const trimmed = dateString.trim().toLowerCase();

    // Handle relative dates
    const now = new Date();
    switch (trimmed) {
      case "today":
        return startOfDay(now);
      case "yesterday":
        return startOfDay(addDays(now, -1));
      case "tomorrow":
        return startOfDay(addDays(now, 1));
      case "next week":
        return addDays(now, 7);
      case "last week":
        return addDays(now, -7);
      case "this week":
        return startOfDay(now);
      case "next month":
        return addMonths(now, 1);
      case "last month":
        return addMonths(now, -1);
      case "this month":
        return startOfDay(now);
      case "next year":
        return addYears(now, 1);
      case "last year":
        return addYears(now, -1);
      case "this year":
        return startOfDay(now);
    }

    // Try ISO format first
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      const isoDate = parseISO(trimmed);
      if (isValid(isoDate)) return isoDate;
    }

    // Try US format (MM/DD/YYYY)
    if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const usDate = parse(trimmed, "MM/dd/yyyy", new Date());
      if (isValidDate(usDate)) return usDate;
    }

    // Try European format (DD/MM/YYYY)
    if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const euDate = parse(trimmed, "dd/MM/yyyy", new Date());
      if (isValidDate(euDate)) return euDate;
    }

    // Try short year format (MM/DD/YY)
    if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      const shortDate = parse(trimmed, "MM/dd/yy", new Date());
      if (isValidDate(shortDate)) return shortDate;
    }

    return null;
  }

  /**
   * Calculate time differences and durations
   * @param {string} query - Query containing time calculations
   * @returns {Object} Time calculation results
   */
  calculateTimeDifferences(query) {
    const results = {
      calculations: [],
      summary: null,
      error: null,
    };

    try {
      const expressions = this.extractDateTimeExpressions(query);
      const dates = expressions
        .map((expr) => this.parseDate(expr))
        .filter((date) => date !== null);

      if (dates.length < 2) {
        results.error = "Need at least 2 valid dates to calculate differences";
        return results;
      }

      // Calculate differences between dates
      for (let i = 0; i < dates.length - 1; i++) {
        const date1 = dates[i];
        const date2 = dates[i + 1];

        const daysDiff = differenceInDays(date2, date1);
        const hoursDiff = differenceInHours(date2, date1);
        const minutesDiff = differenceInMinutes(date2, date1);

        results.calculations.push({
          date1: format(date1, "yyyy-MM-dd HH:mm"),
          date2: format(date2, "yyyy-MM-dd HH:mm"),
          daysDifference: daysDiff,
          hoursDifference: hoursDiff,
          minutesDifference: minutesDiff,
          formatted: this.formatTimeDifference(
            daysDiff,
            hoursDiff,
            minutesDiff
          ),
        });
      }

      if (results.calculations.length > 0) {
        results.summary = this.generateTimeSummary(results.calculations, query);
      }
    } catch (error) {
      results.error = `Time calculation error: ${error.message}`;
    }

    return results;
  }

  /**
   * Format time differences in a human-readable way
   * @param {number} days - Days difference
   * @param {number} hours - Hours difference
   * @param {number} minutes - Minutes difference
   * @returns {string} Formatted time difference
   */
  formatTimeDifference(days, hours, minutes) {
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
  }

  /**
   * Handle Shopify-specific time queries
   * @param {string} query - Query containing Shopify time operations
   * @returns {Object} Shopify time operation results
   */
  handleShopifyTimeQueries(query) {
    const results = {
      operations: [],
      summary: null,
      error: null,
    };

    try {
      const now = new Date();
      const queryLower = query.toLowerCase();

      // Check if query is asking about current time
      if (
        queryLower.includes("what time") ||
        queryLower.includes("current time") ||
        queryLower.includes("now") ||
        queryLower.includes("right now") ||
        queryLower.includes("current") ||
        queryLower.includes("clock") ||
        queryLower.includes("timestamp") ||
        queryLower.includes("moment") ||
        queryLower.includes("instant") ||
        queryLower.includes("exact time") ||
        queryLower.includes("precise time") ||
        queryLower.includes("local time") ||
        queryLower.includes("utc time") ||
        queryLower.includes("time now") ||
        queryLower.includes("time is") ||
        queryLower.includes("what's the time") ||
        queryLower.includes("tell me the time") ||
        queryLower.includes("show me the time") ||
        queryLower.includes("get time") ||
        queryLower.includes("current date") ||
        queryLower.includes("today's date") ||
        queryLower.includes("what date") ||
        queryLower.includes("date today") ||
        queryLower.includes("current day") ||
        queryLower.includes("what day") ||
        queryLower.includes("day today")
      ) {
        results.operations.push({
          type: "current_time",
          value: format(now, "yyyy-MM-dd HH:mm:ss"),
          formatted: `Current time: ${format(
            now,
            "EEEE, MMMM do, yyyy 'at' h:mm a"
          )}`,
        });
      }

      // Check for Shopify business hours queries
      if (
        queryLower.includes("business hours") ||
        queryLower.includes("shopify hours")
      ) {
        results.operations.push({
          type: "business_hours",
          value: "24/7",
          formatted:
            "Shopify operates 24/7, but support availability may vary by region.",
        });
      }

      // Check for time zone queries
      if (queryLower.includes("timezone") || queryLower.includes("time zone")) {
        results.operations.push({
          type: "timezone_info",
          value: this.timezone,
          formatted: `Default timezone: ${this.timezone}. Shopify stores can be configured with different timezones.`,
        });
      }

      // Check for order processing time queries
      if (
        queryLower.includes("order processing") ||
        queryLower.includes("processing time")
      ) {
        results.operations.push({
          type: "processing_time",
          value: "immediate",
          formatted:
            "Orders are processed immediately upon payment confirmation.",
        });
      }

      // Check for API rate limit time queries
      if (
        queryLower.includes("rate limit") ||
        queryLower.includes("api limit")
      ) {
        results.operations.push({
          type: "rate_limit_info",
          value: "40 requests/second",
          formatted: "Shopify API rate limit: 40 requests per second per app.",
        });
      }

      if (results.operations.length > 0) {
        results.summary = this.generateShopifyTimeSummary(
          results.operations,
          query
        );
      }
    } catch (error) {
      results.error = `Shopify time query error: ${error.message}`;
    }

    return results;
  }

  /**
   * Generate a summary of time calculations
   * @param {Array} calculations - Array of time calculations
   * @param {string} query - Original query for context
   * @returns {string} Summary text
   */
  generateTimeSummary(calculations, query) {
    const totalCalculations = calculations.length;
    const results = calculations.map((calc) => calc.formatted).join(", ");

    let summary = `Calculated ${totalCalculations} time difference${
      totalCalculations > 1 ? "s" : ""
    }: ${results}`;

    // Add Shopify-specific context if detected
    if (
      query.toLowerCase().includes("order") ||
      query.toLowerCase().includes("fulfillment")
    ) {
      summary +=
        "\n\n💡 **Order Processing Context:** These time calculations can help you understand order processing times, fulfillment schedules, or delivery estimates.";
    }

    if (
      query.toLowerCase().includes("subscription") ||
      query.toLowerCase().includes("recurring")
    ) {
      summary +=
        "\n\n💡 **Subscription Context:** Consider billing cycles and renewal dates when working with subscription-based products.";
    }

    return summary;
  }

  /**
   * Generate a summary of Shopify-specific time operations
   * @param {Array} operations - Array of Shopify time operations
   * @param {string} query - Original query for context
   * @returns {string} Summary text
   */
  generateShopifyTimeSummary(operations, query) {
    const totalOperations = operations.length;
    const results = operations.map((op) => op.formatted).join("\n\n");

    let summary = `Found ${totalOperations} Shopify time-related information${
      totalOperations > 1 ? "s" : ""
    }:\n\n${results}`;

    return summary;
  }

  /**
   * Determine if date/time tool should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use date/time tool
   */
  shouldUseDateTimeTool(query) {
    const timeKeywords = [
      "time",
      "date",
      "when",
      "today",
      "yesterday",
      "tomorrow",
      "week",
      "month",
      "year",
      "hour",
      "minute",
      "day",
      "schedule",
      "deadline",
      "expire",
      "duration",
      "interval",
      "business hours",
      "timezone",
      "rate limit",
      "processing time",
      "order date",
      "created at",
      "updated at",
      "published at",
      "scheduled for",
      "current time",
      "now",
      "ago",
      "since",
      "between",
      "from",
      "to",
      "until",
      "before",
      "after",
      "right now",
      "what time",
      "current",
      "clock",
      "timestamp",
      "moment",
      "instant",
      "exact time",
      "precise time",
      "local time",
      "utc time",
      "time zone",
      "timezone",
      "time now",
      "time is",
      "what's the time",
      "tell me the time",
      "show me the time",
      "get time",
      "current date",
      "today's date",
      "what date",
      "date today",
      "current day",
      "what day",
      "day today",
    ];

    const queryLower = query.toLowerCase();
    return timeKeywords.some((keyword) => queryLower.includes(keyword));
  }

  /**
   * Main method to handle date/time requests
   * @param {string} query - User query containing date/time expressions
   * @returns {Object} Date/time operation results
   */
  async processDateTime(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        operations: [],
        calculations: [],
        summary: null,
      };
    }

    if (!this.shouldUseDateTimeTool(query)) {
      return {
        error: "Date/time processing not needed for this query",
        operations: [],
        calculations: [],
        summary: null,
      };
    }

    try {
      console.log(`🕒 Processing date/time query: ${query}`);

      // Handle Shopify-specific time queries
      const shopifyResults = this.handleShopifyTimeQueries(query);

      // Handle time calculations if dates are found
      const timeCalcResults = this.calculateTimeDifferences(query);

      // Combine results
      const combinedResults = {
        operations: shopifyResults.operations || [],
        calculations: timeCalcResults.calculations || [],
        summary: null,
        error: null,
      };

      // Generate combined summary
      if (shopifyResults.summary || timeCalcResults.summary) {
        combinedResults.summary = [
          shopifyResults.summary,
          timeCalcResults.summary,
        ]
          .filter(Boolean)
          .join("\n\n");
      }

      // Handle errors - only set error if no operations or calculations were successful
      if (shopifyResults.error && timeCalcResults.error) {
        // Only set error if we have no successful operations or calculations
        if (
          combinedResults.operations.length === 0 &&
          combinedResults.calculations.length === 0
        ) {
          combinedResults.error = `Multiple errors: ${shopifyResults.error}; ${timeCalcResults.error}`;
        }
      } else if (
        shopifyResults.error &&
        combinedResults.operations.length === 0 &&
        combinedResults.calculations.length === 0
      ) {
        combinedResults.error = shopifyResults.error;
      } else if (
        timeCalcResults.error &&
        combinedResults.operations.length === 0 &&
        combinedResults.calculations.length === 0
      ) {
        combinedResults.error = timeCalcResults.error;
      }

      // Ensure we always have a summary if we have results
      if (
        (combinedResults.operations.length > 0 ||
          combinedResults.calculations.length > 0) &&
        !combinedResults.summary
      ) {
        combinedResults.summary = "Time information processed successfully.";
      }

      return combinedResults;
    } catch (error) {
      console.error("Date/time processing error:", error);
      return {
        error: `Date/time processing failed: ${error.message}`,
        operations: [],
        calculations: [],
        summary: null,
      };
    }
  }

  /**
   * Get tool information
   * @returns {Object} Tool metadata
   */
  getToolInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: [
        "Parse various date formats (ISO, US, European)",
        "Calculate time differences and durations",
        "Handle relative dates (today, yesterday, tomorrow)",
        "Shopify-specific time operations",
        "Business hours and timezone information",
        "Order processing time calculations",
        "API rate limit timing",
        "Current time and date formatting",
      ],
      examples: [
        "What time is it now?",
        "How many days between 2024-01-15 and 2024-02-20?",
        "What are Shopify's business hours?",
        "How long does order processing take?",
        "What's the timezone for my Shopify store?",
        "Calculate the difference between today and next week",
        "When was my order created if it was 3 days ago?",
      ],
    };
  }
}

export default DateTimeTool;
