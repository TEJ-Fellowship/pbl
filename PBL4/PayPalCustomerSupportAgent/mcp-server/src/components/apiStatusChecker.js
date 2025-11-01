import axios from "axios";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from mcp-server directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

// ===== API STATUS CHECKER COMPONENT =====
export class ApiStatusChecker {
  constructor() {
    // Prefer PayPal Statuspage endpoints (official)
    this.statusUrl = "https://www.paypal-status.com/";
    this.statusApiUrl = "https://www.paypal-status.com/api/v2/summary.json";
    this.cache = new Map();
    this.cacheTimeout = 10000; // 10s cache for positive statuses
    this.unknownCacheTimeout = 5000; // 5s cache for unknown/error
    this.disableCache =
      String(process.env.PAYPAL_STATUS_NO_CACHE || "").toLowerCase() === "true";
  }

  // Check if query is asking about PayPal status
  isStatusQuery(query) {
    const lowerQuery = query.toLowerCase();
    const statusTriggers = [
      "down",
      "outage",
      "status",
      "working",
      "broken",
      "not working",
      "maintenance",
      "incident",
      "problem",
      "trouble",
      "error",
      "failed",
      "unavailable",
      "offline",
      "up",
      "online",
      "service",
      "available",
    ];

    const statusPatterns = [
      /is paypal (down|working|up|offline|available)/i,
      /paypal (status|outage|maintenance|service)/i,
      /(paypal|paypal's).*(down|working|status|outage)/i,
      /(is|are).*(paypal|paypal's).*(down|working|up|offline)/i,
    ];

    const hasTrigger = statusTriggers.some((trigger) =>
      lowerQuery.includes(trigger)
    );
    const hasPattern = statusPatterns.some((pattern) => pattern.test(query));

    return hasTrigger || hasPattern;
  }

  // Get cached status if available and not expired
  getCachedStatus() {
    if (this.disableCache) return null;
    const cached = this.cache.get("status");
    if (!cached) return null;
    const ttl =
      cached.data?.status === "unknown"
        ? this.unknownCacheTimeout
        : this.cacheTimeout;
    if (Date.now() - cached.timestamp < ttl) {
      console.log("Using cached status data");
      // Avoid returning stale unknown if we can recheck soon
      return cached.data;
    }
    return null;
  }

  // Cache status data
  setCachedStatus(statusData) {
    if (this.disableCache) return;
    this.cache.set("status", {
      data: statusData,
      timestamp: Date.now(),
    });
  }

  // Parse status page HTML to extract status information
  parseStatusPage(html) {
    try {
      // Look for common status indicators in HTML
      const statusIndicators = {
        operational: /operational|all systems|green|up|running/i,
        degraded: /degraded|partial|yellow|slow|issues/i,
        outage: /outage|down|red|offline|unavailable|maintenance/i,
        maintenance: /maintenance|scheduled|planned/i,
      };

      let overallStatus = "unknown";
      let affectedServices = [];
      let lastUpdated = new Date().toISOString();

      // Check for overall status
      for (const [status, pattern] of Object.entries(statusIndicators)) {
        if (pattern.test(html)) {
          overallStatus = status;
          break;
        }
      }

      // Look for specific service mentions
      const servicePatterns = {
        payments: /payment|transaction|money/i,
        login: /login|authentication|sign.?in/i,
        api: /api|developer|integration/i,
        website: /website|web|site/i,
        mobile: /mobile|app|ios|android/i,
      };

      for (const [service, pattern] of Object.entries(servicePatterns)) {
        if (pattern.test(html)) {
          affectedServices.push(service);
        }
      }

      // Look for timestamp information
      const timePattern =
        /(last updated|updated|as of).*?(\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i;
      const timeMatch = html.match(timePattern);
      if (timeMatch) {
        lastUpdated = timeMatch[0];
      }

      return {
        status: overallStatus,
        affectedServices: [...new Set(affectedServices)], // Remove duplicates
        lastUpdated,
        confidence: "medium",
      };
    } catch (error) {
      console.error("Error parsing status page:", error.message);
      return {
        status: "unknown",
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: "low",
      };
    }
  }

  // Check PayPal Statuspage API summary (most reliable)
  async checkApiHealth() {
    try {
      console.log("Checking PayPal Statuspage API summary...");
      const response = await axios.get(this.statusApiUrl, {
        timeout: 5000,
        headers: {
          "User-Agent": "PayPal-Support-Agent/1.0",
        },
      });

      if (response.status === 200 && response.data) {
        const statusObj = response.data.status || {};
        const indicator = statusObj.indicator || "unknown";
        const description = (statusObj.description || "").toLowerCase();

        // Map statuspage indicator → our statuses
        const map = {
          none: "operational",
          minor: "degraded",
          major: "outage",
          critical: "outage",
          maintenance: "maintenance",
        };
        let mapped = map[indicator] || "unknown";

        // Fallbacks based on description text
        if (mapped === "unknown") {
          if (description.includes("operational")) mapped = "operational";
          else if (description.includes("degraded")) mapped = "degraded";
          else if (description.includes("outage")) mapped = "outage";
          else if (description.includes("maintenance")) mapped = "maintenance";
        }

        const components = Array.isArray(response.data.components)
          ? response.data.components
          : [];
        const affectedServices = components
          .filter((c) => c && c.status && c.status !== "operational")
          .map((c) => (c.name || "unknown").toLowerCase());

        // If any components are not operational and overall mapped is operational, downgrade to degraded
        if (mapped === "operational" && affectedServices.length > 0) {
          mapped = "degraded";
        }

        // Also check for unresolved incidents to upgrade severity
        try {
          const incidentsResp = await axios.get(
            "https://www.paypal-status.com/api/v2/incidents/unresolved.json",
            { timeout: 5000 }
          );
          const incidents = incidentsResp.data?.incidents || [];
          if (incidents.length > 0) {
            const hasMajor = incidents.some((i) =>
              ["major", "critical"].includes(i.impact)
            );
            mapped = hasMajor
              ? "outage"
              : mapped === "operational"
              ? "degraded"
              : mapped;
          }
        } catch (_) {
          // Ignore incidents fetch errors; summary already provides baseline
        }

        return {
          status: mapped,
          affectedServices,
          source: "api",
          confidence: mapped === "unknown" ? "medium" : "high",
        };
      }
    } catch (error) {
      console.log("Statuspage API not accessible:", error.message);
      return null;
    }
  }

  // Main method to check PayPal status
  async checkPayPalStatus() {
    try {
      console.log("Checking PayPal status...");

      // Check cache first
      const cached = this.getCachedStatus();
      if (cached) {
        return cached;
      }

      let statusData = {
        status: "unknown",
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: "low",
        source: "unknown",
      };

      // Try API health endpoint first (most reliable)
      const apiHealth = await this.checkApiHealth();
      if (apiHealth) {
        statusData = {
          ...statusData,
          ...apiHealth,
          lastUpdated: new Date().toISOString(),
        };
        // If API returns unknown, also check the status page as a secondary signal
        if (statusData.status === "unknown") {
          console.log("API returned unknown, checking PayPal status page...");
          const response = await axios.get(this.statusUrl, {
            timeout: 10000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (response.status === 200) {
            const parsed = this.parseStatusPage(response.data);
            if (parsed.status !== "unknown") {
              statusData = {
                ...statusData,
                ...parsed,
                source: "status_page",
                confidence: "medium",
              };
            }
          }
        }
      } else {
        // Fallback to status page
        console.log("Checking PayPal status page...");
        const response = await axios.get(this.statusUrl, {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        if (response.status === 200) {
          const parsed = this.parseStatusPage(response.data);
          statusData = {
            ...statusData,
            ...parsed,
            source: "status_page",
          };
        }
      }

      // Cache the result (unknown gets shorter TTL via getCachedStatus)
      this.setCachedStatus(statusData);

      return statusData;
    } catch (error) {
      console.error("Error checking PayPal status:", error.message);

      // Return error status
      const errorStatus = {
        status: "unknown",
        affectedServices: [],
        lastUpdated: new Date().toISOString(),
        confidence: "low",
        source: "error",
        error: error.message,
      };

      // Cache error status briefly
      this.setCachedStatus(errorStatus);

      return errorStatus;
    }
  }

  // Format status response for user
  formatStatusResponse(statusData) {
    const { status, affectedServices, lastUpdated, confidence, source } =
      statusData;

    let statusMessage = "";
    let statusEmoji = "";

    switch (status) {
      case "operational":
        statusMessage = "PayPal services are currently operational";
        statusEmoji = "✅";
        break;
      case "degraded":
        statusMessage =
          "PayPal is experiencing some issues but services are partially available";
        statusEmoji = "⚠️";
        break;
      case "outage":
        statusMessage = "PayPal is currently experiencing an outage";
        statusEmoji = "❌";
        break;
      case "maintenance":
        statusMessage = "PayPal is currently under maintenance";
        statusEmoji = "🔧";
        break;
      default:
        statusMessage = "Unable to determine current PayPal status";
        statusEmoji = "❓";
    }

    let response = `${statusEmoji} **PayPal Status Update**\n\n${statusMessage}`;

    if (affectedServices.length > 0) {
      response += `\n\n**Affected Services:** ${affectedServices.join(", ")}`;
    }

    response += `\n\n**Last Updated:** ${lastUpdated}`;
    response += `\n**Source:** ${
      source === "api" ? "PayPal API" : "PayPal Status Page"
    }`;
    response += `\n**Confidence:** ${confidence}`;

    if (status === "unknown") {
      response += `\n\n*For the most current information, please check [PayPal's official status page](https://www.paypal.com/status) or contact PayPal support.*`;
    }

    return response;
  }

  // Get status with formatted response
  async getStatusResponse() {
    try {
      const statusData = await this.checkPayPalStatus();
      const formattedResponse = this.formatStatusResponse(statusData);

      return {
        success: true,
        statusData,
        message: formattedResponse,
      };
    } catch (error) {
      console.error("Error getting status response:", error.message);
      return {
        success: false,
        message:
          "Sorry, I encountered an error while checking PayPal's status. Please try again or check [PayPal's official status page](https://www.paypal.com/status).",
        error: error.message,
      };
    }
  }
}

// Allow running this file directly to print a concise console output
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  (async () => {
    const checker = new ApiStatusChecker();
    console.log("Running PayPal status check...\n");

    const statusData = await checker.checkPayPalStatus();

    const { status, affectedServices, source, confidence, lastUpdated } =
      statusData;

    // Concise human-friendly output as requested
    if (status === "operational") {
      console.log("Yes, PayPal is operational ✅");
    } else if (status === "degraded") {
      console.log("PayPal is operational with some issues (degraded) ⚠️");
    } else if (status === "outage") {
      console.log("No, PayPal is experiencing an outage ❌");
    } else if (status === "maintenance") {
      console.log("PayPal is under maintenance 🔧");
    } else {
      console.log("Unable to determine PayPal status at this time ❓");
    }

    if (Array.isArray(affectedServices) && affectedServices.length > 0) {
      console.log(`Affected services: ${affectedServices.join(", ")}`);
    }

    console.log(`Source: ${source}`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Last Updated: ${lastUpdated}`);

    // Also print the raw payload for debugging/verification
    console.log("\nRaw status payload:\n", JSON.stringify(statusData, null, 2));
  })().catch((err) => {
    console.error("Status check failed:", err?.message || err);
    process.exitCode = 1;
  });
}
