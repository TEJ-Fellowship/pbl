import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Web Search Tool for Stripe Documentation Fallback
 * Uses Google Custom Search API to find recent Stripe documentation and updates
 */
class WebSearchTool {
  constructor() {
    this.name = "web_search";
    this.description = "Search for recent Stripe documentation and updates";
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    this.baseUrl = "https://www.googleapis.com/customsearch/v1";
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Execute web search for Stripe-related queries
   * @param {string} query - User query
   * @returns {Object} - Search results with confidence score
   */
  async execute(query) {
    try {
      console.log(`🔍 Web Search Tool: Processing "${query}"`);

      if (!this.apiKey || !this.searchEngineId) {
        return {
          success: false,
          result: null,
          confidence: 0,
          message:
            "Google Custom Search API not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.",
        };
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log("📋 Using cached search results");
          return cached.result;
        }
      }

      // Perform search
      const searchQuery = this.buildSearchQuery(query);
      const results = await this.performSearch(searchQuery);

      // Cache results
      this.cache.set(cacheKey, {
        result: results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      console.error("❌ Web Search Tool Error:", error);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Build optimized search query for Stripe documentation
   * @param {string} query - Original user query
   * @returns {string} - Optimized search query
   */
  buildSearchQuery(query) {
    // Focus on official Stripe sources with Google Custom Search syntax
    const siteFilters = [
      "site:stripe.com",
      "site:support.stripe.com",
      "site:docs.stripe.com",
    ];

    // Add Stripe context to the query
    let searchQuery = `Stripe ${query}`;

    // Add site filters for Google Custom Search
    searchQuery += ` (${siteFilters.join(" OR ")})`;

    // Add recent date filter for updates
    searchQuery += " (2024 OR 2023)";

    return searchQuery;
  }

  /**
   * Perform actual search using Google Custom Search API
   * @param {string} searchQuery - Search query
   * @returns {Object} - Search results
   */
  async performSearch(searchQuery) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId, // Custom Search Engine ID
          q: searchQuery,
          num: 10, // Number of results
          safe: "active",
          fields: "items(title,link,snippet,pagemap)",
        },
        timeout: 10000,
      });

      const results = this.processSearchResults(response.data);
      const confidence = this.calculateConfidence(results, searchQuery);

      return {
        success: true,
        results,
        confidence,
        message: this.generateResponse(results, searchQuery),
      };
    } catch (error) {
      console.error("❌ Google Custom Search API Error:", error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Process and filter search results
   * @param {Object} apiResponse - Raw API response
   * @returns {Array} - Processed results
   */
  processSearchResults(apiResponse) {
    if (!apiResponse.items || apiResponse.items.length === 0) {
      return [];
    }

    return apiResponse.items
      .filter((result) => this.isRelevantResult(result))
      .map((result) => this.formatResult(result))
      .slice(0, 5); // Limit to top 5 results
  }

  /**
   * Check if search result is relevant to Stripe
   * @param {Object} result - Search result
   * @returns {boolean} - Whether result is relevant
   */
  isRelevantResult(result) {
    const url = (result.link || result.url)?.toLowerCase() || "";
    const title = result.title?.toLowerCase() || "";
    const description =
      (result.snippet || result.description)?.toLowerCase() || "";

    // Must be from official Stripe domains
    const officialDomains = [
      "stripe.com",
      "support.stripe.com",
      "docs.stripe.com",
    ];

    const isOfficialDomain = officialDomains.some((domain) =>
      url.includes(domain)
    );
    if (!isOfficialDomain) return false;

    // Filter out irrelevant pages
    const irrelevantPatterns = [
      "/jobs",
      "/careers",
      "/about",
      "/contact",
      "/privacy",
      "/terms",
      "/security",
    ];

    const isIrrelevant = irrelevantPatterns.some((pattern) =>
      url.includes(pattern)
    );
    if (isIrrelevant) return false;

    // Must contain relevant content
    const relevantKeywords = [
      "api",
      "webhook",
      "payment",
      "billing",
      "subscription",
      "charge",
      "refund",
      "dispute",
      "connect",
      "documentation",
    ];

    const hasRelevantContent = relevantKeywords.some(
      (keyword) => title.includes(keyword) || description.includes(keyword)
    );

    return hasRelevantContent;
  }

  /**
   * Format search result for display
   * @param {Object} result - Raw search result
   * @returns {Object} - Formatted result
   */
  formatResult(result) {
    return {
      title: result.title,
      url: result.link,
      description: result.snippet,
      publishedDate:
        result.pagemap?.metatags?.[0]?.["article:published_time"] || null,
      relevanceScore: this.calculateRelevanceScore(result),
    };
  }

  /**
   * Calculate relevance score for a result
   * @param {Object} result - Search result
   * @returns {number} - Relevance score (0-1)
   */
  calculateRelevanceScore(result) {
    let score = 0.5; // Base score

    const title = result.title?.toLowerCase() || "";
    const description = result.snippet?.toLowerCase() || "";
    const url = result.link?.toLowerCase() || "";

    // Higher score for documentation pages
    if (url.includes("/docs/")) score += 0.2;
    if (url.includes("/api/")) score += 0.2;
    if (url.includes("/webhooks/")) score += 0.1;

    // Higher score for recent content (Google Custom Search doesn't provide age directly)
    const publishedDate =
      result.pagemap?.metatags?.[0]?.["article:published_time"];
    if (publishedDate) {
      const pubDate = new Date(publishedDate);
      const now = new Date();
      const daysDiff = (now - pubDate) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) score += 0.1;
      if (daysDiff < 7) score += 0.05;
    }

    // Higher score for comprehensive content
    if (description.length > 100) score += 0.1;
    if (title.length > 20) score += 0.05;

    return Math.min(1, score);
  }

  /**
   * Calculate overall confidence for search results
   * @param {Array} results - Search results
   * @param {string} query - Original query
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(results, query) {
    if (results.length === 0) return 0;

    let confidence = 0.6; // Base confidence

    // Higher confidence with more results
    if (results.length >= 3) confidence += 0.2;
    if (results.length >= 5) confidence += 0.1;

    // Higher confidence with high relevance scores
    const avgRelevance =
      results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    confidence += avgRelevance * 0.2;

    // Higher confidence for official documentation
    const officialResults = results.filter((r) => r.url.includes("/docs/"));
    if (officialResults.length > 0) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Generate human-readable response for search results
   * @param {Array} results - Search results
   * @param {string} query - Original query
   * @returns {string} - Formatted response
   */
  generateResponse(results, query) {
    if (results.length === 0) {
      return "No recent Stripe documentation found for your query.";
    }

    let response = `Found ${results.length} relevant Stripe resources:\n\n`;

    results.forEach((result, index) => {
      response += `${index + 1}. **${result.title}**\n`;
      response += `   ${result.description}\n`;
      response += `   🔗 ${result.url}\n`;
      if (result.publishedDate) {
        response += `   📅 ${result.publishedDate}\n`;
      }
      response += "\n";
    });

    return response.trim();
  }

  /**
   * Generate cache key for query
   * @param {string} query - User query
   * @returns {string} - Cache key
   */
  generateCacheKey(query) {
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");
  }

  /**
   * Check if this tool should be used for the given query
   * @param {string} query - User query
   * @returns {boolean} - Whether to use this tool
   */
  shouldUse(query) {
    // Use web search when confidence is low or for recent updates
    const recentIndicators = [
      /latest|recent|new|updated/,
      /2024|2023/,
      /recently|just|now/,
    ];

    return recentIndicators.some((pattern) =>
      pattern.test(query.toLowerCase())
    );
  }
}

export default WebSearchTool;
