/**
 * Code Validator Tool for Stripe API Validation
 * Validates Stripe API endpoints, HTTP methods, and code snippets
 */
class CodeValidatorTool {
  constructor() {
    this.name = "code_validator";
    this.description = "Validate Stripe API endpoints and code snippets";
    this.stripeApiBase = "https://api.stripe.com/v1";

    // Valid Stripe API endpoints
    this.validEndpoints = {
      charges: {
        methods: ["GET", "POST"],
        path: "/v1/charges",
        description: "Create or retrieve charges",
      },
      customers: {
        methods: ["GET", "POST", "PUT", "DELETE"],
        path: "/v1/customers",
        description: "Manage customer objects",
      },
      payment_intents: {
        methods: ["GET", "POST", "PUT"],
        path: "/v1/payment_intents",
        description: "Create or manage payment intents",
      },
      webhooks: {
        methods: ["GET", "POST"],
        path: "/v1/webhook_endpoints",
        description: "Manage webhook endpoints",
      },
      subscriptions: {
        methods: ["GET", "POST", "PUT", "DELETE"],
        path: "/v1/subscriptions",
        description: "Manage subscriptions",
      },
      invoices: {
        methods: ["GET", "POST", "PUT"],
        path: "/v1/invoices",
        description: "Manage invoices",
      },
      disputes: {
        methods: ["GET", "POST"],
        path: "/v1/disputes",
        description: "Handle disputes",
      },
      refunds: {
        methods: ["GET", "POST"],
        path: "/v1/refunds",
        description: "Process refunds",
      },
    };

    // Common HTTP methods for Stripe API
    this.validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    // Deprecated endpoints
    this.deprecatedEndpoints = [
      "/v1/account",
      "/v1/application_fees",
      "/v1/bitcoin_receivers",
    ];
  }

  /**
   * Execute code validation
   * @param {string} query - User query containing code or API references
   * @returns {Object} - Validation results with confidence score
   */
  async execute(query) {
    try {
      console.log(`🔍 Code Validator Tool: Processing "${query}"`);

      const validations = [];

      // Extract and validate API endpoints
      const endpoints = this.extractEndpoints(query);
      endpoints.forEach((endpoint) => {
        const validation = this.validateEndpoint(endpoint);
        validations.push(validation);
      });

      // Extract and validate HTTP methods
      const methods = this.extractMethods(query);
      methods.forEach((method) => {
        const validation = this.validateMethod(method);
        validations.push(validation);
      });

      // Extract and validate code snippets
      const codeSnippets = this.extractCodeSnippets(query);
      codeSnippets.forEach((snippet) => {
        const validation = this.validateCodeSnippet(snippet);
        validations.push(validation);
      });

      // Extract and validate API keys
      const apiKeys = this.extractApiKeys(query);
      apiKeys.forEach((key) => {
        const validation = this.validateApiKey(key);
        validations.push(validation);
      });

      const confidence = this.calculateConfidence(validations);
      const overallStatus = this.determineOverallStatus(validations);

      return {
        success: true,
        validations,
        confidence,
        overallStatus,
        message: this.generateResponse(validations, query),
      };
    } catch (error) {
      console.error("❌ Code Validator Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Extract API endpoints from query
   * @param {string} query - User query
   * @returns {Array} - Array of endpoints
   */
  extractEndpoints(query) {
    const endpointPatterns = [
      /\/v1\/[a-zA-Z_]+/g,
      /api\.stripe\.com\/v1\/[a-zA-Z_]+/g,
      /stripe\.com\/v1\/[a-zA-Z_]+/g,
    ];

    const endpoints = [];
    endpointPatterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        endpoints.push(...matches);
      }
    });

    return [...new Set(endpoints)]; // Remove duplicates
  }

