import axios from "axios";

/**
 * Shopify Status Page Checker MCP Tool
 * Monitors Shopify's status page for current service issues and outages
 */
export class ShopifyStatusTool {
  constructor() {
    this.name = "shopify_status";
    this.description =
      "Check Shopify's status page for current service issues and outages";
    this.statusApiUrl = "https://status.shopify.com/api/v2/status.json";
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Fetch current status from Shopify's status page API
   * @returns {Object} Status information
   */
  async fetchShopifyStatus() {
    try {
      const response = await axios.get(this.statusApiUrl, {
        timeout: this.timeout,
        headers: {
          "User-Agent": "Shopify-Merchant-Support-Agent/1.0",
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Shopify status API error:", error.message);

      // Handle different types of errors
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Status check timed out - Shopify status page may be slow to respond"
        );
      } else if (error.response?.status === 404) {
        throw new Error("Shopify status API endpoint not found");
      } else if (error.response?.status >= 500) {
        throw new Error("Shopify status page is experiencing issues");
      } else {
        throw new Error(`Failed to fetch status: ${error.message}`);
      }
    }
  }

  /**
   * Parse status data and extract relevant information
   * @param {Object} statusData - Raw status data from API
   * @returns {Object} Parsed status information
   */
  parseStatusData(statusData) {
    const result = {
      overallStatus: statusData.status?.indicator || "unknown",
      overallDescription: statusData.status?.description || "Status unknown",
      incidents: [],
      maintenance: [],
      lastUpdated: statusData.page?.updated_at || new Date().toISOString(),
      components: [],
    };

    // Parse incidents (active issues)
    if (statusData.incidents && statusData.incidents.length > 0) {
      result.incidents = statusData.incidents.map((incident) => ({
        id: incident.id,
        name: incident.name,
        status: incident.status,
        impact: incident.impact,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
        shortlink: incident.shortlink,
        incidentUpdates:
          incident.incident_updates?.map((update) => ({
            status: update.status,
            body: update.body,
            createdAt: update.created_at,
          })) || [],
      }));
    }

    // Parse scheduled maintenance
    if (
      statusData.scheduled_maintenances &&
      statusData.scheduled_maintenances.length > 0
    ) {
      result.maintenance = statusData.scheduled_maintenances.map(
        (maintenance) => ({
          id: maintenance.id,
          name: maintenance.name,
          status: maintenance.status,
          impact: maintenance.impact,
          scheduledFor: maintenance.scheduled_for,
          scheduledUntil: maintenance.scheduled_until,
          shortlink: maintenance.shortlink,
          incidentUpdates:
            maintenance.incident_updates?.map((update) => ({
              status: update.status,
              body: update.body,
              createdAt: update.created_at,
            })) || [],
        })
      );
    }

    // Parse component status
    if (statusData.components && statusData.components.length > 0) {
      result.components = statusData.components.map((component) => ({
        id: component.id,
        name: component.name,
        status: component.status,
        position: component.position,
        description: component.description,
      }));
    }

    return result;
  }

  /**
   * Determine if status checker should be used based on query
   * @param {string} query - User query
   * @returns {boolean} Whether to use status checker
   */
  shouldUseStatusChecker(query) {
    const statusKeywords = [
      "down",
      "not working",
      "outage",
      "issue",
      "problem",
      "error",
      "slow",
      "unavailable",
      "offline",
      "broken",
      "failing",
      "status",
      "maintenance",
      "incident",
      "service",
      "shopify down",
      "shopify not working",
      "shopify outage",
      "is shopify down",
      "shopify issues",
      "shopify problems",
      "site down",
      "store down",
      "checkout down",
      "payment down",
      "api down",
      "webhook down",
      "admin down",
    ];

    const queryLower = query.toLowerCase();
    return statusKeywords.some((keyword) => queryLower.includes(keyword));
  }

  /**
   * Generate a human-readable status summary
   * @param {Object} parsedStatus - Parsed status data
   * @returns {string} Status summary
   */
  generateStatusSummary(parsedStatus) {
    let summary = `## 🟢 **Shopify Status Overview**\n\n`;

    // Overall status
    const statusEmoji = this.getStatusEmoji(parsedStatus.overallStatus);
    summary += `**Overall Status:** ${statusEmoji} ${parsedStatus.overallDescription}\n\n`;

    // Active incidents
    if (parsedStatus.incidents.length > 0) {
      summary += `### 🚨 **Active Issues (${parsedStatus.incidents.length})**\n\n`;

      parsedStatus.incidents.forEach((incident, index) => {
        const impactEmoji = this.getImpactEmoji(incident.impact);
        summary += `${index + 1}. **${incident.name}** ${impactEmoji}\n`;
        summary += `   - Impact: ${incident.impact}\n`;
        summary += `   - Status: ${incident.status}\n`;

        if (incident.incidentUpdates.length > 0) {
          const latestUpdate = incident.incidentUpdates[0];
          summary += `   - Latest Update: ${latestUpdate.body.substring(
            0,
            150
          )}...\n`;
        }

        if (incident.shortlink) {
          summary += `   - [View Details](${incident.shortlink})\n`;
        }
        summary += "\n";
      });
    } else {
      summary += `### ✅ **No Active Issues**\n\nAll Shopify services are operating normally.\n\n`;
    }

    // Scheduled maintenance
    if (parsedStatus.maintenance.length > 0) {
      summary += `### 🔧 **Scheduled Maintenance (${parsedStatus.maintenance.length})**\n\n`;

      parsedStatus.maintenance.forEach((maintenance, index) => {
        summary += `${index + 1}. **${maintenance.name}**\n`;
        summary += `   - Scheduled: ${new Date(
          maintenance.scheduledFor
        ).toLocaleString()}\n`;
        summary += `   - Duration: ${new Date(
          maintenance.scheduledUntil
        ).toLocaleString()}\n`;
        summary += `   - Impact: ${maintenance.impact}\n`;

        if (maintenance.shortlink) {
          summary += `   - [View Details](${maintenance.shortlink})\n`;
        }
        summary += "\n";
      });
    }

    // Component status summary
    if (parsedStatus.components.length > 0) {
      const componentStatuses = parsedStatus.components.reduce(
        (acc, component) => {
          acc[component.status] = (acc[component.status] || 0) + 1;
          return acc;
        },
        {}
      );

      summary += `### 📊 **Service Components**\n\n`;
      Object.entries(componentStatuses).forEach(([status, count]) => {
        const emoji = this.getStatusEmoji(status);
        summary += `- ${emoji} ${status}: ${count} component${
          count > 1 ? "s" : ""
        }\n`;
      });
      summary += "\n";
    }

    summary += `**Last Updated:** ${new Date(
      parsedStatus.lastUpdated
    ).toLocaleString()}\n`;
    summary += `**Status Page:** [status.shopify.com](https://status.shopify.com)`;

    return summary;
  }

  /**
   * Get emoji for status indicator
   * @param {string} status - Status indicator
   * @returns {string} Emoji representation
   */
  getStatusEmoji(status) {
    const statusEmojis = {
      operational: "🟢",
      minor: "🟡",
      major: "🟠",
      critical: "🔴",
      maintenance: "🔧",
      investigating: "🔍",
      identified: "🎯",
      monitoring: "👀",
      resolved: "✅",
      postmortem: "📝",
    };

    return statusEmojis[status] || "❓";
  }

  /**
   * Get emoji for impact level
   * @param {string} impact - Impact level
   * @returns {string} Emoji representation
   */
  getImpactEmoji(impact) {
    const impactEmojis = {
      none: "✅",
      minor: "🟡",
      major: "🟠",
      critical: "🔴",
    };

    return impactEmojis[impact] || "❓";
  }

  /**
   * Main method to handle status check requests
   * @param {string} query - User query
   * @returns {Object} Status check results
   */
  async checkStatus(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        status: null,
        summary: null,
      };
    }

    if (!this.shouldUseStatusChecker(query)) {
      return {
        error: "Status check not needed for this query",
        status: null,
        summary: null,
      };
    }

    try {
      console.log(`🔍 Checking Shopify status for: ${query}`);

      // Fetch status data
      const statusData = await this.fetchShopifyStatus();

      // Parse the data
      const parsedStatus = this.parseStatusData(statusData);

      // Generate summary
      const summary = this.generateStatusSummary(parsedStatus);

      return {
        status: parsedStatus,
        summary: summary,
        lastChecked: new Date().toISOString(),
        hasIssues: parsedStatus.incidents.length > 0,
        hasMaintenance: parsedStatus.maintenance.length > 0,
      };
    } catch (error) {
      console.error("Status check error:", error);
      return {
        error: `Status check failed: ${error.message}`,
        status: null,
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
        "Real-time Shopify service status monitoring",
        "Active incident detection and reporting",
        "Scheduled maintenance notifications",
        "Component-level status tracking",
        "Impact assessment and severity levels",
        "Direct links to status page details",
      ],
      examples: [
        "Is Shopify down right now?",
        "Are there any current Shopify outages?",
        "Check Shopify status for payment issues",
        "Is Shopify experiencing any problems?",
        "What's the current status of Shopify services?",
        "Are there any scheduled maintenance windows?",
      ],
      api: "Shopify Status Page API (https://status.shopify.com/api/v2/status.json)",
    };
  }
}

export default ShopifyStatusTool;
