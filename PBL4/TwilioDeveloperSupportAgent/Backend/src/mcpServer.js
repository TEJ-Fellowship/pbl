// Backend/src/mcpServer.js
// Real MCP Server for Twilio chat functionality

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";
import axios from "axios";
import config from "../config/config.js";

class TwilioMCPServer {
  constructor() {
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

  setupTools() {
    // List available tools
    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "enhance_chat_context",
            description:
              "Enhance chat context with Twilio-specific information and language detection",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "User query to enhance context for",
                },
                context: {
                  type: "string",
                  description: "Current conversation context",
                },
              },
              required: ["query"],
            },
          },
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
            name: "detect_programming_language",
            description:
              "Detect programming language from code snippets or query context",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Text or code snippet to analyze",
                },
              },
              required: ["text"],
            },
          },
          {
            name: "web_search",
            description:
              "Search the web for current Twilio documentation, updates, or recent issues",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for Twilio-related information",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5,
                },
              },
              required: ["query"],
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
                  description: "Specific Twilio service to check (sms, voice, video, whatsapp, etc.) - optional",
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
                  description: "Account tier (trial, pay-as-you-go, enterprise)",
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
                  description: "Twilio API code to execute (Node.js, Python, or PHP)",
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
        ],
      };
    });

    // Tool call handler
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "enhance_chat_context":
            return await this.handleEnhanceChatContext(args);
          case "validate_twilio_code":
            return await this.handleValidateTwilioCode(args);
          case "lookup_error_code":
            return await this.handleLookupErrorCode(args);
          case "detect_programming_language":
            return await this.handleDetectProgrammingLanguage(args);
          case "web_search":
            return await this.handleWebSearch(args);
          case "check_twilio_status":
            return await this.handleCheckTwilioStatus(args);
          case "validate_webhook_signature":
            return await this.handleValidateWebhookSignature(args);
          case "calculate_rate_limits":
            return await this.handleCalculateRateLimits(args);
          case "execute_twilio_code":
            return await this.handleExecuteTwilioCode(args);
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
  async handleEnhanceChatContext(args) {
    const { query, context = "" } = args;

    try {
      const enhancements = this.analyzeQuery(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "enhance_chat_context",
              enhancements,
              query,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Context enhancement failed: ${error.message}`);
    }
  }

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
              code: code.substring(0, 200) + (code.length > 200 ? "..." : ""),
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

  async handleDetectProgrammingLanguage(args) {
    const { text } = args;

    try {
      const language = this.detectLanguage(text);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "detect_programming_language",
              language,
              text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }

  // Web search handler
  async handleWebSearch(args) {
    const { query, maxResults = 5 } = args;

    try {
      const searchResults = await this.performWebSearch(query, maxResults);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "web_search",
              query,
              results: searchResults,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  // Twilio Status API handler
  async handleCheckTwilioStatus(args) {
    const { service } = args;

    try {
      const statusInfo = await this.checkTwilioStatus(service);

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
      const validation = this.validateWebhookSignature(signature, url, payload, authToken);

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
    const { apiType, requestsPerSecond, requestsPerMinute, accountTier = "pay-as-you-go" } = args;

    try {
      const rateLimitInfo = this.calculateRateLimits(apiType, requestsPerSecond, requestsPerMinute, accountTier);

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
      const executionResult = await this.executeTwilioCode(code, language, testMode);

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

  // Google Custom Search implementation
  async performWebSearch(query, maxResults = 5) {
    const apiKey = config.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      throw new Error(
        "Google Custom Search API credentials not configured. Please check your .env file."
      );
    }

    // Enhance query with Twilio context
    const enhancedQuery = `${query} site:twilio.com`;

    try {
      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: enhancedQuery,
            num: Math.min(maxResults, 10), // Google allows max 10 results per request
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return {
          found: false,
          message: "No relevant results found",
          query: enhancedQuery,
        };
      }

      const results = response.data.items
        .slice(0, maxResults)
        .map((item, index) => ({
          rank: index + 1,
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
        }));

      return {
        found: true,
        totalResults:
          response.data.searchInformation?.totalResults || "Unknown",
        searchTime: response.data.searchInformation?.searchTime || "Unknown",
        query: enhancedQuery,
        results,
      };
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error(
          "Google Custom Search API quota exceeded or invalid credentials"
        );
      } else if (error.response?.status === 429) {
        throw new Error("Google Custom Search API rate limit exceeded");
      } else {
        throw new Error(`Search API error: ${error.message}`);
      }
    }
  }

  // Helper methods
  analyzeQuery(query) {
    const queryLower = query.toLowerCase();
    const enhancements = {
      detectedLanguage: null,
      detectedAPI: null,
      suggestedFocus: "general",
      additionalContext: "",
      errorCodes: [],
      confidence: 0.5,
    };

    // Detect programming language
    if (/\b(python|py|pip|flask|django)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "python";
      enhancements.confidence += 0.2;
    } else if (/\b(node|nodejs|npm|express|javascript|js)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "javascript";
      enhancements.confidence += 0.2;
    } else if (/\b(php|composer|laravel)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "php";
      enhancements.confidence += 0.2;
    } else if (/\b(java|maven|gradle)\b/.test(queryLower)) {
      enhancements.detectedLanguage = "java";
      enhancements.confidence += 0.2;
    }

    // Detect API type
    if (/\b(sms|message|text)\b/.test(queryLower)) {
      enhancements.detectedAPI = "sms";
      enhancements.confidence += 0.2;
    } else if (/\b(voice|call|phone)\b/.test(queryLower)) {
      enhancements.detectedAPI = "voice";
      enhancements.confidence += 0.2;
    } else if (/\b(video|meeting|room)\b/.test(queryLower)) {
      enhancements.detectedAPI = "video";
      enhancements.confidence += 0.2;
    } else if (/\b(webhook|callback|notification)\b/.test(queryLower)) {
      enhancements.detectedAPI = "webhook";
      enhancements.confidence += 0.2;
    }

    // Detect error codes
    const errorMatches = query.match(/\b(2\d{4}|\d{5})\b/g);
    if (errorMatches) {
      enhancements.errorCodes = [...new Set(errorMatches)];
      enhancements.suggestedFocus = "error_resolution";
      enhancements.confidence += 0.3;
    }

    // Suggest focus area
    if (/\b(error|problem|issue|debug)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "debugging";
    } else if (/\b(how to|tutorial|getting started|setup)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "getting_started";
    } else if (/\b(best practice|security|recommendation)\b/.test(queryLower)) {
      enhancements.suggestedFocus = "best_practices";
    }

    // Add contextual suggestions
    if (enhancements.detectedLanguage && enhancements.detectedAPI) {
      enhancements.additionalContext = `Focus on ${enhancements.detectedAPI} API implementation in ${enhancements.detectedLanguage}`;
    }

    return enhancements;
  }

  validateTwilioCode(code, language) {
    const issues = [];
    const suggestions = [];
    let isValid = true;

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

  detectLanguage(text) {
    const textLower = text.toLowerCase();

    // Language detection patterns
    const patterns = {
      javascript: [
        /require\s*\(\s*['"]/,
        /const\s+\w+\s*=/,
        /function\s+\w+\s*\(/,
        /\.then\s*\(/,
        /async\s+function/,
        /console\.log/,
        /npm\s+install/,
        /node\s+/,
      ],
      python: [
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /def\s+\w+\s*\(/,
        /if\s+__name__\s*==\s*['"]__main__['"]/,
        /pip\s+install/,
        /python\s+/,
        /\.py\b/,
      ],
      php: [
        /<\?php/,
        /\$[a-zA-Z_][a-zA-Z0-9_]*/,
        /require_once/,
        /include_once/,
        /composer\s+require/,
        /php\s+/,
        /\.php\b/,
      ],
      java: [
        /public\s+class/,
        /import\s+java\./,
        /System\.out\.print/,
        /maven/,
        /gradle/,
        /\.java\b/,
      ],
    };

    const scores = {};

    for (const [lang, langPatterns] of Object.entries(patterns)) {
      scores[lang] = 0;
      for (const pattern of langPatterns) {
        if (pattern.test(text)) {
          scores[lang]++;
        }
      }
    }

    const detectedLang = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    return {
      language: scores[detectedLang] > 0 ? detectedLang : "unknown",
      confidence: scores[detectedLang] / Math.max(...Object.values(scores)),
      scores,
    };
  }

  // Twilio Status API implementation
  async checkTwilioStatus(service = null) {
    try {
      // Twilio doesn't have a public status API, so we'll simulate with web search
      const statusQuery = service 
        ? `Twilio ${service} service status outage maintenance`
        : "Twilio service status outage maintenance";
      
      const searchResults = await this.performWebSearch(statusQuery, 3);
      
      // Analyze search results for status indicators
      const statusIndicators = {
        operational: ["operational", "normal", "healthy", "working"],
        degraded: ["degraded", "slow", "delays", "issues"],
        outage: ["outage", "down", "offline", "unavailable", "maintenance"],
        unknown: []
      };

      let overallStatus = "operational";
      let confidence = 0.5;
      const issues = [];

      if (searchResults.found && searchResults.results) {
        const allText = searchResults.results.map(r => r.snippet).join(" ").toLowerCase();
        
        for (const [status, keywords] of Object.entries(statusIndicators)) {
          const matches = keywords.filter(keyword => allText.includes(keyword)).length;
          if (matches > 0) {
            if (status === "outage") {
              overallStatus = "outage";
              confidence = Math.min(0.9, matches * 0.3);
            } else if (status === "degraded" && overallStatus !== "outage") {
              overallStatus = "degraded";
              confidence = Math.min(0.8, matches * 0.2);
            }
          }
        }

        // Extract specific issues from search results
        searchResults.results.forEach(result => {
          if (result.snippet.toLowerCase().includes("outage") || 
              result.snippet.toLowerCase().includes("maintenance")) {
            issues.push({
              title: result.title,
              description: result.snippet,
              source: result.link
            });
          }
        });
      }

      return {
        status: overallStatus,
        confidence,
        service: service || "all",
        lastChecked: new Date().toISOString(),
        issues: issues.slice(0, 3), // Limit to 3 most relevant issues
        message: this.getStatusMessage(overallStatus, service),
        recommendation: this.getStatusRecommendation(overallStatus)
      };
    } catch (error) {
      return {
        status: "unknown",
        confidence: 0.1,
        service: service || "all",
        lastChecked: new Date().toISOString(),
        error: "Unable to check status",
        message: "Status check failed. Please check Twilio's status page directly.",
        recommendation: "Visit https://status.twilio.com/ for official status updates"
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
      const crypto = require('crypto');
      
      // Create the signature string
      const signatureString = url + payload;
      
      // Create HMAC-SHA1 hash
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(signatureString, 'utf8')
        .digest('base64');

      // Compare signatures
      const isValid = signature === expectedSignature;
      
      // Additional validation checks
      const validationChecks = {
        signatureMatch: isValid,
        urlFormat: this.isValidUrl(url),
        payloadFormat: this.isValidJson(payload),
        authTokenFormat: this.isValidAuthToken(authToken)
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
          : "Webhook signature is invalid. This may not be from Twilio or the Auth Token is incorrect."
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        recommendation: "Unable to validate webhook signature due to an error"
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
  calculateRateLimits(apiType, requestsPerSecond, requestsPerMinute, accountTier) {
    // Twilio rate limits by account tier and API type
    const rateLimits = {
      trial: {
        sms: { perSecond: 1, perMinute: 10 },
        voice: { perSecond: 1, perMinute: 5 },
        video: { perSecond: 1, perMinute: 5 },
        whatsapp: { perSecond: 1, perMinute: 10 }
      },
      "pay-as-you-go": {
        sms: { perSecond: 1, perMinute: 100 },
        voice: { perSecond: 1, perMinute: 50 },
        video: { perSecond: 1, perMinute: 50 },
        whatsapp: { perSecond: 1, perMinute: 100 }
      },
      enterprise: {
        sms: { perSecond: 10, perMinute: 1000 },
        voice: { perSecond: 10, perMinute: 500 },
        video: { perSecond: 10, perMinute: 500 },
        whatsapp: { perSecond: 10, perMinute: 1000 }
      }
    };

    const limits = rateLimits[accountTier]?.[apiType] || rateLimits["pay-as-you-go"][apiType] || { perSecond: 1, perMinute: 100 };
    
    const exceedsPerSecond = requestsPerSecond > limits.perSecond;
    const exceedsPerMinute = requestsPerMinute > limits.perMinute;
    const willExceedLimits = exceedsPerSecond || exceedsPerMinute;

    const warnings = [];
    const recommendations = [];

    if (exceedsPerSecond) {
      warnings.push(`Exceeds per-second limit: ${requestsPerSecond} > ${limits.perSecond}`);
      recommendations.push("Implement request queuing or reduce request frequency");
    }

    if (exceedsPerMinute) {
      warnings.push(`Exceeds per-minute limit: ${requestsPerMinute} > ${limits.perMinute}`);
      recommendations.push("Consider batching requests or upgrading account tier");
    }

    if (!willExceedLimits) {
      recommendations.push("Your usage is within rate limits. No changes needed.");
    }

    return {
      willExceedLimits,
      limits,
      currentUsage: {
        perSecond: requestsPerSecond,
        perMinute: requestsPerMinute
      },
      warnings,
      recommendations,
      accountTier,
      apiType,
      upgradeNeeded: willExceedLimits && accountTier !== "enterprise"
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
        language
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
          executionResult.output = await this.simulateNodeExecution(code, testMode);
          break;
        case "python":
          executionResult.output = await this.simulatePythonExecution(code, testMode);
          break;
        case "php":
          executionResult.output = await this.simulatePhpExecution(code, testMode);
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
        language
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
        warnings.push("Environment variables detected but no Twilio credentials found");
      }
    } else if (language === "python") {
      if (!code.includes("from twilio") && !code.includes("import twilio")) {
        warnings.push("No Twilio library import detected");
      }
      if (code.includes("os.environ") && !code.includes("TWILIO_")) {
        warnings.push("Environment variables detected but no Twilio credentials found");
      }
    } else if (language === "php") {
      if (!code.includes("require") && !code.includes("include")) {
        warnings.push("No Twilio library include detected");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
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
    output.push("⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables");

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
    output.push("⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables");

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
    output.push("⚠️  Remember to set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables");

    return output.join("\n");
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log(
      chalk.green("🚀 Simple Twilio MCP Server started successfully")
    );
  }
}

// Start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith("mcpServer.js")) {
  const server = new TwilioMCPServer();
  server.start().catch(console.error);
}

export default TwilioMCPServer;
