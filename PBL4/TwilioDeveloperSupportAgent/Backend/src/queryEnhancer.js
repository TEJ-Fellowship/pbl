/**
 * Query Enhancer - Preprocessing utilities for query analysis
 *
 * This module extracts metadata from user queries to assist with:
 * - Query classification and routing
 * - Context enhancement for search
 * - Language and API detection
 *
 * These are utility functions that run automatically before classification,
 * separate from MCP tools which are for direct responses.
 */

class QueryEnhancer {
  constructor() {
    // No initialization needed - pure utility functions
  }

  /**
   * Analyze a query and extract metadata about language, API, error codes, etc.
   * This runs automatically as preprocessing for all queries.
   *
   * @param {string} query - The user's query
   * @param {string} context - Optional conversation context
   * @returns {Object} Enhancements object with detected metadata
   */
  analyzeQuery(query, context = "") {
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

    // Detect error codes (Twilio error codes are typically 5 digits)
    const errorMatches = query.match(/\b(2\d{4}|\d{5})\b/g);
    if (errorMatches) {
      enhancements.errorCodes = [...new Set(errorMatches)];
      enhancements.suggestedFocus = "error_resolution";
      enhancements.confidence += 0.3;
    }

    // Suggest focus area based on query intent
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

  /**
   * Detect programming language from code snippets or text
   *
   * @param {string} text - Text or code snippet to analyze
   * @returns {Object} Language detection result with confidence scores
   */
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

    // Score each language based on pattern matches
    const scores = {};

    for (const [lang, langPatterns] of Object.entries(patterns)) {
      scores[lang] = 0;
      for (const pattern of langPatterns) {
        if (pattern.test(text)) {
          scores[lang]++;
        }
      }
    }

    // Determine the most likely language
    const detectedLang = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    // Calculate confidence as ratio of matches to total possible patterns
    const maxScore = Math.max(...Object.values(scores));
    const confidence =
      maxScore > 0
        ? scores[detectedLang] / (maxScore + 1) // Normalize confidence
        : 0;

    return {
      language: scores[detectedLang] > 0 ? detectedLang : "unknown",
      confidence,
      scores,
    };
  }
}

export default QueryEnhancer;
