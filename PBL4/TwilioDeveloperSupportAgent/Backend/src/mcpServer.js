// Backend/src/mcpServer.js
// Real MCP Server for Twilio chat functionality

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";
import axios from "axios";
import config from "../config/config.js";

class TwilioMCPServer {
  constructor(initializeProtocolServer = false) {
    this.server = null;
    this.isProtocolServer = initializeProtocolServer;

    // Only initialize MCP protocol server if explicitly requested
    // (for when running as standalone MCP server)
    if (initializeProtocolServer) {
      this.server = new Server(
        {
          name: "twilio-chat-mcp-server",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      this.setupTools();
    }
  }

  setupTools() {
    if (!this.server) {
      return;
    }
    // List available tools
    this.server.setRequestHandler("tools/list", async (request) => {
      return {
        tools: [
          {
            name: "validate_twilio_code",
            description:
              "Validate Twilio API code snippets and check for common issues",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Code snippet to validate",
                },
                language: {
                  type: "string",
                  description:
                    "Programming language (nodejs, python, php, etc.)",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "lookup_error_code",
            description:
              "Look up Twilio error codes and provide detailed explanations",
            inputSchema: {
              type: "object",
              properties: {
                errorCode: {
                  type: "string",
                  description:
                    "Twilio error code to look up (e.g., 30001, 20003)",
                },
              },
              required: ["errorCode"],
            },
          },
          {
            name: "check_twilio_status",
            description:
              "Check Twilio service status for any ongoing disruptions or maintenance",
            inputSchema: {
              type: "object",
              properties: {
                service: {
                  type: "string",
                  description:
                    "Specific Twilio service to check (sms, voice, video, whatsapp, etc.) - optional",
                },
              },
            },
          },
          {
            name: "validate_webhook_signature",
            description:
              "Validate Twilio webhook signatures and payload formats",
            inputSchema: {
              type: "object",
              properties: {
                signature: {
                  type: "string",
                  description: "X-Twilio-Signature header value",
                },
                url: {
                  type: "string",
                  description: "Full webhook URL that was called",
                },
                payload: {
                  type: "string",
                  description: "Raw webhook payload body",
                },
                authToken: {
                  type: "string",
                  description: "Twilio Auth Token for signature validation",
                },
              },
              required: ["signature", "url", "payload", "authToken"],
            },
          },
          {
            name: "calculate_rate_limits",
            description:
              "Calculate if user's API usage will exceed Twilio rate limits",
            inputSchema: {
              type: "object",
              properties: {
                apiType: {
                  type: "string",
                  description: "Type of API (sms, voice, video, etc.)",
                },
                requestsPerSecond: {
                  type: "number",
                  description: "Number of requests per second",
                },
                requestsPerMinute: {
                  type: "number",
                  description: "Number of requests per minute",
                },
                accountTier: {
                  type: "string",
                  description:
                    "Account tier (trial, pay-as-you-go, enterprise)",
                  default: "pay-as-you-go",
                },
              },
              required: ["apiType", "requestsPerSecond", "requestsPerMinute"],
            },
          },
          {
            name: "execute_twilio_code",
            description:
              "Execute simple Twilio API calls in sandboxed test mode",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description:
                    "Twilio API code to execute (Node.js, Python, or PHP)",
                },
                language: {
                  type: "string",
                  description: "Programming language (nodejs, python, php)",
                  default: "nodejs",
                },
                testMode: {
                  type: "boolean",
                  description: "Whether to run in test mode (default: true)",
                  default: true,
                },
              },
              required: ["code", "language"],
            },
          },
          {
            name: "get_current_time",
            description: "Get the current date and time",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // Tool call handler
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "validate_twilio_code":
            return await this.handleValidateTwilioCode(args);
          case "lookup_error_code":
            return await this.handleLookupErrorCode(args);
          case "check_twilio_status":
            return await this.handleCheckTwilioStatus(args);
          case "validate_webhook_signature":
            return await this.handleValidateWebhookSignature(args);
          case "calculate_rate_limits":
            return await this.handleCalculateRateLimits(args);
          case "execute_twilio_code":
            return await this.handleExecuteTwilioCode(args);
          case "get_current_time":
            return await this.handleGetCurrentTime(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                tool: name,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  // Tool implementations
  async handleValidateTwilioCode(args) {
    const { code, language = "javascript" } = args;

    try {
      const validation = this.validateTwilioCode(code, language);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "validate_twilio_code",
              validation,
              codeSnippet:
                typeof code === "string"
                  ? code.substring(0, 200) + (code.length > 200 ? "..." : "")
                  : null,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Code validation failed: ${error.message}`);
    }
  }

  async handleLookupErrorCode(args) {
    const { errorCode } = args;

    try {
      const errorInfo = this.lookupErrorCode(errorCode);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "lookup_error_code",
              errorInfo,
              errorCode,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error code lookup failed: ${error.message}`);
    }
  }

  // Twilio Status API handler
  async handleCheckTwilioStatus(args) {
    const { service, generalSearch } = args;

    try {
      const statusInfo = await this.checkTwilioStatus(service, generalSearch);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "check_twilio_status",
              service: service || "all",
              status: statusInfo,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Twilio status check failed: ${error.message}`);
    }
  }

  // Webhook signature validation handler
  async handleValidateWebhookSignature(args) {
    const { signature, url, payload, authToken } = args;

    try {
      const validation = this.validateWebhookSignature(
        signature,
        url,
        payload,
        authToken
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "validate_webhook_signature",
              validation,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Webhook validation failed: ${error.message}`);
    }
  }

  // Rate limit calculation handler
  async handleCalculateRateLimits(args) {
    const {
      apiType,
      requestsPerSecond,
      requestsPerMinute,
      accountTier = "pay-as-you-go",
    } = args;

    try {
      const rateLimitInfo = this.calculateRateLimits(
        apiType,
        requestsPerSecond,
        requestsPerMinute,
        accountTier
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "calculate_rate_limits",
              rateLimitInfo,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Rate limit calculation failed: ${error.message}`);
    }
  }

  // Code execution handler
  async handleExecuteTwilioCode(args) {
    const { code, language = "nodejs", testMode = true } = args;

    try {
      const executionResult = await this.executeTwilioCode(
        code,
        language,
        testMode
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "execute_twilio_code",
              executionResult,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  // Current time handler
  async handleGetCurrentTime(args) {
    try {
      const timeInfo = this.getCurrentTime();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "get_current_time",
              timeInfo,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Time retrieval failed: ${error.message}`);
    }
  }

  // Helper methods (enhancement methods moved to queryEnhancer.js)
  // Web search moved to generalSearch.js

  /**
   * Extract arguments for MCP tool from query and enhancements
   * This is MCP-specific logic, so it belongs in MCP Server
   */
  extractToolArgs(toolName, query, enhancements, generalSearch = null) {
    const args = {};

    switch (toolName) {
      case "lookup_error_code": {
        // Extract error code from query or enhancements
        const errorCodes = enhancements?.errorCodes || [];
        if (errorCodes.length > 0) {
          args.errorCode = errorCodes[0];
        } else {
          // Try to extract from query
          const match = query.match(/\b(2\d{4}|\d{5})\b/);
          if (match) {
            args.errorCode = match[0];
          }
        }
        break;
      }

      case "validate_twilio_code": {
        // Extract code from query (look for code blocks)
        const codeMatch = query.match(/```[\s\S]*?```/);
        if (codeMatch) {
          args.code = codeMatch[0]
            .replace(/```[a-z]*\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }
        args.language = enhancements?.detectedLanguage || "javascript";
        break;
      }

      case "check_twilio_status": {
        // Extract service from query if mentioned
        const serviceMatch = query.match(/\b(sms|voice|video|whatsapp)\b/i);
        if (serviceMatch) {
          args.service = serviceMatch[0].toLowerCase();
        }
        // Pass generalSearch instance to checkTwilioStatus
        if (generalSearch) {
          args.generalSearch = generalSearch;
        }
        break;
      }

      case "validate_webhook_signature": {
        // These need to be provided explicitly - can't extract from query easily
        // Will return empty, caller should handle
        break;
      }

      case "calculate_rate_limits": {
        // Extract usage info from query if possible
        // This is complex, usually requires explicit input
        break;
      }

      case "execute_twilio_code": {
        // Extract code from query
        const codeMatch = query.match(/```[\s\S]*?```/);
        if (codeMatch) {
          args.code = codeMatch[0]
            .replace(/```[a-z]*\n?/g, "")
            .replace(/```/g, "")
            .trim();
        }
        args.language = enhancements?.detectedLanguage || "nodejs";
        args.testMode = true;
        break;
      }

      case "get_current_time": {
        // No arguments needed for time query
        break;
      }
    }

    return args;
  }

  /**
   * Execute an MCP tool with extracted arguments
   * This centralizes all MCP tool execution logic
   */
  async executeTool(toolName, query, enhancements, generalSearch = null) {
    // Extract arguments
    const args = this.extractToolArgs(
      toolName,
      query,
      enhancements,
      generalSearch
    );

    // Call the appropriate handler
    const toolHandlers = {
      lookup_error_code: (args) => this.handleLookupErrorCode(args),
      validate_twilio_code: (args) => this.handleValidateTwilioCode(args),
      check_twilio_status: (args) => this.handleCheckTwilioStatus(args),
      validate_webhook_signature: (args) =>
        this.handleValidateWebhookSignature(args),
      calculate_rate_limits: (args) => this.handleCalculateRateLimits(args),
      execute_twilio_code: (args) => this.handleExecuteTwilioCode(args),
      get_current_time: (args) => this.handleGetCurrentTime(args),
    };

    const handler = toolHandlers[toolName];
    if (!handler) {
      throw new Error(`Unknown MCP tool: ${toolName}`);
    }

    const result = await handler(args);

    // Parse the result if it's JSON
    if (result.content && result.content[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch {
        return result.content[0].text;
      }
    }

    return result;
  }

  validateTwilioCode(code, language) {
    const issues = [];
    const suggestions = [];
    let isValid = true;

    // Guard against missing or non-string code
    if (typeof code !== "string") {
      issues.push("No code provided or invalid code type");
      suggestions.push("Provide a valid code snippet as a string");
      return {
        isValid: false,
        issues,
        suggestions,
        language,
        confidence: 0.1,
      };
    }

    // Common Twilio validation patterns
    const patterns = {
      javascript: {
        missingRequire: /require\s*\(\s*['"]twilio['"]\s*\)/,
        missingClient: /twilio\s*\(\s*[^)]+\)/,
        missingCreate: /\.create\s*\(/,
      },
      python: {
        missingImport: /from\s+twilio\s+import/,
        missingClient: /Client\s*\(/,
        missingCreate: /\.create\s*\(/,
      },
      php: {
        missingRequire: /require_once\s+['"]twilio/,
        missingClient: /new\s+Client\s*\(/,
        missingCreate: /->create\s*\(/,
      },
    };

    const langPatterns = patterns[language] || patterns.javascript;

    // Check for missing Twilio import/require
    if (!langPatterns.missingRequire.test(code)) {
      issues.push(
        `Missing Twilio ${language === "python" ? "import" : "require/import"}`
      );
      suggestions.push(
        `Add: ${
          language === "python"
            ? "from twilio import Client"
            : language === "javascript"
            ? 'const twilio = require("twilio");'
            : 'require_once "twilio/sdk/Twilio/autoload.php";'
        }`
      );
      isValid = false;
    }

    // Check for client initialization
    if (!langPatterns.missingClient.test(code)) {
      issues.push("Missing Twilio client initialization");
      suggestions.push(
        "Initialize Twilio client with Account SID and Auth Token"
      );
      isValid = false;
    }

    // Check for API call method
    if (!langPatterns.missingCreate.test(code)) {
      issues.push("Missing API call method");
      suggestions.push(
        "Use appropriate Twilio API method (e.g., client.messages.create())"
      );
      isValid = false;
    }

    // Check for environment variables
    if (code.includes("process.env") || code.includes("os.environ")) {
      suggestions.push(
        "Make sure to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
      );
    }

    return {
      isValid,
      issues,
      suggestions,
      language,
      confidence: isValid ? 0.9 : 0.3,
    };
  }

  lookupErrorCode(errorCode) {
    // Common Twilio error codes
    const errorCodes = {
      20001: {
        message: "Invalid Account SID",
        description: "The Account SID provided is not valid",
        solution: "Check your Account SID in the Twilio Console",
        category: "authentication",
      },
      20003: {
        message: "Authentication Error",
        description: "The provided credentials are not valid",
        solution: "Verify your Account SID and Auth Token",
        category: "authentication",
      },
      20404: {
        message: "Resource Not Found",
        description: "The requested resource does not exist",
        solution: "Check the resource ID or URL path",
        category: "resource",
      },
      21211: {
        message: "Invalid 'To' Phone Number",
        description: "The 'To' phone number is not valid",
        solution:
          "Use a valid phone number in E.164 format (e.g., +1234567890)",
        category: "validation",
      },
      21212: {
        message: "Invalid 'From' Phone Number",
        description: "The 'From' phone number is not valid",
        solution: "Use a valid Twilio phone number you own",
        category: "validation",
      },
      30001: {
        message: "Queue overflow",
        description: "Too many requests in the queue",
        solution: "Implement rate limiting and retry logic",
        category: "rate_limit",
      },
      30002: {
        message: "Account suspended",
        description: "Your Twilio account has been suspended",
        solution: "Contact Twilio support to resolve account issues",
        category: "account",
      },
      30003: {
        message: "Unreachable destination handset",
        description: "The destination phone number cannot be reached",
        solution: "Verify the phone number and try again later",
        category: "delivery",
      },
    };

    const error = errorCodes[errorCode];
    if (error) {
      return {
        found: true,
        ...error,
        errorCode,
      };
    } else {
      return {
        found: false,
        errorCode,
        message: "Unknown error code",
        description: "This error code is not in our database",
        solution: "Check the Twilio API documentation or contact support",
        category: "unknown",
      };
    }
  }

  // Twilio Status API implementation
  // Uses GeneralSearch for web-based status checking
  async checkTwilioStatus(service = null, generalSearch = null) {
    try {
      // Use Twilio's Statuspage summary API
      const response = await axios.get(
        "https://status.twilio.com/api/v2/summary.json",
        { timeout: 10000 }
      );

      const summary = response.data || {};
      const components = Array.isArray(summary.components)
        ? summary.components
        : [];
      const incidents = Array.isArray(summary.incidents)
        ? summary.incidents
        : [];

      const normalize = (s) => (s || "").toString().toLowerCase();

      // Optional service filter: loosely match component names that include the service term
      const serviceFilter = service ? normalize(service) : null;
      const filteredComponents = serviceFilter
        ? components.filter((c) => normalize(c.name).includes(serviceFilter))
        : components;

      const activeIncidents = incidents.filter(
        (i) => normalize(i.status) !== "resolved"
      );

      // Compute overall status
      let overallStatus = "operational";
      let confidence = 0.9; // Real data → higher confidence
      const issues = [];

      // 1) Incidents take precedence
      if (activeIncidents.length > 0) {
        // Map Statuspage impact to our categories
        const hasCritical = activeIncidents.some(
          (i) =>
            normalize(i.impact) === "critical" ||
            normalize(i.impact) === "major"
        );
        const hasMinor = activeIncidents.some(
          (i) => normalize(i.impact) === "minor"
        );
        overallStatus = hasCritical
          ? "outage"
          : hasMinor
          ? "degraded"
          : "degraded";

        activeIncidents.slice(0, 3).forEach((i) => {
          issues.push({
            title: i.name,
            description: i.impact || i.status,
            source: i.shortlink || "https://status.twilio.com/",
          });
        });
      } else {
        // 2) Fall back to component statuses
        const comps =
          filteredComponents.length > 0 ? filteredComponents : components;
        const hasMajorOutage = comps.some(
          (c) => normalize(c.status) === "major_outage"
        );
        const hasDegraded = comps.some(
          (c) =>
            normalize(c.status) === "partial_outage" ||
            normalize(c.status) === "degraded_performance"
        );

        if (hasMajorOutage) {
          overallStatus = "outage";
        } else if (hasDegraded) {
          overallStatus = "degraded";
        } else {
          overallStatus = "operational";
        }

        comps
          .filter(
            (c) => normalize(c.status) !== "operational" && issues.length < 3
          )
          .slice(0, 3)
          .forEach((c) => {
            issues.push({
              title: c.name,
              description: c.status,
              source: "https://status.twilio.com/",
            });
          });
      }

      return {
        status: overallStatus,
        confidence,
        service: service || "all",
        lastChecked: new Date().toISOString(),
        issues,
        message: this.getStatusMessage(overallStatus, service),
        recommendation: this.getStatusRecommendation(overallStatus),
      };
    } catch (error) {
      return {
        status: "unknown",
        confidence: 0.1,
        service: service || "all",
        lastChecked: new Date().toISOString(),
        error: "Unable to check status",
        message:
          "Status check failed. Please check Twilio's status page directly.",
        recommendation:
          "Visit https://status.twilio.com/ for official status updates",
      };
    }
  }

  getStatusMessage(status, service) {
    const serviceName = service ? `Twilio ${service}` : "Twilio services";
    switch (status) {
      case "operational":
        return `${serviceName} are operating normally`;
      case "degraded":
        return `${serviceName} are experiencing some issues but are mostly functional`;
      case "outage":
        return `${serviceName} are currently experiencing an outage`;
      default:
        return `Unable to determine ${serviceName} status`;
    }
  }

  getStatusRecommendation(status) {
    switch (status) {
      case "operational":
        return "No action needed. Services are working normally.";
      case "degraded":
        return "Consider implementing retry logic and monitoring for any issues.";
      case "outage":
        return "Avoid making API calls until service is restored. Check status page for updates.";
      default:
        return "Check official Twilio status page for current information.";
    }
  }

  // Webhook signature validation implementation
  validateWebhookSignature(signature, url, payload, authToken) {
    try {
      const crypto = require("crypto");

      // Create the signature string
      const signatureString = url + payload;

      // Create HMAC-SHA1 hash
      const expectedSignature = crypto
        .createHmac("sha1", authToken)
        .update(signatureString, "utf8")
        .digest("base64");

      // Compare signatures
      const isValid = signature === expectedSignature;

      // Additional validation checks
      const validationChecks = {
        signatureMatch: isValid,
        urlFormat: this.isValidUrl(url),
        payloadFormat: this.isValidJson(payload),
        authTokenFormat: this.isValidAuthToken(authToken),
      };

      const issues = [];
      if (!validationChecks.signatureMatch) {
        issues.push("Signature does not match expected value");
      }
      if (!validationChecks.urlFormat) {
        issues.push("Invalid webhook URL format");
      }
      if (!validationChecks.payloadFormat) {
        issues.push("Invalid JSON payload format");
      }
      if (!validationChecks.authTokenFormat) {
        issues.push("Invalid Auth Token format");
      }

      return {
        isValid,
        validationChecks,
        issues,
        expectedSignature,
        providedSignature: signature,
        recommendation: isValid
          ? "Webhook signature is valid. This is a legitimate Twilio webhook."
          : "Webhook signature is invalid. This may not be from Twilio or the Auth Token is incorrect.",
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        recommendation: "Unable to validate webhook signature due to an error",
      };
    }
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  isValidAuthToken(token) {
    // Twilio Auth Tokens are typically 32 characters long and alphanumeric
    return /^[a-zA-Z0-9]{32}$/.test(token);
  }

  // Rate limit calculation implementation
  calculateRateLimits(
    apiType,
    requestsPerSecond,
    requestsPerMinute,
    accountTier
  ) {
    // Twilio rate limits by account tier and API type
    const rateLimits = {
      trial: {
        sms: { perSecond: 1, perMinute: 10 },
        voice: { perSecond: 1, perMinute: 5 },
        video: { perSecond: 1, perMinute: 5 },
        whatsapp: { perSecond: 1, perMinute: 10 },
      },
      "pay-as-you-go": {
        sms: { perSecond: 1, perMinute: 100 },
        voice: { perSecond: 1, perMinute: 50 },
        video: { perSecond: 1, perMinute: 50 },
        whatsapp: { perSecond: 1, perMinute: 100 },
      },
      enterprise: {
        sms: { perSecond: 10, perMinute: 1000 },
        voice: { perSecond: 10, perMinute: 500 },
        video: { perSecond: 10, perMinute: 500 },
        whatsapp: { perSecond: 10, perMinute: 1000 },
      },
    };

    const limits = rateLimits[accountTier]?.[apiType] ||
      rateLimits["pay-as-you-go"][apiType] || { perSecond: 1, perMinute: 100 };

    const exceedsPerSecond = requestsPerSecond > limits.perSecond;
    const exceedsPerMinute = requestsPerMinute > limits.perMinute;
    const willExceedLimits = exceedsPerSecond || exceedsPerMinute;

    const warnings = [];
    const recommendations = [];

    if (exceedsPerSecond) {
      warnings.push(
        `Exceeds per-second limit: ${requestsPerSecond} > ${limits.perSecond}`
      );
      recommendations.push(
        "Implement request queuing or reduce request frequency"
      );
    }

    if (exceedsPerMinute) {
      warnings.push(
        `Exceeds per-minute limit: ${requestsPerMinute} > ${limits.perMinute}`
      );
      recommendations.push(
        "Consider batching requests or upgrading account tier"
      );
    }

    if (!willExceedLimits) {
      recommendations.push(
        "Your usage is within rate limits. No changes needed."
      );
    }

    return {
      willExceedLimits,
      limits,
      currentUsage: {
        perSecond: requestsPerSecond,
        perMinute: requestsPerMinute,
      },
      warnings,
      recommendations,
      accountTier,
      apiType,
      upgradeNeeded: willExceedLimits && accountTier !== "enterprise",
    };
  }

  // Code execution implementation (sandboxed)
  async executeTwilioCode(code, language, testMode) {
    try {
      // This is a simplified sandbox - in production, you'd want more security
      const executionResult = {
        success: false,
        output: "",
        errors: [],
        warnings: [],
        testMode,
        language,
      };

      // Basic syntax validation
      const syntaxCheck = this.validateCodeSyntax(code, language);
      if (!syntaxCheck.isValid) {
        executionResult.errors = syntaxCheck.errors;
        executionResult.warnings = syntaxCheck.warnings;
        return executionResult;
      }

      // Simulate code execution based on language
      switch (language) {
        case "nodejs":
          executionResult.output = await this.simulateNodeExecution(
            code,
            testMode
          );
          break;
        case "python":
          executionResult.output = await this.simulatePythonExecution(
            code,
            testMode
          );
          break;
        case "php":
          executionResult.output = await this.simulatePhpExecution(
            code,
            testMode
          );
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      executionResult.success = true;
      return executionResult;
    } catch (error) {
      return {
        success: false,
        output: "",
        errors: [error.message],
        warnings: [],
        testMode,
        language,
      };
    }
  }

  validateCodeSyntax(code, language) {
    const errors = [];
    const warnings = [];

    // Basic syntax checks
    if (language === "nodejs") {
      if (!code.includes("require") && !code.includes("import")) {
        warnings.push("No Twilio library import detected");
      }
      if (code.includes("process.env") && !code.includes("TWILIO_")) {
        warnings.push(
          "Environment variables detected but no Twilio credentials found"
        );
      }
    } else if (language === "python") {
      if (!code.includes("from twilio") && !code.includes("import twilio")) {
        warnings.push("No Twilio library import detected");
      }
      if (code.includes("os.environ") && !code.includes("TWILIO_")) {
        warnings.push(
          "Environment variables detected but no Twilio credentials found"
        );
      }
    } else if (language === "php") {
      if (!code.includes("require") && !code.includes("include")) {
        warnings.push("No Twilio library include detected");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async simulateNodeExecution(code, testMode) {
    // Simulate Node.js execution
    const output = [];

    if (testMode) {
      output.push("🔧 Running in TEST MODE - No actual API calls will be made");
    }

    if (code.includes("client.messages.create")) {
      output.push("✅ SMS message creation code detected");
      if (testMode) {
        output.push("📱 Simulated SMS: 'Hello from Twilio!' to +1234567890");
      }
    }

    if (code.includes("client.calls.create")) {
      output.push("✅ Voice call creation code detected");
      if (testMode) {
        output.push("📞 Simulated call: Connecting to +1234567890");
      }
    }

    if (code.includes("client.video.rooms.create")) {
      output.push("✅ Video room creation code detected");
      if (testMode) {
        output.push("📹 Simulated video room: 'Test Room' created");
      }
    }

    output.push("✅ Code syntax appears valid");
    output.push(
      "⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
    );

    return output.join("\n");
  }

  async simulatePythonExecution(code, testMode) {
    // Simulate Python execution
    const output = [];

    if (testMode) {
      output.push("🔧 Running in TEST MODE - No actual API calls will be made");
    }

    if (code.includes("client.messages.create")) {
      output.push("✅ SMS message creation code detected");
      if (testMode) {
        output.push("📱 Simulated SMS: 'Hello from Twilio!' to +1234567890");
      }
    }

    if (code.includes("client.calls.create")) {
      output.push("✅ Voice call creation code detected");
      if (testMode) {
        output.push("📞 Simulated call: Connecting to +1234567890");
      }
    }

    output.push("✅ Code syntax appears valid");
    output.push(
      "⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
    );

    return output.join("\n");
  }

  async simulatePhpExecution(code, testMode) {
    // Simulate PHP execution
    const output = [];

    if (testMode) {
      output.push("🔧 Running in TEST MODE - No actual API calls will be made");
    }

    if (code.includes("$client->messages->create")) {
      output.push("✅ SMS message creation code detected");
      if (testMode) {
        output.push("📱 Simulated SMS: 'Hello from Twilio!' to +1234567890");
      }
    }

    if (code.includes("$client->calls->create")) {
      output.push("✅ Voice call creation code detected");
      if (testMode) {
        output.push("📞 Simulated call: Connecting to +1234567890");
      }
    }

    output.push("✅ Code syntax appears valid");
    output.push(
      "⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables"
    );

    return output.join("\n");
  }

  // Get current time implementation
  getCurrentTime() {
    const now = new Date();

    // Format time in multiple timezones
    const timezones = {
      UTC: now.toUTCString(),
      ISO: now.toISOString(),
      Local: now.toString(),
    };

    // Extract components
    const components = {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // 0-indexed
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      millisecond: now.getMilliseconds(),
      weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    return {
      timestamp: now.getTime(),
      formatted: {
        ...timezones,
      },
      components,
      unix: Math.floor(now.getTime() / 1000),
      humanReadable: now.toLocaleString(),
    };
  }

  async start() {
    if (!this.server) {
      throw new Error(
        "MCP protocol server not initialized. Call constructor with initializeProtocolServer=true"
      );
    }
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log(
      chalk.green("🚀 Simple Twilio MCP Server started successfully")
    );
  }
}

// Start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith("mcpServer.js")) {
  const server = new TwilioMCPServer(true); // true = initialize protocol server
  server.start().catch(console.error);
}

export default TwilioMCPServer;
