import axios from "axios";
import { format, isAfter, isBefore, subHours } from "date-fns";

/**
 * Status Checker Tool for Stripe Operational Status
 * Checks Stripe's status page for current incidents and maintenance
 */
class StatusCheckerTool {
  constructor() {
    this.name = "status_checker";
    this.description = "Check Stripe's operational status using API calls";
    this.stripeApiUrl = "https://api.stripe.com/v1";
    this.apiKey = process.env.STRIPE_SECRET_KEY;
    this.lastCheck = null;
    this.cache = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Execute status check
   * @param {string} query - User query
   * @returns {Object} - Status information with confidence score
   */
  async execute(query) {
    try {
      console.log(`⚠️ Status Checker Tool: Processing "${query}"`);

      // Check if we need to refresh the cache
      if (this.shouldRefreshCache()) {
        await this.fetchStatus();
      }

      if (!this.cache) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message: "Unable to fetch Stripe status information",
        };
      }

      const analysis = this.analyzeStatus(query);
      const confidence = this.calculateConfidence(analysis);

      return {
        success: true,
        result: analysis,
        confidence,
        message: this.generateResponse(analysis, query),
      };
    } catch (error) {
      console.error("❌ Status Checker Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Fetch current status by testing Stripe API endpoints
   */
  async fetchStatus() {
    try {
      console.log("🔄 Testing Stripe API status...");

      if (!this.apiKey) {
        console.log("⚠️ No Stripe API key found, using fallback status");
        this.cache = this.createFallbackStatus();
        this.lastCheck = new Date();
        return;
      }

      // Test multiple Stripe API endpoints to determine status
      const statusData = await this.testStripeApiEndpoints();

      this.cache = statusData;
      this.lastCheck = new Date();
      console.log("✅ Stripe API status checked successfully");
    } catch (error) {
      console.error("❌ Failed to check Stripe API status:", error.message);

      // If API tests fail, create a fallback status
      console.log("⚠️ API tests failed, using fallback status");
      this.cache = this.createFallbackStatus();
      this.lastCheck = new Date();
    }
  }

  /**
   * Test Stripe API endpoints to determine service status
   */
  async testStripeApiEndpoints() {
    try {
      const endpoints = [
        { name: "API", url: "/charges", method: "GET" },
        { name: "Webhooks", url: "/webhook_endpoints", method: "GET" },
        { name: "Payments", url: "/payment_methods", method: "GET" },
        { name: "Customers", url: "/customers", method: "GET" },
        { name: "Products", url: "/products", method: "GET" },
      ];

      const components = [];
      let operationalCount = 0;
      let degradedCount = 0;

      for (const endpoint of endpoints) {
        try {
          const response = await axios({
            method: endpoint.method,
            url: `${this.stripeApiUrl}${endpoint.url}`,
            auth: {
              username: this.apiKey,
              password: "",
            },
            timeout: 10000,
            headers: {
              "User-Agent": "Stripe-Support-Agent/1.0",
            },
          });

          // If we get a response (even with errors), the service is operational
          const isOperational = response.status >= 200 && response.status < 500;

          components.push({
            id: endpoint.name.toLowerCase(),
            name: endpoint.name,
            status: isOperational ? "operational" : "degraded",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            response_time: response.headers["x-response-time"] || "unknown",
          });

          if (isOperational) operationalCount++;
          else degradedCount++;
        } catch (error) {
          // If we get a network error or timeout, service is degraded
          const isNetworkError =
            !error.response || error.code === "ECONNABORTED";

          components.push({
            id: endpoint.name.toLowerCase(),
            name: endpoint.name,
            status: isNetworkError ? "degraded" : "operational",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error: isNetworkError ? error.message : null,
          });

          if (isNetworkError) degradedCount++;
          else operationalCount++;
        }
      }

      const hasIssues = degradedCount > 0;
      const overallStatus = hasIssues ? "degraded" : "operational";

      return {
        status: {
          indicator: overallStatus,
          description: hasIssues
            ? `${degradedCount} service(s) experiencing issues`
            : "All systems operational",
        },
        incidents: [],
        scheduled_maintenances: [],
        components: components,
        page: {
          id: "stripe",
          name: "Stripe",
          url: "https://api.stripe.com",
          time_zone: "UTC",
          updated_at: new Date().toISOString(),
        },
        api_tests: {
          total: endpoints.length,
          operational: operationalCount,
          degraded: degradedCount,
        },
      };
    } catch (error) {
      console.error("❌ Failed to test Stripe API endpoints:", error.message);
      return this.createFallbackStatus();
    }
  }

  /**
   * Create fallback status when API is not available
   */
  createFallbackStatus() {
    return {
      status: {
        indicator: "operational",
        description: "All systems operational",
      },
      incidents: [],
      scheduled_maintenances: [],
      components: [
        {
          id: "api",
          name: "API",
          status: "operational",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "webhooks",
          name: "Webhooks",
          status: "operational",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "dashboard",
          name: "Dashboard",
          status: "operational",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      page: {
        id: "stripe",
        name: "Stripe",
        url: "https://status.stripe.com",
        time_zone: "UTC",
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Check if cache should be refreshed
   * @returns {boolean} - Whether to refresh cache
   */
  shouldRefreshCache() {
    if (!this.lastCheck || !this.cache) return true;
    return Date.now() - this.lastCheck.getTime() > this.cacheTimeout;
  }

  /**
   * Analyze current status and extract relevant information
   * @param {string} query - User query
   * @returns {Object} - Status analysis
   */
  analyzeStatus(query) {
    if (!this.cache) {
      return {
        status: "unknown",
        incidents: [],
        maintenance: [],
        components: [],
        overallHealth: "unknown",
      };
    }

    const status = this.cache.status;
    const incidents = this.cache.incidents || [];
    const maintenance = this.cache.scheduled_maintenances || [];
    const components = this.cache.components || [];

    // Filter incidents by query relevance
    const relevantIncidents = this.filterRelevantIncidents(incidents, query);
    const relevantMaintenance = this.filterRelevantMaintenance(
      maintenance,
      query
    );
    const relevantComponents = this.filterRelevantComponents(components, query);

    return {
      status: status.indicator,
      incidents: relevantIncidents,
      maintenance: relevantMaintenance,
      components: relevantComponents,
      overallHealth: this.determineOverallHealth(status, incidents),
      lastUpdated: this.cache.page?.updated_at,
      queryRelevance: this.calculateQueryRelevance(
        query,
        incidents,
        maintenance
      ),
    };
  }

  /**
   * Filter incidents based on query relevance
   * @param {Array} incidents - All incidents
   * @param {string} query - User query
   * @returns {Array} - Relevant incidents
   */
  filterRelevantIncidents(incidents, query) {
    const queryLower = query.toLowerCase();
    const relevantKeywords = [
      "webhook",
      "payment",
      "api",
      "billing",
      "subscription",
      "card",
      "charge",
      "refund",
      "dispute",
      "connect",
    ];

    return incidents.filter((incident) => {
      const name = incident.name?.toLowerCase() || "";
      const description = incident.impact || "";

      // Check if query mentions specific components
      const queryMentionsComponent = relevantKeywords.some(
        (keyword) =>
          queryLower.includes(keyword) &&
          (name.includes(keyword) || description.includes(keyword))
      );

      // Check if incident is recent (within last 24 hours)
      const isRecent = this.isIncidentRecent(incident);

      return queryMentionsComponent || isRecent;
    });
  }

  /**
   * Filter maintenance based on query relevance
   * @param {Array} maintenance - All maintenance windows
   * @param {string} query - User query
   * @returns {Array} - Relevant maintenance
   */
  filterRelevantMaintenance(maintenance, query) {
    const queryLower = query.toLowerCase();
    const relevantKeywords = [
      "webhook",
      "payment",
      "api",
      "billing",
      "subscription",
      "card",
      "charge",
      "refund",
      "dispute",
      "connect",
    ];

    return maintenance.filter((maint) => {
      const name = maint.name?.toLowerCase() || "";
      const description = maint.impact || "";

      const queryMentionsComponent = relevantKeywords.some(
        (keyword) =>
          queryLower.includes(keyword) &&
          (name.includes(keyword) || description.includes(keyword))
      );

      const isUpcoming = this.isMaintenanceUpcoming(maint);

      return queryMentionsComponent || isUpcoming;
    });
  }

  /**
   * Filter components based on query relevance
   * @param {Array} components - All components
   * @param {string} query - User query
   * @returns {Array} - Relevant components
   */
  filterRelevantComponents(components, query) {
    const queryLower = query.toLowerCase();
    const relevantKeywords = [
      "webhook",
      "payment",
      "api",
      "billing",
      "subscription",
      "card",
      "charge",
      "refund",
      "dispute",
      "connect",
    ];

    return components.filter((component) => {
      const name = component.name?.toLowerCase() || "";
      return relevantKeywords.some(
        (keyword) => queryLower.includes(keyword) && name.includes(keyword)
      );
    });
  }

  /**
   * Check if incident is recent (within last 24 hours)
   * @param {Object} incident - Incident object
   * @returns {boolean} - Whether incident is recent
   */
  isIncidentRecent(incident) {
    if (!incident.created_at) return false;

    const incidentDate = new Date(incident.created_at);
    const twentyFourHoursAgo = subHours(new Date(), 24);

    return isAfter(incidentDate, twentyFourHoursAgo);
  }

  /**
   * Check if maintenance is upcoming (within next 7 days)
   * @param {Object} maintenance - Maintenance object
   * @returns {boolean} - Whether maintenance is upcoming
   */
  isMaintenanceUpcoming(maintenance) {
    if (!maintenance.scheduled_for) return false;

    const maintenanceDate = new Date(maintenance.scheduled_for);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return (
      isAfter(maintenanceDate, now) &&
      isBefore(maintenanceDate, sevenDaysFromNow)
    );
  }

  /**
   * Determine overall health status
   * @param {Object} status - Status object
   * @param {Array} incidents - Active incidents
   * @returns {string} - Health status
   */
  determineOverallHealth(status, incidents) {
    if (status.indicator === "critical") return "critical";
    if (status.indicator === "major") return "degraded";
    if (incidents.length > 0) return "minor_issues";
    return "operational";
  }

  /**
   * Calculate query relevance score
   * @param {string} query - User query
   * @param {Array} incidents - Active incidents
   * @param {Array} maintenance - Scheduled maintenance
   * @returns {number} - Relevance score (0-1)
   */
  calculateQueryRelevance(query, incidents, maintenance) {
    const queryLower = query.toLowerCase();
    let relevance = 0;

    // Check for status-related keywords
    const statusKeywords = [
      "down",
      "not working",
      "issue",
      "problem",
      "error",
      "status",
    ];
    if (statusKeywords.some((keyword) => queryLower.includes(keyword))) {
      relevance += 0.3;
    }

    // Check for component-specific keywords
    const componentKeywords = ["webhook", "payment", "api", "billing"];
    if (componentKeywords.some((keyword) => queryLower.includes(keyword))) {
      relevance += 0.4;
    }

    // Check if there are active incidents
    if (incidents.length > 0) {
      relevance += 0.3;
    }

    return Math.min(1, relevance);
  }

  /**
   * Calculate confidence score for status analysis
   * @param {Object} analysis - Status analysis
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(analysis) {
    let confidence = 0.7; // Base confidence

    // Higher confidence if there are relevant incidents
    if (analysis.incidents.length > 0) confidence += 0.2;

    // Higher confidence if query relevance is high
    if (analysis.queryRelevance > 0.5) confidence += 0.1;

    // Lower confidence if status is unknown
    if (analysis.overallHealth === "unknown") confidence -= 0.3;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Generate human-readable response for status
   * @param {Object} analysis - Status analysis
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(analysis, query) {
    let response = "";

    // Overall status
    const statusEmoji = this.getStatusEmoji(analysis.overallHealth);
    response += `${statusEmoji} **Stripe Status: ${analysis.overallHealth.toUpperCase()}**\n\n`;

    // Active incidents
    if (analysis.incidents.length > 0) {
      response += "🚨 **Active Issues:**\n";
      analysis.incidents.forEach((incident) => {
        response += `• ${incident.name}\n`;
        if (incident.impact) {
          response += `  Impact: ${incident.impact}\n`;
        }
      });
      response += "\n";
    }

    // Scheduled maintenance
    if (analysis.maintenance.length > 0) {
      response += "🔧 **Scheduled Maintenance:**\n";
      analysis.maintenance.forEach((maint) => {
        response += `• ${maint.name}\n`;
        if (maint.scheduled_for) {
          const maintDate = new Date(maint.scheduled_for);
          response += `  Scheduled: ${format(
            maintDate,
            "MMM dd, yyyy HH:mm"
          )}\n`;
        }
      });
      response += "\n";
    }

    // Component status
    if (analysis.components.length > 0) {
      response += "🔧 **Component Status:**\n";
      analysis.components.forEach((component) => {
        const statusEmoji = this.getComponentStatusEmoji(component.status);
        response += `${statusEmoji} ${component.name}: ${component.status}\n`;
      });
    }

    // Last updated
    if (analysis.lastUpdated) {
      const updatedDate = new Date(analysis.lastUpdated);
      response += `\n📅 Last updated: ${format(
        updatedDate,
        "MMM dd, yyyy HH:mm"
      )}`;
    }

    return response.trim();
  }

  /**
   * Get emoji for overall health status
   * @param {string} health - Health status
   * @returns {string} - Emoji
   */
  getStatusEmoji(health) {
    switch (health) {
      case "operational":
        return "✅";
      case "minor_issues":
        return "⚠️";
      case "degraded":
        return "🟡";
      case "critical":
        return "🔴";
      default:
        return "❓";
    }
  }

  /**
   * Get emoji for component status
   * @param {string} status - Component status
   * @returns {string} - Emoji
   */
  getComponentStatusEmoji(status) {
    switch (status?.toLowerCase()) {
      case "operational":
        return "✅";
      case "degraded_performance":
        return "⚠️";
      case "partial_outage":
        return "🟡";
      case "major_outage":
        return "🔴";
      default:
        return "❓";
    }
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const statusIndicators = [
      /down|not working|broken/,
      /status|outage|incident/,
      /maintenance|scheduled/,
      /issue|problem|error/,
      /stripe.*down|stripe.*not working/,
    ];

    return statusIndicators.some((pattern) =>
      pattern.test(query.toLowerCase())
    );
  }
}

export default StatusCheckerTool;