  /**
   * Extract HTTP methods from query
   * @param {string} query - User query
   * @returns {Array} - Array of HTTP methods
   */
  extractMethods(query) {
    const methodPattern = /\b(GET|POST|PUT|DELETE|PATCH)\b/gi;
    const matches = query.match(methodPattern);
    return matches ? [...new Set(matches.map((m) => m.toUpperCase()))] : [];
  }

  /**
   * Extract code snippets from query
   * @param {string} query - User query
   * @returns {Array} - Array of code snippets
   */
  extractCodeSnippets(query) {
    const codePatterns = [
      /```[\s\S]*?```/g, // Markdown code blocks
      /`[^`]+`/g, // Inline code
      /curl\s+[^`]+/gi, // cURL commands
      /fetch\([^)]+\)/gi, // Fetch API calls
      /axios\.[^)]+\)/gi, // Axios calls
    ];

    const snippets = [];
    codePatterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        snippets.push(...matches);
      }
    });

    return snippets;
  }

  /**
   * Extract API keys from query
   * @param {string} query - User query
   * @returns {Array} - Array of potential API keys
   */
  extractApiKeys(query) {
    const keyPatterns = [
      /sk_(test|live)_[a-zA-Z0-9]+/g,
      /pk_(test|live)_[a-zA-Z0-9]+/g,
      /rk_(test|live)_[a-zA-Z0-9]+/g,
    ];

    const keys = [];
    keyPatterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        keys.push(...matches);
      }
    });

    return keys;
  }

  /**
   * Validate API endpoint
   * @param {string} endpoint - API endpoint
   * @returns {Object} - Validation result
   */
  validateEndpoint(endpoint) {
    const normalizedEndpoint = endpoint.replace(/^https?:\/\/[^\/]+/, "");
    const endpointName = normalizedEndpoint.replace("/v1/", "");

    const validation = {
      type: "endpoint",
      value: endpoint,
      isValid: false,
      issues: [],
      suggestions: [],
    };

    // Check if endpoint exists
    if (this.validEndpoints[endpointName]) {
      validation.isValid = true;
      validation.description = this.validEndpoints[endpointName].description;
    } else {
      validation.issues.push(`Unknown endpoint: ${endpointName}`);
      validation.suggestions.push(
        "Check the Stripe API documentation for valid endpoints"
      );
    }

    // Check for deprecated endpoints
    if (this.deprecatedEndpoints.includes(normalizedEndpoint)) {
      validation.issues.push("This endpoint is deprecated");
      validation.suggestions.push("Use the recommended alternative endpoint");
    }

    return validation;
  }

  /**
   * Validate HTTP method
   * @param {string} method - HTTP method
   * @returns {Object} - Validation result
   */
  validateMethod(method) {
    const validation = {
      type: "method",
      value: method,
      isValid: this.validMethods.includes(method),
      issues: [],
      suggestions: [],
    };

    if (!validation.isValid) {
      validation.issues.push(`Invalid HTTP method: ${method}`);
      validation.suggestions.push(
        `Use one of: ${this.validMethods.join(", ")}`
      );
    }

    return validation;
  }

  /**
   * Validate code snippet
   * @param {string} snippet - Code snippet
   * @returns {Object} - Validation result
   */
  validateCodeSnippet(snippet) {
    const validation = {
      type: "code",
      value: snippet,
      isValid: true,
      issues: [],
      suggestions: [],
    };

    // Check for common issues
    if (snippet.includes("localhost") && !snippet.includes("127.0.0.1")) {
      validation.issues.push("Using localhost instead of 127.0.0.1");
      validation.suggestions.push(
        "Consider using 127.0.0.1 for better compatibility"
      );
    }

    if (snippet.includes("http://") && snippet.includes("api.stripe.com")) {
      validation.issues.push("Using HTTP instead of HTTPS");
      validation.suggestions.push("Always use HTTPS for Stripe API calls");
    }

    if (snippet.includes("sk_live_") && snippet.includes("test")) {
      validation.issues.push("Mixing live keys with test data");
      validation.suggestions.push("Use test keys for development");
    }

    // Check for proper error handling
    if (snippet.includes("fetch") && !snippet.includes("catch")) {
      validation.issues.push("Missing error handling");
      validation.suggestions.push(
        "Add try-catch or .catch() for error handling"
      );
    }

    if (validation.issues.length > 0) {
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Validate API key
   * @param {string} key - API key
   * @returns {Object} - Validation result
   */
  validateApiKey(key) {
    const validation = {
      type: "api_key",
      value: key,
      isValid: true,
      issues: [],
      suggestions: [],
    };

    // Check key format
    if (
      !key.startsWith("sk_") &&
      !key.startsWith("pk_") &&
      !key.startsWith("rk_")
    ) {
      validation.isValid = false;
      validation.issues.push("Invalid API key format");
      validation.suggestions.push(
        "Stripe API keys should start with sk_, pk_, or rk_"
      );
    }

    // Check for test vs live keys
    if (key.includes("_test_")) {
      validation.suggestions.push(
        "Using test key - switch to live key for production"
      );
    } else if (key.includes("_live_")) {
      validation.suggestions.push(
        "Using live key - ensure this is for production use"
      );
    }

    // Security warnings
    if (key.includes("sk_live_")) {
      validation.issues.push("Live secret key detected in code");
      validation.suggestions.push(
        "Never commit live secret keys to version control"
      );
    }

    return validation;
  }

  /**
   * Calculate overall confidence score
   * @param {Array} validations - All validation results
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(validations) {
    if (validations.length === 0) return 0;

    const validCount = validations.filter((v) => v.isValid).length;
    const totalCount = validations.length;

    return validCount / totalCount;
  }

  /**
   * Determine overall validation status
   * @param {Array} validations - All validation results
   * @returns {string} - Overall status
   */
  determineOverallStatus(validations) {
    if (validations.length === 0) return "no_code_found";

    const invalidCount = validations.filter((v) => !v.isValid).length;

    if (invalidCount === 0) return "all_valid";
    if (invalidCount === validations.length) return "all_invalid";
    return "partial_valid";
  }

  /**
   * Generate human-readable response
   * @param {Array} validations - All validation results
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(validations, query) {
    if (validations.length === 0) {
      return "No Stripe API code found to validate.";
    }

    let response = `**Code Validation Results:**\n\n`;

    validations.forEach((validation, index) => {
      const status = validation.isValid ? "✅" : "❌";
      response += `${status} **${validation.type.toUpperCase()}**: ${
        validation.value
      }\n`;

      if (validation.description) {
        response += `   📝 ${validation.description}\n`;
      }

      if (validation.issues.length > 0) {
        response += `   ⚠️ Issues:\n`;
        validation.issues.forEach((issue) => {
          response += `      • ${issue}\n`;
        });
      }

      if (validation.suggestions.length > 0) {
        response += `   💡 Suggestions:\n`;
        validation.suggestions.forEach((suggestion) => {
          response += `      • ${suggestion}\n`;
        });
      }

      response += "\n";
    });

    const status = this.determineOverallStatus(validations);
    const statusEmoji =
      status === "all_valid" ? "✅" : status === "all_invalid" ? "❌" : "⚠️";
    response += `${statusEmoji} **Overall Status**: ${status
      .replace("_", " ")
      .toUpperCase()}`;

    return response.trim();
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    const codeIndicators = [
      /\/v1\//, // API endpoints
      /api\.stripe\.com/, // Stripe API URLs
      /curl|fetch|axios/, // HTTP client code
      /sk_|pk_|rk_/, // API keys
      /```|`[^`]+`/, // Code blocks
      /javascript|node\.js|python/, // Programming languages
    ];

    return codeIndicators.some((pattern) => pattern.test(query.toLowerCase()));
  }
}

export default CodeValidatorTool;
