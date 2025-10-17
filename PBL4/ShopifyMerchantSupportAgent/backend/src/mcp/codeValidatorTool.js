import axios from "axios";

/**
 * Code Validator MCP Tool for Shopify Merchant Support Agent
 * Validates Shopify API endpoints, code snippets, and API compatibility
 */
export class CodeValidatorTool {
  constructor() {
    this.name = "code_validator";
    this.description =
      "Validate Shopify API endpoints, code snippets, and API compatibility";

    // Shopify API endpoint patterns
    this.apiPatterns = {
      admin: {
        rest: /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/[0-9]{4}-[0-9]{2}\/[a-zA-Z0-9\/\-_]+$/,
        graphql:
          /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/[0-9]{4}-[0-9]{2}\/graphql\.json$/,
        webhook:
          /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/admin\/api\/[0-9]{4}-[0-9]{2}\/webhooks\/[0-9]+$/,
      },
      storefront: {
        graphql:
          /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com\/api\/[0-9]{4}-[0-9]{2}\/graphql$/,
        accessToken: /^[a-zA-Z0-9]{32,}$/,
      },
      partner: {
        api: /^https:\/\/partners\.shopify\.com\/[0-9]+\/api\/[a-zA-Z0-9\/\-_]+$/,
      },
    };

    // HTTP methods supported by different Shopify APIs
    this.supportedMethods = {
      admin: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      storefront: ["GET", "POST"],
      webhook: ["POST"],
    };

    // Common Shopify API endpoints for validation
    this.commonEndpoints = {
      products: "/admin/api/2024-01/products",
      orders: "/admin/api/2024-01/orders",
      customers: "/admin/api/2024-01/customers",
      inventory: "/admin/api/2024-01/inventory_levels",
      webhooks: "/admin/api/2024-01/webhooks",
      graphql: "/admin/api/2024-01/graphql.json",
      storefrontGraphql: "/api/2024-01/graphql",
    };
  }

