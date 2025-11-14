import config from "../../config/config.js";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

/**
 * Web Search Tool - Uses Google Custom Search API for web search
 * Wrapped as MCP tool for RPC requests
 */
class WebSearchTool {
  constructor() {
    this.name = "web_search";
    this.description =
      "Search the web for recent information and official sources (Stripe and non-Stripe).";
    this.isInitialized = true; // No initialization needed for direct API calls
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.currentIsStripeQuery = false;

    // Google Custom Search API configuration
    this.apiKey = config.GOOGLE_SEARCH_API_KEY;
    this.engineId = config.GOOGLE_SEARCH_ENGINE_ID;
    this.baseUrl = "https://www.googleapis.com/customsearch/v1";

    // Rate limiting for Google Search API - prevent quota exhaustion
    this.lastRequestTime = 0;
    this.minDelayBetweenRequests = 1000; // 1 second minimum (Google has 100 queries/day free tier)
    this.requestQueue = [];
    this.isProcessingQueue = false;

    // Track API quota usage
    this.dailyRequestCount = 0;
    this.lastResetDate = new Date().toDateString();
  }

  /**
   * Initialize Google Custom Search API configuration
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (!this.apiKey || !this.engineId) {
      console.error(
        "❌ [WebSearchTool] Google Search API credentials not configured"
      );
      console.error(
        "💡 [WebSearchTool] Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in your .env file"
      );
      return false;
    }

    console.log("✅ [WebSearchTool] Google Custom Search API configured");
    return true;
  }

  /**
   * Execute web search via Google Custom Search API
   * @param {string} query - User query
   * @returns {Object} - Search results with confidence score
   */
  async execute(query) {
    try {
      console.log(`🔍 [WebSearchTool] Processing "${query}"`);

      // Check API credentials
      if (!this.apiKey || !this.engineId) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            result: null,
            confidence: 0,
            message:
              "Google Custom Search API not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID.",
          };
        }
      }

      // Check daily quota (reset daily)
      const currentDate = new Date().toDateString();
      if (currentDate !== this.lastResetDate) {
        this.dailyRequestCount = 0;
        this.lastResetDate = currentDate;
        console.log("📅 [WebSearchTool] Daily quota reset");
      }

      // Check if we've exceeded daily quota (100 free queries/day)
      if (this.dailyRequestCount >= 100) {
        console.warn(
          "⚠️ [WebSearchTool] Daily quota limit reached (100 queries/day)"
        );
        return {
          success: false,
          result: null,
          confidence: 0,
          message:
            "Google Custom Search API daily quota exceeded. Please try again tomorrow or upgrade your plan.",
        };
      }

      // Optional cache bypass if user requests redo/refresh
      const wantsRefresh = /\b(redo|refresh|update now|run again)\b/i.test(
        query
      );

      // Check cache first (unless refresh requested)
      const cacheKey = this.generateCacheKey(query);
      if (!wantsRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log("📋 [WebSearchTool] Using cached search results");
          return cached.result;
        }
      }

      // Determine context and build search query
      const isStripe = this.isStripeQuery(query);
      this.currentIsStripeQuery = isStripe;
      const searchQuery = this.buildSearchQuery(query, isStripe);

      console.log(
        `🔍 [WebSearchTool] Calling Google Custom Search API with query: "${searchQuery}"`
      );

      // Rate limiting: Enforce minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
        console.log(
          `⏳ [WebSearchTool] Throttling: Waiting ${Math.round(
            waitTime
          )}ms since last request (min ${
            this.minDelayBetweenRequests
          }ms required)...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Update last request time
      this.lastRequestTime = Date.now();

      // Build Google Custom Search API request
      const searchParams = this.buildGoogleSearchParams(searchQuery, isStripe);

      console.log(
        `🔧 [WebSearchTool] Google Search API request: ${JSON.stringify(
          searchParams,
          null,
          2
        )}`
      );

      // Make API request
      let apiResponse;
      try {
        const response = await axios.get(this.baseUrl, {
          params: searchParams,
          timeout: 10000, // 10 second timeout
        });

        apiResponse = response.data;
        this.dailyRequestCount++;

        console.log(
          `✅ [WebSearchTool] Google API call successful (quota: ${this.dailyRequestCount}/100)`
        );
      } catch (error) {
        console.error(
          `❌ [WebSearchTool] Google API call failed:`,
          error.message
        );

        // Handle specific Google API errors
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;

          if (status === 429) {
            return {
              success: false,
              result: null,
              confidence: 0,
              error:
                "Google Custom Search API quota exceeded. Please try again later.",
            };
          } else if (status === 400) {
            return {
              success: false,
              result: null,
              confidence: 0,
              error: `Google Custom Search API error: ${
                errorData?.error?.message || "Invalid request"
              }`,
            };
          }
        }

        return {
          success: false,
          result: null,
          confidence: 0,
          error: error.message,
        };
      }

      // Transform Google API response to our expected format
      const results = this.transformGoogleResponse(apiResponse, searchQuery);

      // Cache results (always overwrite if refresh)
      this.cache.set(cacheKey, {
        result: results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      console.error("❌ [WebSearchTool] Error:", error.message);
      console.error("❌ [WebSearchTool] Stack:", error.stack);
      return {
        success: false,
        result: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Transform Google Custom Search API response to our expected format
   * @param {Object} googleResponse - Response from Google Custom Search API
   * @param {string} query - Original query
   * @returns {Object} - Transformed results
   */
  transformGoogleResponse(googleResponse, query) {
    try {
      // Handle null/undefined response
      if (!googleResponse) {
        console.warn(
          "⚠️ [WebSearchTool] transformGoogleResponse received null/undefined"
        );
        return {
          success: false,
          results: [],
          confidence: 0,
          message: "No response from Google Custom Search API",
        };
      }

      // Check for API errors
      if (googleResponse.error) {
        console.error(
          "❌ [WebSearchTool] Google API Error:",
          googleResponse.error
        );
        return {
          success: false,
          results: [],
          confidence: 0,
          message: `Google Custom Search API error: ${
            googleResponse.error.message || "Unknown error"
          }`,
        };
      }

      // Extract results from Google API response
      // Google Custom Search API format: { items: [...] }
      let results = [];

      if (googleResponse.items && Array.isArray(googleResponse.items)) {
        console.log(
          `✅ [WebSearchTool] Found ${googleResponse.items.length} items in Google API response`
        );
        results = googleResponse.items.map((item, index) => ({
          title: item.title || `Result ${index + 1}`,
          url: item.link || item.url || "",
          description: item.snippet || item.htmlSnippet || "",
          publishedDate:
            item.pagemap?.metatags?.[0]?.["article:published_time"] ||
            item.pagemap?.metatags?.[0]?.["og:updated_time"] ||
            null,
          relevanceScore: 0.9 - index * 0.1, // Higher relevance for Google results
        }));
      } else if (googleResponse.searchInformation?.totalResults === "0") {
        console.warn("⚠️ [WebSearchTool] No results found for query");
      } else {
        console.warn(
          "⚠️ [WebSearchTool] Unexpected Google API response format"
        );
        console.warn(
          "⚠️ [WebSearchTool] Response keys:",
          Object.keys(googleResponse)
        );
      }

      // Calculate confidence
      const confidence = this.calculateConfidence(results, query);

      // Generate formatted response message
      const message =
        results.length > 0
          ? this.generateResponse(results, query)
          : "No results found for your query.";

      return {
        success: results.length > 0,
        results,
        confidence,
        message,
      };
    } catch (error) {
      console.error(
        "❌ [WebSearchTool] Error transforming Google API response:",
        error.message
      );
      return {
        success: false,
        result: null,
        confidence: 0,
        error: `Failed to parse Google API response: ${error.message}`,
      };
    }
  }

  /**
   * Build Google Custom Search API parameters
   * @param {string} query - Search query
   * @param {boolean} isStripe - Whether this is a Stripe-specific query
   * @returns {Object} - API parameters
   */
  buildGoogleSearchParams(query, isStripe = false) {
    const params = {
      key: this.apiKey,
      cx: this.engineId,
      q: query,
      num: 10, // Number of results
      safe: "active", // Safe search
    };

    // Add site filters for Stripe queries
    if (isStripe) {
      params.q = `${query} site:stripe.com OR site:support.stripe.com OR site:docs.stripe.com`;
    }

    // Add date filters if query mentions recent/current/latest
    if (
      /\b(recent|current|latest|new|updated|2025|2024|now|today)\b/i.test(query)
    ) {
      // Google allows date restrictions in the query itself
      params.q = `${params.q} (2025 OR 2024)`;
    }

    return params;
  }

  /**
   * Build optimized search query for Stripe documentation
   * @param {string} query - Original user query
   * @returns {string} - Optimized search query
   */
  buildSearchQuery(query, isStripe = false) {
    if (isStripe) {
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
      searchQuery += " (2025 OR 2024)";

      return searchQuery;
    }

    // General web search (non-Stripe)
    let searchQuery = query.trim();

    // Encourage recent content for users asking for latest/updates
    const recencyHints = [
      "latest",
      "recent",
      "today",
      "now",
      "breaking",
      "update",
      "updates",
    ];
    if (recencyHints.some((t) => query.toLowerCase().includes(t))) {
      // Add recent years as hints; API-level dateRestrict handled separately
      searchQuery += " (2025 OR 2024)";
    }

    return searchQuery;
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

    if (this.currentIsStripeQuery) {
      // Must be from official Stripe domains when searching Stripe
      const officialDomains = [
        "stripe.com",
        "support.stripe.com",
        "docs.stripe.com",
      ];

      const isOfficialDomain = officialDomains.some((domain) =>
        url.includes(domain)
      );
      if (!isOfficialDomain) return false;
    }

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

    // Content relevance: adapt to Stripe vs general web
    if (this.currentIsStripeQuery) {
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

    // For general searches, be more permissive but still ensure substance
    const generalKeywords = [
      "latest",
      "update",
      "breaking",
      "news",
      "timeline",
      "summary",
      "explained",
      "report",
      "analysis",
      "official",
    ];
    const hasGeneralSignal = generalKeywords.some(
      (k) => title.includes(k) || description.includes(k)
    );

    // If not matched, still allow if title/description are reasonably descriptive
    return hasGeneralSignal || description.length > 60 || title.length > 20;
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

    if (this.currentIsStripeQuery) {
      // Higher score for documentation pages
      if (url.includes("/docs/")) score += 0.2;
      if (url.includes("/api/")) score += 0.2;
      if (url.includes("/webhooks/")) score += 0.1;
    } else {
      // For general web, prioritize news/official sources
      const newsSignals = [
        "/news",
        "/articles",
        "/story",
        "/world",
        "/middle-east",
        "live",
      ].some((s) => url.includes(s));
      if (newsSignals) score += 0.2;
      const officialSignals = [".gov", ".mil", "un.org", "europa.eu"].some(
        (s) => url.includes(s)
      );
      if (officialSignals) score += 0.15;
      const keywordSignals = [
        "latest",
        "breaking",
        "update",
        "timeline",
        "explained",
      ].some((k) => title.includes(k) || description.includes(k));
      if (keywordSignals) score += 0.15;
    }

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

    if (this.currentIsStripeQuery) {
      // Higher confidence for official documentation
      const officialResults = results.filter((r) => r.url.includes("/docs/"));
      if (officialResults.length > 0) confidence += 0.1;
    } else {
      // For general web, boost if there are news/official domains
      const newsOrOfficial = results.filter((r) => {
        const u = (r.url || "").toLowerCase();
        return (
          [
            "bbc.com",
            "reuters.com",
            "apnews.com",
            "aljazeera.com",
            "nytimes.com",
            "washingtonpost.com",
          ].some((d) => u.includes(d)) ||
          [".gov", "un.org", "europa.eu"].some((d) => u.includes(d))
        );
      });
      if (newsOrOfficial.length > 0) confidence += 0.1;
    }

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
      return "No recent results found for your query.";
    }

    let response = `Found ${results.length} relevant resources:\n\n`;

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
      /latest|recent|new|updated|today|breaking|now/,
      /2025|2024/,
      /recently|just|now/,
    ];

    return recentIndicators.some((pattern) =>
      pattern.test(query.toLowerCase())
    );
  }

  /**
   * Detect if the query is about Stripe
   * @param {string} query
   * @returns {boolean}
   */
  isStripeQuery(query) {
    const q = query.toLowerCase();
    // Direct mention or strong payment-platform signals
    const direct = q.includes("stripe");
    const strongSignals = [
      "payment intent",
      "connect platform",
      "webhook secret",
      "checkout session",
      "stripe js",
      "stripe cli",
    ];
    const hasSignals = strongSignals.some((s) => q.includes(s));
    return direct || hasSignals;
  }

  /**
   * Compute additional search params for Google Custom Search API
   * such as dateRestrict/sort when users ask for the latest updates
   * @param {string} originalQuery
   * @param {boolean} isStripe
   */
  getAdditionalSearchParams(originalQuery, isStripe) {
    const q = originalQuery.toLowerCase();
    const wantsLatest = [
      "latest",
      "recent",
      "today",
      "now",
      "breaking",
      "update",
      "updates",
      "new",
    ].some((t) => q.includes(t));
    const params = {};

    if (wantsLatest) {
      // Bias towards the most recent results
      // d7 = last 7 days, d1 = last day (too strict sometimes)
      params.dateRestrict =
        q.includes("today") || q.includes("now") || q.includes("breaking")
          ? "d1"
          : "d7";
      params.sort = "date";
    }

    // Keep safe search active by default (already set), nothing else for now
    return params;
  }
}

export default WebSearchTool;
