// Backend/src/mcpServer.js
// Real MCP Server for Twilio chat functionality

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";

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