  /**
   * Extract code snippets and URLs from natural language queries
   * @param {string} query - The user query containing code or URLs
   * @returns {Object} Extracted code elements
   */
  extractCodeElements(query) {
    const elements = {
      urls: [],
      codeBlocks: [],
      apiCalls: [],
      errorCodes: [],
    };

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = query.match(urlPattern);
    if (urls) {
      elements.urls = urls;
    }

    // Extract code blocks (between ``` or `)
    const codeBlockPattern = /```[\s\S]*?```/g;
    const codeBlocks = query.match(codeBlockPattern);
    if (codeBlocks) {
      elements.codeBlocks = codeBlocks.map((block) =>
        block.replace(/```/g, "").trim()
      );
    }

    // Extract inline code (between `)
    const inlineCodePattern = /`([^`]+)`/g;
    const inlineCodes = query.match(inlineCodePattern);
    if (inlineCodes) {
      elements.codeBlocks.push(
        ...inlineCodes.map((code) => code.replace(/`/g, ""))
      );
    }

    // Extract API calls (common patterns)
    const apiCallPattern = /(GET|POST|PUT|DELETE|PATCH)\s+[^\s]+/gi;
    const apiCalls = query.match(apiCallPattern);
    if (apiCalls) {
      elements.apiCalls = apiCalls;
    }

    // Extract Shopify error codes
    const errorCodePattern = /[A-Z_]+_ERROR|ERROR_\d+|HTTP_\d+/g;
    const errorCodes = query.match(errorCodePattern);
    if (errorCodes) {
      elements.errorCodes = errorCodes;
    }

    return elements;
  }

  /**
   * Validate Shopify API endpoint URL
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateApiEndpoint(url) {
    const result = {
      isValid: false,
      type: null,
      version: null,
      endpoint: null,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    try {
      // Check if it's a valid URL
      const urlObj = new URL(url);

      // Check for Shopify domain patterns
      if (
        !urlObj.hostname.includes("shopify.com") &&
        !urlObj.hostname.includes("myshopify.com")
      ) {
        result.errors.push("URL does not appear to be a Shopify endpoint");
        return result;
      }

      // Validate Admin API endpoints
      if (urlObj.pathname.includes("/admin/api/")) {
        const adminMatch = urlObj.pathname.match(
          /\/admin\/api\/([0-9]{4}-[0-9]{2})\/(.+)/
        );
        if (adminMatch) {
          result.isValid = true;
          result.type = "admin";
          result.version = adminMatch[1];
          result.endpoint = adminMatch[2];

          // Check if version is current
          const currentVersion = "2024-01";
          if (adminMatch[1] !== currentVersion) {
            result.warnings.push(
              `API version ${adminMatch[1]} may not be the latest. Consider using ${currentVersion}`
            );
          }
        } else {
          result.errors.push("Invalid Admin API endpoint format");
        }
      }
      // Validate Storefront API endpoints
      else if (
        urlObj.pathname.includes("/api/") &&
        !urlObj.pathname.includes("/admin/")
      ) {
        const storefrontMatch = urlObj.pathname.match(
          /\/api\/([0-9]{4}-[0-9]{2})\/(.+)/
        );
        if (storefrontMatch) {
          result.isValid = true;
          result.type = "storefront";
          result.version = storefrontMatch[1];
          result.endpoint = storefrontMatch[2];
        } else {
          result.errors.push("Invalid Storefront API endpoint format");
        }
      }
      // Validate Partner API endpoints
      else if (urlObj.hostname.includes("partners.shopify.com")) {
        result.isValid = true;
        result.type = "partner";
        result.endpoint = urlObj.pathname;
      } else {
        result.errors.push("URL does not match known Shopify API patterns");
      }

      // Add suggestions for common endpoints
      if (result.isValid && result.type === "admin") {
        this.addEndpointSuggestions(result);
      }
    } catch (error) {
      result.errors.push(`Invalid URL format: ${error.message}`);
    }

    return result;
  }

  /**
   * Add suggestions for common API endpoints
   * @param {Object} result - Validation result object
   */
  addEndpointSuggestions(result) {
    const commonEndpoints = {
      products: "/admin/api/2024-01/products",
      orders: "/admin/api/2024-01/orders",
      customers: "/admin/api/2024-01/customers",
      inventory: "/admin/api/2024-01/inventory_levels",
      webhooks: "/admin/api/2024-01/webhooks",
      graphql: "/admin/api/2024-01/graphql.json",
    };

    const currentEndpoint = result.endpoint;
    const suggestions = [];

    Object.entries(commonEndpoints).forEach(([name, endpoint]) => {
      if (
        currentEndpoint.includes(name) ||
        endpoint.includes(currentEndpoint)
      ) {
        suggestions.push(`${name}: ${endpoint}`);
      }
    });

    if (suggestions.length > 0) {
      result.suggestions = suggestions;
    }
  }

  /**
   * Validate HTTP method compatibility with endpoint
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {string} apiType - Type of API (admin, storefront, etc.)
   * @returns {Object} Method validation result
   */
  validateHttpMethod(method, endpoint, apiType) {
    const result = {
      isValid: false,
      supportedMethods: [],
      errors: [],
      suggestions: [],
    };

    const supportedMethods = this.supportedMethods[apiType] || [];
    result.supportedMethods = supportedMethods;

    if (supportedMethods.includes(method.toUpperCase())) {
      result.isValid = true;
    } else {
      result.errors.push(
        `HTTP method ${method} is not supported for ${apiType} API`
      );
      result.suggestions.push(
        `Supported methods: ${supportedMethods.join(", ")}`
      );
    }

    // Add specific suggestions based on endpoint
    if (endpoint.includes("products") && method.toUpperCase() === "GET") {
      result.suggestions.push(
        "Use GET /admin/api/2024-01/products to retrieve products"
      );
    }

    return result;
  }

  /**
   * Validate code snippets for common Shopify API issues
   * @param {string} code - Code snippet to validate
   * @returns {Object} Code validation result
   */
  validateCodeSnippet(code) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      issues: [],
    };

    try {
      // Check for common JavaScript/Node.js issues
      if (code.includes("fetch(") || code.includes("axios.")) {
        // Check for proper error handling
        if (!code.includes("catch") && !code.includes(".catch")) {
          result.warnings.push("Consider adding error handling for API calls");
          result.suggestions.push(
            "Wrap API calls in try-catch blocks or use .catch() for promises"
          );
        }

        // Check for proper headers
        if (
          code.includes("X-Shopify-Access-Token") ||
          code.includes("X-Shopify-Shop-Domain")
        ) {
          result.warnings.push(
            "Make sure to use proper authentication headers"
          );
          result.suggestions.push(
            "Use 'X-Shopify-Access-Token' for Admin API and 'X-Shopify-Shop-Domain' for Storefront API"
          );
        }
      }

      // Check for GraphQL specific issues
      if (
        code.includes("graphql") ||
        code.includes("query") ||
        code.includes("mutation")
      ) {
        if (!code.includes("Content-Type: application/json")) {
          result.warnings.push(
            "GraphQL requests should include proper Content-Type header"
          );
          result.suggestions.push(
            "Add 'Content-Type: application/json' header for GraphQL requests"
          );
        }
      }

      // Check for webhook validation
      if (code.includes("webhook") || code.includes("hmac")) {
        if (!code.includes("crypto") && !code.includes("hmac")) {
          result.warnings.push(
            "Webhook validation should include HMAC verification"
          );
          result.suggestions.push(
            "Implement HMAC verification for webhook security"
          );
        }
      }

      // Check for rate limiting considerations
      if (code.includes("for") && code.includes("loop")) {
        result.warnings.push(
          "Consider rate limiting when making multiple API calls"
        );
        result.suggestions.push(
          "Implement rate limiting (40 requests/second for Admin API)"
        );
      }

      // Check for pagination
      if (
        code.includes("products") &&
        !code.includes("limit") &&
        !code.includes("page_info")
      ) {
        result.warnings.push(
          "Consider implementing pagination for large datasets"
        );
        result.suggestions.push(
          "Use 'limit' parameter or cursor-based pagination with 'page_info'"
        );
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Code validation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate Shopify error codes and provide solutions
   * @param {string} errorCode - Error code to validate
   * @returns {Object} Error code validation result
   */
  validateErrorCode(errorCode) {
    const result = {
      isValid: false,
      description: null,
      solution: null,
      documentation: null,
    };

    const commonErrors = {
      UNAUTHORIZED: {
        description: "Authentication failed or access token is invalid",
        solution:
          "Check your access token and ensure it has the required permissions",
        documentation: "https://shopify.dev/docs/api/usage/authentication",
      },
      FORBIDDEN: {
        description: "Insufficient permissions for this operation",
        solution:
          "Verify your app has the required scopes for this API endpoint",
        documentation: "https://shopify.dev/docs/api/usage/access-scopes",
      },
      NOT_FOUND: {
        description: "The requested resource was not found",
        solution: "Verify the resource ID and ensure the resource exists",
        documentation: "https://shopify.dev/docs/api/usage/rest-resources",
      },
      RATE_LIMITED: {
        description: "API rate limit exceeded",
        solution:
          "Implement exponential backoff and respect the 40 requests/second limit",
        documentation: "https://shopify.dev/docs/api/usage/rate-limits",
      },
      INVALID_REQUEST: {
        description: "The request format or parameters are invalid",
        solution:
          "Check request body format, required fields, and parameter types",
        documentation: "https://shopify.dev/docs/api/usage/rest-resources",
      },
    };

    const error = commonErrors[errorCode.toUpperCase()];
    if (error) {
      result.isValid = true;
      result.description = error.description;
      result.solution = error.solution;
      result.documentation = error.documentation;
    } else {
      result.description = "Unknown error code";
      result.solution =
        "Check Shopify's error documentation for this specific error";
      result.documentation = "https://shopify.dev/docs/api/usage/errors";
    }

    return result;
  }

  /**
   * Determine if code validator should be used
   * @param {string} query - User query
   * @returns {boolean} Whether to use code validator
   */
  shouldUseCodeValidator(query) {
    const codeKeywords = [
      "api",
      "endpoint",
      "url",
      "code",
      "javascript",
      "node",
      "python",
      "php",
      "error",
      "bug",
      "issue",
      "problem",
      "fix",
      "validate",
      "check",
      "shopify api",
      "rest api",
      "graphql",
      "webhook",
      "authentication",
      "access token",
      "hmac",
      "rate limit",
      "pagination",
      "headers",
      "http",
      "request",
      "response",
      "status code",
      "error code",
      "valid",
      "invalid",
      "correct",
      "incorrect",
      "working",
      "not working",
      "broken",
      "fix",
      "debug",
      "troubleshoot",
      "help with",
      "how to",
      "is this",
      "does this",
      "will this",
      "can i",
      "should i",
      "myshopify.com",
      "shopify.com",
      "admin/api",
      "storefront",
      "partner api",
      "fetch(",
      "axios",
      "curl",
      "postman",
      "request",
      "response",
      "status",
      "unauthorized",
      "forbidden",
      "not found",
      "rate limited",
      "invalid request",
      "bad request",
      "internal server error",
      "timeout",
      "connection",
      "network",
      "cors",
      "cors error",
      "preflight",
      "method not allowed",
      "content type",
      "json",
      "xml",
      "form data",
      "multipart",
      "bearer token",
      "oauth",
      "jwt",
      "session",
      "cookie",
      "header",
      "query parameter",
      "path parameter",
      "body",
      "payload",
      "data",
      "format",
      "syntax",
      "parse",
      "stringify",
      "encode",
      "decode",
      "base64",
      "utf-8",
      "encoding",
      "charset",
    ];

    const queryLower = query.toLowerCase();

    // Check for URL patterns
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/;
    const hasUrl = urlPattern.test(query);

    // Check for code patterns
    const codePattern =
      /```[\s\S]*?```|`[^`]+`|fetch\(|axios\.|curl|POST|GET|PUT|DELETE|PATCH/;
    const hasCode = codePattern.test(query);

    // Check for error patterns
    const errorPattern = /[A-Z_]+_ERROR|ERROR_\d+|HTTP_\d+|4\d\d|5\d\d/;
    const hasError = errorPattern.test(query);

    return (
      codeKeywords.some((keyword) => queryLower.includes(keyword)) ||
      hasUrl ||
      hasCode ||
      hasError
    );
  }

  /**
   * Main method to handle code validation requests
   * @param {string} query - User query containing code or API elements
   * @returns {Object} Code validation results
   */
  async validateCode(query) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        validations: [],
        summary: null,
      };
    }

    if (!this.shouldUseCodeValidator(query)) {
      return {
        error: "Code validation not needed for this query",
        validations: [],
        summary: null,
      };
    }

    try {
      console.log(`🔍 Validating code/API elements: ${query}`);

      const elements = this.extractCodeElements(query);
      const validations = [];

      // Validate URLs
      elements.urls.forEach((url) => {
        const validation = this.validateApiEndpoint(url);
        validations.push({
          type: "url",
          value: url,
          validation: validation,
        });
      });

      // Validate code blocks
      elements.codeBlocks.forEach((code) => {
        const validation = this.validateCodeSnippet(code);
        validations.push({
          type: "code",
          value: code.substring(0, 100) + (code.length > 100 ? "..." : ""),
          validation: validation,
        });
      });

      // Validate API calls
      elements.apiCalls.forEach((apiCall) => {
        const [method, ...urlParts] = apiCall.split(" ");
        const url = urlParts.join(" ");
        const endpointValidation = this.validateApiEndpoint(url);
        const methodValidation = this.validateHttpMethod(
          method,
          url,
          endpointValidation.type
        );

        validations.push({
          type: "api_call",
          value: apiCall,
          validation: {
            endpoint: endpointValidation,
            method: methodValidation,
          },
        });
      });

      // Validate error codes
      elements.errorCodes.forEach((errorCode) => {
        const validation = this.validateErrorCode(errorCode);
        validations.push({
          type: "error_code",
          value: errorCode,
          validation: validation,
        });
      });

      // Generate summary
      const summary = this.generateValidationSummary(validations, query);

      // Ensure we always have a summary if we have validations
      const finalSummary = summary || "Code validation completed successfully.";

      return {
        validations: validations,
        summary: finalSummary,
        elementsFound: {
          urls: elements.urls.length,
          codeBlocks: elements.codeBlocks.length,
          apiCalls: elements.apiCalls.length,
          errorCodes: elements.errorCodes.length,
        },
      };
    } catch (error) {
      console.error("Code validation error:", error);
      return {
        error: `Code validation failed: ${error.message}`,
        validations: [],
        summary: null,
      };
    }
  }

  /**
   * Generate a summary of validation results
   * @param {Array} validations - Array of validation results
   * @param {string} query - Original query for context
   * @returns {string} Summary text
   */
  generateValidationSummary(validations, query) {
    if (validations.length === 0) {
      return "No code or API elements found to validate.";
    }

    const totalValidations = validations.length;
    const validCount = validations.filter(
      (v) =>
        v.validation.isValid !== false &&
        (!v.validation.errors || v.validation.errors.length === 0)
    ).length;

    let summary = `Validated ${totalValidations} element${
      totalValidations > 1 ? "s" : ""
    }: ${validCount} valid, ${totalValidations - validCount} with issues`;

    // Add specific findings
    const errors = validations.filter(
      (v) => v.validation.errors && v.validation.errors.length > 0
    );
    const warnings = validations.filter(
      (v) => v.validation.warnings && v.validation.warnings.length > 0
    );

    if (errors.length > 0) {
      summary += `\n\n🚨 **Errors Found (${errors.length}):**`;
      errors.forEach((error) => {
        summary += `\n- ${error.type}: ${error.validation.errors.join(", ")}`;
      });
    }

    if (warnings.length > 0) {
      summary += `\n\n⚠️ **Warnings (${warnings.length}):**`;
      warnings.forEach((warning) => {
        summary += `\n- ${warning.type}: ${warning.validation.warnings.join(
          ", "
        )}`;
      });
    }

    // Add suggestions
    const suggestions = validations.filter(
      (v) => v.validation.suggestions && v.validation.suggestions.length > 0
    );
    if (suggestions.length > 0) {
      summary += `\n\n💡 **Suggestions:**`;
      suggestions.forEach((suggestion) => {
        summary += `\n- ${suggestion.validation.suggestions.join(", ")}`;
      });
    }

    return summary;
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
        "Validate Shopify API endpoint URLs",
        "Check HTTP method compatibility",
        "Analyze code snippets for common issues",
        "Validate Shopify error codes",
        "Provide API usage suggestions",
        "Check authentication patterns",
        "Validate GraphQL queries",
        "Webhook security validation",
        "Rate limiting recommendations",
        "Pagination best practices",
      ],
      examples: [
        "Is this Shopify API endpoint valid: https://mystore.myshopify.com/admin/api/2024-01/products?",
        "Check my JavaScript code for Shopify API issues",
        "What's wrong with this error: UNAUTHORIZED?",
        "Validate this GraphQL query for Shopify",
        "Is POST method supported for this endpoint?",
        "Check my webhook validation code",
      ],
    };
  }
}

export default CodeValidatorTool;
