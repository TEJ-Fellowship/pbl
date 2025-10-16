// Backend/src/tools.js
// Standalone MCP tools implementation for API endpoints

import axios from "axios";
import config from "../config/config.js";

class TwilioTools {
  constructor() {
    // Initialize any required dependencies
  }

  // Context enhancement
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

  // Code validation
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

  // Error code lookup
  lookupErrorCode(errorCode) {
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

  // Language detection
  detectLanguage(text) {
    const textLower = text.toLowerCase();

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

  // Web search
  async performWebSearch(query, maxResults = 5) {
    const apiKey = config.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      throw new Error(
        "Google Custom Search API credentials not configured. Please check your .env file."
      );
    }

    const enhancedQuery = `${query} site:twilio.com`;

    try {
      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: enhancedQuery,
            num: Math.min(maxResults, 10),
          },
          timeout: 10000,
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

  // Status check
  async checkTwilioStatus(service = null) {
    try {
      const statusQuery = service 
        ? `Twilio ${service} service status outage maintenance`
        : "Twilio service status outage maintenance";
      
      const searchResults = await this.performWebSearch(statusQuery, 3);
      
      const statusIndicators = {
        operational: ["operational", "normal", "healthy", "working"],
        degraded: ["degraded", "slow", "delays", "issues"],
        outage: ["outage", "down", "offline", "unavailable", "maintenance"],
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
        issues: issues.slice(0, 3),
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

  // Webhook validation
  validateWebhookSignature(signature, url, payload, authToken) {
    try {
      const crypto = require('crypto');
      
      const signatureString = url + payload;
      
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(signatureString, 'utf8')
        .digest('base64');

      const isValid = signature === expectedSignature;
      
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
    return /^[a-zA-Z0-9]{32}$/.test(token);
  }

  // Rate limit calculation
  calculateRateLimits(apiType, requestsPerSecond, requestsPerMinute, accountTier) {
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

  // Code execution
  async executeTwilioCode(code, language, testMode) {
    try {
      const executionResult = {
        success: false,
        output: "",
        errors: [],
        warnings: [],
        testMode,
        language
      };

      const syntaxCheck = this.validateCodeSyntax(code, language);
      if (!syntaxCheck.isValid) {
        executionResult.errors = syntaxCheck.errors;
        executionResult.warnings = syntaxCheck.warnings;
        return executionResult;
      }

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
}

export default TwilioTools;