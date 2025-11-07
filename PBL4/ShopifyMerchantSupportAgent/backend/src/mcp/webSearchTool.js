import axios from "axios";

/**
 * Web Search MCP Tool for Shopify Merchant Support Agent
 * Uses free APIs: DuckDuckGo Instant Answer and Wikipedia
 */
export class WebSearchTool {
  constructor() {
    this.name = "web_search";
    this.description =
      "Search the web for recent information and Shopify-related content";
    this.maxResults = 2; // Reduced for faster response
    this.timeout = 2000; // Optimized: Reduced from 3000ms to 2000ms for faster responses
  }

  /**
   * Search using DuckDuckGo Instant Answer API
   * @param {string} query - Search query
   * @returns {Object} Search results
   */
  async searchDuckDuckGo(query) {
    try {
      // Only prefix with Shopify for Shopify-related queries
      const isShopifyRelated =
        query.toLowerCase().includes("shopify") ||
        query.toLowerCase().includes("ecommerce") ||
        query.toLowerCase().includes("store");
      const searchQuery = isShopifyRelated ? `Shopify ${query}` : query;

      const response = await axios.get(`https://api.duckduckgo.com/`, {
        params: {
          q: searchQuery,
          format: "json",
          no_html: 1,
          skip_disambig: 1,
        },
        timeout: this.timeout,
      });

      const data = response.data;
      const results = [];

      // Extract Abstract (main answer)
      if (data.Abstract) {
        results.push({
          title: data.Heading || "DuckDuckGo Answer",
          content: data.Abstract,
          url: data.AbstractURL,
          source: "DuckDuckGo",
          type: "instant_answer",
        });
      }

      // Extract Related Topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 2).forEach((topic) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || "Related Topic",
              content: topic.Text,
              url: topic.FirstURL,
              source: "DuckDuckGo",
              type: "related_topic",
            });
          }
        });
      }

      return results;
    } catch (error) {
      console.error("DuckDuckGo search error:", error.message);
      return [];
    }
  }

  /**
   * Search using Wikipedia API
   * @param {string} query - Search query
   * @returns {Object} Search results
   */
  async searchWikipedia(query) {
    try {
      // First, search for articles
      // Only prefix with Shopify for Shopify-related queries
      const isShopifyRelated =
        query.toLowerCase().includes("shopify") ||
        query.toLowerCase().includes("ecommerce") ||
        query.toLowerCase().includes("store");
      const searchQuery = isShopifyRelated ? `Shopify ${query}` : query;

      const searchResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php`,
        {
          params: {
            action: "query",
            list: "search",
            srsearch: searchQuery,
            format: "json",
            srlimit: 2,
          },
          timeout: this.timeout,
        }
      );

      const searchResults = searchResponse.data.query?.search || [];
      const results = [];

      for (const article of searchResults) {
        try {
          // Get article summary
          const summaryResponse = await axios.get(
            `https://en.wikipedia.org/w/api.php`,
            {
              params: {
                action: "query",
                prop: "extracts",
                exintro: true,
                explaintext: true,
                exsectionformat: "plain",
                titles: article.title,
                format: "json",
              },
              timeout: this.timeout,
            }
          );

          const pages = summaryResponse.data.query?.pages;
          const pageId = Object.keys(pages)[0];
          const page = pages[pageId];

          if (page.extract) {
            results.push({
              title: article.title,
              content: page.extract.substring(0, 500) + "...",
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
                article.title
              )}`,
              source: "Wikipedia",
              type: "article",
            });
          }
        } catch (error) {
          console.error(
            `Wikipedia article fetch error for ${article.title}:`,
            error.message
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Wikipedia search error:", error.message);
      return [];
    }
  }

  /**
   * Search for Shopify-specific information
   * @param {string} query - Search query
   * @returns {Object} Search results
   */
  async searchShopifySpecific(query) {
    try {
      // Search Shopify's official documentation and help center
      const shopifyQueries = [
        `site:help.shopify.com ${query}`,
        `site:shopify.dev ${query}`,
        `site:partners.shopify.com ${query}`,
      ];

      const results = [];

      for (const searchQuery of shopifyQueries.slice(0, 1)) {
        try {
          const response = await axios.get(`https://api.duckduckgo.com/`, {
            params: {
              q: searchQuery,
              format: "json",
              no_html: 1,
            },
            timeout: this.timeout,
          });

          const data = response.data;
          if (data.Abstract) {
            results.push({
              title: data.Heading || "Shopify Documentation",
              content: data.Abstract,
              url: data.AbstractURL,
              source: "Shopify Official",
              type: "documentation",
            });
          }
        } catch (error) {
          console.error(
            `Shopify search error for ${searchQuery}:`,
            error.message
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Shopify-specific search error:", error.message);
      return [];
    }
  }

  /**
   * Determine if web search should be used
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @returns {boolean} Whether to use web search
   */
  shouldUseWebSearch(query, confidence) {
    const queryLower = query.toLowerCase();

    // Use web search when internal sources are insufficient
    const lowConfidence = confidence < 0.7; // Lowered threshold for better coverage

    // Keywords that indicate need for recent/external information
    const recentInfoKeywords = [
      "recent",
      "latest",
      "new",
      "updated",
      "current",
      "2024",
      "2025",
      "news",
      "announcement",
      "release",
      "update",
      "change",
      "deprecated",
      "status",
      "outage",
      "issue",
      "problem",
      "error",
      "bug",
      "fix",
      "tutorial",
      "guide",
      "how to",
      "step by step",
      "example",
      "breaking",
      "urgent",
      "critical",
      "important",
      "notice",
      "alert",
      "warning",
      "maintenance",
      "downtime",
      "slow",
      "unavailable",
      "offline",
      "broken",
      "failing",
    ];

    const hasRecentKeywords = recentInfoKeywords.some((keyword) =>
      queryLower.includes(keyword)
    );

    // Keywords that indicate external information is needed
    const externalInfoKeywords = [
      "what is",
      "how to",
      "when",
      "where",
      "why",
      "who",
      "which",
      "compare",
      "difference",
      "alternative",
      "best practice",
      "recommendation",
      "suggestion",
      "help",
      "support",
      "explain",
      "describe",
      "define",
      "meaning",
      "purpose",
      "benefit",
      "advantage",
      "disadvantage",
      "pros",
      "cons",
      "vs",
      "versus",
      "against",
      "better",
      "worse",
      "best",
      "worst",
      "top",
      "popular",
      "trending",
      "reviews",
      "ratings",
      "feedback",
      "opinions",
      "experiences",
      "stories",
      "case studies",
      "examples",
      "templates",
      "samples",
      "demos",
      "showcases",
    ];

    const hasExternalKeywords = externalInfoKeywords.some((keyword) =>
      queryLower.includes(keyword)
    );

    // Specific Shopify-related queries that need web search
    const shopifySpecificQueries = [
      "shopify vs",
      "shopify alternative",
      "shopify competitor",
      "shopify pricing",
      "shopify plan",
      "shopify features",
      "shopify limitations",
      "shopify problems",
      "shopify issues",
      "shopify complaints",
      "shopify reviews",
      "shopify ratings",
      "shopify feedback",
      "shopify experiences",
      "shopify success stories",
      "shopify case studies",
      "shopify examples",
      "shopify templates",
      "shopify themes",
      "shopify apps",
      "shopify integrations",
      "shopify partners",
      "shopify developers",
      "shopify community",
      "shopify forum",
      "shopify support",
      "shopify help",
      "shopify documentation",
      "shopify api",
      "shopify sdk",
      "shopify webhooks",
      "shopify payments",
      "shopify checkout",
      "shopify shipping",
      "shopify inventory",
      "shopify orders",
      "shopify customers",
      "shopify analytics",
      "shopify reports",
      "shopify dashboard",
      "shopify admin",
      "shopify storefront",
      "shopify mobile",
      "shopify pos",
      "shopify plus",
      "shopify enterprise",
      "shopify advanced",
      "shopify basic",
      "shopify starter",
      "shopify lite",
    ];

    const hasShopifySpecificQuery = shopifySpecificQueries.some((keyword) =>
      queryLower.includes(keyword)
    );

    // Check for questions that require external knowledge
    const questionPatterns = [
      /^what is/i,
      /^how to/i,
      /^when does/i,
      /^where can/i,
      /^why does/i,
      /^who can/i,
      /^which is/i,
      /^can you/i,
      /^could you/i,
      /^would you/i,
      /^should i/i,
      /^do you/i,
      /^are there/i,
      /^is there/i,
      /^does shopify/i,
      /^will shopify/i,
      /^has shopify/i,
      /^have you/i,
    ];

    const hasQuestionPattern = questionPatterns.some((pattern) =>
      pattern.test(query)
    );

    // Check for comparison or evaluation requests
    const comparisonPatterns = [
      /compare/i,
      /vs\.?/i,
      /versus/i,
      /better than/i,
      /worse than/i,
      /best/i,
      /worst/i,
      /top \d+/i,
      /ranking/i,
      /rate/i,
      /review/i,
      /opinion/i,
      /experience/i,
      /recommend/i,
      /suggest/i,
      /prefer/i,
      /choose/i,
      /select/i,
      /pick/i,
      /decide/i,
    ];

    const hasComparisonPattern = comparisonPatterns.some((pattern) =>
      pattern.test(query)
    );

    // Check for general knowledge queries (not Shopify-specific)
    const generalKnowledgePatterns = [
      /^who is/i,
      /^what is/i,
      /^when was/i,
      /^where is/i,
      /^why is/i,
      /^how does/i,
      /^tell me about/i,
      /^explain/i,
      /^describe/i,
      /^define/i,
    ];

    const isGeneralKnowledgeQuery = generalKnowledgePatterns.some((pattern) =>
      pattern.test(query)
    );
    const isNotShopifyRelated =
      !queryLower.includes("shopify") &&
      !queryLower.includes("ecommerce") &&
      !queryLower.includes("store");

    // Use web search if:
    // 1. Confidence is low (internal sources insufficient)
    // 2. Query asks for recent information
    // 3. Query asks for external information
    // 4. Query contains specific Shopify external info keywords
    // 5. Query is a question that might need external knowledge
    // 6. Query involves comparisons or evaluations
    // 7. Query is general knowledge (not Shopify-related)
    return (
      lowConfidence ||
      hasRecentKeywords ||
      hasExternalKeywords ||
      hasShopifySpecificQuery ||
      hasQuestionPattern ||
      hasComparisonPattern ||
      (queryLower.includes("shopify") &&
        (lowConfidence || hasQuestionPattern)) ||
      (isGeneralKnowledgeQuery && isNotShopifyRelated)
    );
  }

  /**
   * Main method to handle web search requests
   * @param {string} query - User query
   * @param {number} confidence - RAG confidence score
   * @returns {Object} Search results
   */
  async search(query, confidence = 0.5) {
    if (!query || typeof query !== "string") {
      return {
        error: "Invalid query provided",
        results: [],
        summary: null,
      };
    }

    // Always proceed with search if called - the orchestrator handles the decision
    try {
      console.log(
        `🔍 Performing web search for: ${query} (confidence: ${confidence})`
      );

      // Check if this is a general knowledge query (not Shopify-related)
      const isGeneralKnowledgeQuery =
        /^(who is|what is|when was|where is|why is|how does|tell me about|explain|describe|define)/i.test(
          query
        );
      const isNotShopifyRelated =
        !query.toLowerCase().includes("shopify") &&
        !query.toLowerCase().includes("ecommerce") &&
        !query.toLowerCase().includes("store");

      let shopifyResults = [];

      // Only search Shopify-specific sources for Shopify-related queries
      if (!isGeneralKnowledgeQuery || !isNotShopifyRelated) {
        shopifyResults = await this.searchShopifySpecific(query);

        // If we have good Shopify results, skip other searches to reduce latency
        if (shopifyResults.length >= 2) {
          const summary = this.generateSummary(shopifyResults, query);
          return {
            results: shopifyResults.slice(0, this.maxResults),
            summary: summary,
            sources: shopifyResults.map((r) => r.source),
            totalFound: shopifyResults.length,
          };
        }
      }

      // Perform parallel searches for general knowledge or when Shopify results are insufficient
      const [duckDuckGoResults, wikipediaResults] = await Promise.all([
        this.searchDuckDuckGo(query),
        this.searchWikipedia(query),
      ]);

      // Combine and deduplicate results
      const allResults = [
        ...shopifyResults,
        ...duckDuckGoResults,
        ...wikipediaResults,
      ];
      const uniqueResults = this.deduplicateResults(allResults);

      // Limit results
      const limitedResults = uniqueResults.slice(0, this.maxResults);

      // Generate summary
      const summary = this.generateSummary(limitedResults, query);

      return {
        results: limitedResults,
        summary: summary,
        sources: limitedResults.map((r) => r.source),
        totalFound: allResults.length,
      };
    } catch (error) {
      console.error("Web search error:", error);
      return {
        error: `Web search failed: ${error.message}`,
        results: [],
        summary: null,
      };
    }
  }

  /**
   * Remove duplicate results based on URL and title
   * @param {Array} results - Array of search results
   * @returns {Array} Deduplicated results
   */
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter((result) => {
      const key = `${result.url}-${result.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate a summary of search results
   * @param {Array} results - Array of search results
   * @param {string} query - Original query
   * @returns {string} Summary text
   */
  generateSummary(results, query) {
    if (results.length === 0) {
      return "No recent information found for this query.";
    }

    const sources = [...new Set(results.map((r) => r.source))];
    const sourceText = sources.length > 1 ? "multiple sources" : sources[0];

    let summary = `Found ${results.length} result${
      results.length > 1 ? "s" : ""
    } from ${sourceText}:`;

    results.forEach((result, index) => {
      summary += `\n\n**${index + 1}. ${result.title}** (${
        result.source
      })\n${result.content.substring(0, 200)}...`;
    });

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
        "DuckDuckGo Instant Answer search",
        "Wikipedia article search",
        "Shopify-specific documentation search",
        "Recent information lookup",
        "Factual question answering",
      ],
      examples: [
        "What are the latest Shopify API changes?",
        "Recent Shopify pricing updates",
        "How to integrate Shopify with new payment methods?",
        "What is Shopify's current policy on...?",
      ],
      apis: [
        "DuckDuckGo Instant Answer API (free)",
        "Wikipedia API (free)",
        "Shopify documentation search (free)",
      ],
    };
  }
}

export default WebSearchTool;
