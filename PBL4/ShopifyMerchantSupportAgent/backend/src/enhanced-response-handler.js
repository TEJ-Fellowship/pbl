import MarkdownIt from "markdown-it";

/**
 * Enhanced Response Handler for Tier 2 improvements
 * Implements source citation, confidence scoring, code formatting, and edge case handling
 */
export class EnhancedResponseHandler {
  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
    });

    // Configure markdown-it for code highlighting
    this.md.set({
      highlight: function (str, lang) {
        if (
          lang &&
          ["javascript", "js", "json", "html", "css", "bash", "shell"].includes(
            lang
          )
        ) {
          return `<pre class="code-block"><code class="language-${lang}">${str}</code></pre>`;
        }
        return `<pre class="code-block"><code>${str}</code></pre>`;
      },
    });
  }

  /**
   * Calculate confidence score based on search results and context quality
   * @param {Array} results - Search results from retriever
   * @param {string} query - Original user query
   * @param {string} answer - Generated answer
   * @returns {Object} Confidence score and level
   */
  calculateConfidence(results, query, answer) {
    let confidenceScore = 0;
    let confidenceLevel = "Low";
    let confidenceFactors = [];

    // Factor 1: Number of relevant results (0-30 points)
    const resultCount = results.length;
    if (resultCount >= 4) {
      confidenceScore += 30;
      confidenceFactors.push("Multiple relevant sources found");
    } else if (resultCount >= 2) {
      confidenceScore += 20;
      confidenceFactors.push("Several relevant sources found");
    } else if (resultCount >= 1) {
      confidenceScore += 10;
      confidenceFactors.push("Limited sources found");
    } else {
      confidenceFactors.push("No sources found");
    }

    // Factor 2: Average relevance score (0-25 points)
    if (results.length > 0) {
      const avgScore =
        results.reduce((sum, r) => sum + r.score, 0) / results.length;
      if (avgScore >= 0.8) {
        confidenceScore += 25;
        confidenceFactors.push("High relevance scores");
      } else if (avgScore >= 0.6) {
        confidenceScore += 15;
        confidenceFactors.push("Good relevance scores");
      } else if (avgScore >= 0.4) {
        confidenceScore += 10;
        confidenceFactors.push("Moderate relevance scores");
      } else {
        confidenceFactors.push("Low relevance scores");
      }
    }

    // Factor 3: Answer completeness (0-20 points)
    const answerLength = answer.length;
    const queryComplexity = this.assessQueryComplexity(query);

    if (answerLength > 200 && queryComplexity === "high") {
      confidenceScore += 20;
      confidenceFactors.push("Comprehensive answer for complex query");
    } else if (answerLength > 100 && queryComplexity === "medium") {
      confidenceScore += 15;
      confidenceFactors.push("Good answer for moderate query");
    } else if (answerLength > 50) {
      confidenceScore += 10;
      confidenceFactors.push("Basic answer provided");
    } else {
      confidenceFactors.push("Short answer");
    }

    // Factor 4: Technical accuracy indicators (0-15 points)
    const technicalTerms = [
      "api",
      "endpoint",
      "authentication",
      "webhook",
      "graphql",
      "rest",
      "oauth",
      "token",
    ];
    const queryLower = query.toLowerCase();
    const answerLower = answer.toLowerCase();

    const technicalMatches = technicalTerms.filter(
      (term) => queryLower.includes(term) && answerLower.includes(term)
    );

    if (technicalMatches.length >= 3) {
      confidenceScore += 15;
      confidenceFactors.push("Strong technical alignment");
    } else if (technicalMatches.length >= 1) {
      confidenceScore += 10;
      confidenceFactors.push("Some technical alignment");
    }

    // Factor 5: Source diversity (0-10 points)
    const sourceTypes = new Set(results.map((r) => r.searchType));
    if (sourceTypes.size >= 2) {
      confidenceScore += 10;
      confidenceFactors.push("Multiple search methods used");
    } else if (sourceTypes.size === 1) {
      confidenceScore += 5;
      confidenceFactors.push("Single search method used");
    }

    // Determine confidence level
    if (confidenceScore >= 80) {
      confidenceLevel = "High";
    } else if (confidenceScore >= 60) {
      confidenceLevel = "Medium";
    } else if (confidenceScore >= 40) {
      confidenceLevel = "Low";
    } else {
      confidenceLevel = "Very Low";
    }

    return {
      score: Math.min(confidenceScore, 100),
      level: confidenceLevel,
      factors: confidenceFactors,
    };
  }

  /**
   * Assess query complexity based on keywords and structure
   * @param {string} query - User query
   * @returns {string} Complexity level
   */
  assessQueryComplexity(query) {
    const complexKeywords = [
      "api",
      "authentication",
      "webhook",
      "graphql",
      "oauth",
      "integration",
      "customize",
      "advanced",
    ];
    const simpleKeywords = ["what", "how", "basic", "simple", "start"];

    const queryLower = query.toLowerCase();
    const complexCount = complexKeywords.filter((kw) =>
      queryLower.includes(kw)
    ).length;
    const simpleCount = simpleKeywords.filter((kw) =>
      queryLower.includes(kw)
    ).length;

    if (complexCount >= 2) return "high";
    if (simpleCount >= 2) return "low";
    return "medium";
  }

  /**
   * Format sources with proper citations
   * @param {Array} results - Search results
   * @returns {string} Formatted source citations
   */
  formatSourceCitations(results) {
    if (!results || results.length === 0) {
      return "**Sources:** No sources found";
    }

    const citations = results.map((result, index) => {
      const sourceTitle = result.metadata?.title || "Unknown Source";
      const sourceUrl = result.metadata?.url || "";
      const score = result.score.toFixed(3);
      const searchType = result.searchType;

      let citation = `${
        index + 1
      }. **${sourceTitle}** (Score: ${score}, ${searchType})`;

      if (sourceUrl) {
        citation += ` - [View Source](${sourceUrl})`;
      }

      return citation;
    });

    return `**Sources:**\n${citations.join("\n")}`;
  }

  /**
   * Format response with confidence indicator
   * @param {string} answer - Generated answer
   * @param {Object} confidence - Confidence data
   * @returns {string} Formatted response with confidence
   */
  formatResponseWithConfidence(answer, confidence) {
    const confidenceEmoji = this.getConfidenceEmoji(confidence.level);
    const confidenceText = `${confidenceEmoji} **Confidence: ${confidence.level}** (${confidence.score}/100)`;

    let confidenceDetails = "";
    if (confidence.factors.length > 0) {
      confidenceDetails = `\n\n*Based on: ${confidence.factors.join(", ")}*`;
    }

    return `${confidenceText}${confidenceDetails}\n\n${answer}`;
  }

  /**
   * Get emoji for confidence level
   * @param {string} level - Confidence level
   * @returns {string} Emoji
   */
  getConfidenceEmoji(level) {
    switch (level) {
      case "High":
        return "🟢";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟠";
      case "Very Low":
        return "🔴";
      default:
        return "⚪";
    }
  }

  /**
   * Handle edge cases with fallback responses
   * @param {string} query - User query
   * @param {Array} results - Search results
   * @param {Error} error - Error if any
   * @returns {string} Fallback response
   */
  handleEdgeCases(query, results, error) {
    // Case 1: No results found
    if (!results || results.length === 0) {
      return this.getNoResultsFallback(query);
    }

    // Case 2: Error occurred
    if (error) {
      return this.getErrorFallback(error, query);
    }

    // Case 3: Very low confidence results
    const confidence = this.calculateConfidence(results, query, "");
    if (confidence.level === "Very Low") {
      return this.getLowConfidenceFallback(query);
    }

    return null; // No edge case detected
  }

  /**
   * Get fallback response for no results
   * @param {string} query - User query
   * @returns {string} Fallback response
   */
  getNoResultsFallback(query) {
    const suggestions = this.generateQuerySuggestions(query);

    return `🔴 **Confidence: Very Low** (0/100)

*I couldn't find definitive information about "${query}" in the available Shopify documentation.*

**Suggestions to try:**
${suggestions.map((s) => `• ${s}`).join("\n")}

**Alternative approaches:**
• Try rephrasing your question with different keywords
• Break down complex questions into simpler parts
• Check the [Shopify Help Center](https://help.shopify.com/) for additional resources
• Contact Shopify Support for specific technical issues

*If you believe this information should be available, please let me know and I can help refine the search.*`;
  }

  /**
   * Get fallback response for errors
   * @param {Error} error - Error object
   * @param {string} query - User query
   * @returns {string} Fallback response
   */
  getErrorFallback(error, query) {
    return `🔴 **Confidence: Very Low** (0/100)

*I encountered an error while processing your question about "${query}".*

**Error details:** ${error.message || "Unknown error occurred"}

**What you can do:**
• Try rephrasing your question
• Check if your question contains special characters that might cause issues
• Try asking a simpler version of your question
• Contact support if the issue persists

*I apologize for the inconvenience. The system is designed to handle most queries smoothly, but occasionally technical issues can occur.*`;
  }

  /**
   * Get fallback response for low confidence
   * @param {string} query - User query
   * @returns {string} Fallback response
   */
  getLowConfidenceFallback(query) {
    return `🟠 **Confidence: Low** (25/100)

*I found some information about "${query}" but I'm not entirely confident in the accuracy or completeness of the response.*

**What I found:**
• Limited documentation matches
• Information may be incomplete or outdated

**Recommendations:**
• Verify the information with official Shopify documentation
• Try asking a more specific question
• Consider contacting Shopify Support for authoritative guidance

*I want to ensure you get accurate information, so I'm flagging this response as having low confidence.*`;
  }

  /**
   * Generate query suggestions based on the original query
   * @param {string} query - Original query
   * @returns {Array} Array of suggested queries
   */
  generateQuerySuggestions(query) {
    const suggestions = [];
    const queryLower = query.toLowerCase();

    // API-related suggestions
    if (queryLower.includes("api")) {
      suggestions.push(
        'Try: "Shopify REST API basics" or "GraphQL Admin API overview"'
      );
    }

    // Authentication suggestions
    if (queryLower.includes("auth") || queryLower.includes("login")) {
      suggestions.push(
        'Try: "Shopify authentication methods" or "OAuth setup"'
      );
    }

    // Product suggestions
    if (queryLower.includes("product")) {
      suggestions.push(
        'Try: "Creating products in Shopify" or "Product management API"'
      );
    }

    // Order suggestions
    if (queryLower.includes("order")) {
      suggestions.push('Try: "Managing orders" or "Order API endpoints"');
    }

    // Theme suggestions
    if (queryLower.includes("theme") || queryLower.includes("design")) {
      suggestions.push('Try: "Theme customization" or "Liquid templating"');
    }

    // General suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        'Try: "Shopify basics" or "Getting started with Shopify"'
      );
      suggestions.push(
        'Try: "Shopify features overview" or "Common Shopify tasks"'
      );
    }

    return suggestions;
  }

  /**
   * Format code blocks with proper markdown rendering
   * @param {string} text - Text containing code blocks
   * @returns {string} Formatted text with rendered code blocks
   */
  formatCodeBlocks(text) {
    // Convert markdown code blocks to HTML
    return this.md.render(text);
  }

  /**
   * Process and enhance the complete response
   * @param {string} answer - Generated answer
   * @param {Array} results - Search results
   * @param {string} query - User query
   * @param {Error} error - Error if any
   * @returns {Object} Enhanced response object
   */
  processResponse(answer, results, query, error) {
    // Handle edge cases first
    const edgeCaseResponse = this.handleEdgeCases(query, results, error);
    if (edgeCaseResponse) {
      return {
        answer: edgeCaseResponse,
        confidence: {
          score: 0,
          level: "Very Low",
          factors: ["Edge case detected"],
        },
        sources: "No sources available",
        formatted: edgeCaseResponse,
      };
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(results, query, answer);

    // Format sources
    const sources = this.formatSourceCitations(results);

    // Format response with confidence
    const responseWithConfidence = this.formatResponseWithConfidence(
      answer,
      confidence
    );

    // Combine everything
    const fullResponse = `${responseWithConfidence}\n\n---\n\n${sources}`;

    // Format code blocks
    const formattedResponse = this.formatCodeBlocks(fullResponse);

    return {
      answer: responseWithConfidence,
      confidence,
      sources,
      formatted: formattedResponse,
      rawAnswer: answer,
    };
  }
}

export default EnhancedResponseHandler;
