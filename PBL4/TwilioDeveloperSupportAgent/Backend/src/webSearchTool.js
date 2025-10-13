// Backend/src/webSearchTool.js
// Web Search Tool for Twilio Developer Support Agent
// Searches for recent Twilio updates, issues, and community discussions

import axios from "axios";
import * as cheerio from "cheerio";
import { format, subDays, parseISO } from "date-fns";

class WebSearchTool {
  constructor() {
    this.searchEngines = {
      google: {
        baseUrl: "https://www.google.com/search",
        params: {
          q: "",
          num: 10,
          tbs: "qdr:d", // Past day
          safe: "off",
        },
      },
      duckduckgo: {
        baseUrl: "https://html.duckduckgo.com/html",
        params: {
          q: "",
          kl: "us-en",
        },
      },
    };

    this.twilioSources = [
      "twilio.com",
      "github.com/twilio",
      "stackoverflow.com",
      "reddit.com/r/twilio",
      "dev.to",
      "medium.com",
      "twilio.com/blog",
      "support.twilio.com",
    ];

    this.searchCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate Twilio-specific search queries
   */
  generateSearchQueries(originalQuery) {
    const baseQuery = originalQuery.toLowerCase();
    const queries = [];

    // Original query
    queries.push(originalQuery);

    // Twilio-specific variations
    if (!baseQuery.includes("twilio")) {
      queries.push(`${originalQuery} twilio`);
    }

    // Add site-specific queries for better results
    this.twilioSources.forEach((site) => {
      queries.push(`site:${site} ${originalQuery}`);
    });

    // Add recent time modifiers
    queries.push(`${originalQuery} twilio 2024`);
    queries.push(`${originalQuery} twilio recent`);
    queries.push(`${originalQuery} twilio update`);

    // Add error-specific queries if error codes detected
    const errorCodes = this.extractErrorCodes(originalQuery);
    if (errorCodes.length > 0) {
      errorCodes.forEach((code) => {
        queries.push(`twilio error ${code}`);
        queries.push(`twilio ${code} solution`);
      });
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  /**
   * Extract error codes from query
   */
  extractErrorCodes(query) {
    const errorPatterns = [
      /\b(2\d{4})\b/g, // Twilio error codes
      /\b(3\d{4})\b/g, // HTTP status codes
      /\b(4\d{2})\b/g, // HTTP client errors
      /\b(5\d{2})\b/g, // HTTP server errors
    ];

    const codes = [];
    errorPatterns.forEach((pattern) => {
      const matches = query.match(pattern);
      if (matches) {
        codes.push(...matches);
      }
    });

    return codes;
  }

  /**
   * Search using Google (with rate limiting)
   */
  async searchGoogle(query, maxResults = 10) {
    try {
      const params = new URLSearchParams({
        q: query,
        num: maxResults,
        tbs: "qdr:w", // Past week for more recent results
        safe: "off",
      });

      const response = await axios.get(
        `${this.searchEngines.google.baseUrl}?${params}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          timeout: 10000,
        }
      );

      return this.parseGoogleResults(response.data, query);
    } catch (error) {
      console.error("Google search failed:", error.message);
      return [];
    }
  }

  /**
   * Search using DuckDuckGo (fallback)
   */
  async searchDuckDuckGo(query, maxResults = 10) {
    try {
      const params = new URLSearchParams({
        q: query,
        kl: "us-en",
      });

      const response = await axios.get(
        `${this.searchEngines.duckduckgo.baseUrl}?${params}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
          timeout: 10000,
        }
      );

      return this.parseDuckDuckGoResults(response.data, query);
    } catch (error) {
      console.error("DuckDuckGo search failed:", error.message);
      return [];
    }
  }

  /**
   * Parse Google search results
   */
  parseGoogleResults(html, query) {
    const $ = cheerio.load(html);
    const results = [];

    // Google search result selectors
    $("div.g").each((index, element) => {
      if (index >= 10) return; // Limit results

      const $element = $(element);
      const titleElement = $element.find("h3");
      const linkElement = $element.find("a[href]").first();
      const snippetElement = $element.find("span, div[data-sncf]");

      if (titleElement.length && linkElement.length) {
        const title = titleElement.text().trim();
        const url = linkElement.attr("href");
        const snippet = snippetElement.text().trim();

        if (url && url.startsWith("http")) {
          results.push({
            title,
            url: this.cleanUrl(url),
            snippet: snippet || "No description available",
            source: this.identifySource(url),
            relevance: this.calculateRelevance(title, snippet, query),
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    return results;
  }

  /**
   * Parse DuckDuckGo search results
   */
  parseDuckDuckGoResults(html, query) {
    const $ = cheerio.load(html);
    const results = [];

    $(".result").each((index, element) => {
      if (index >= 10) return; // Limit results

      const $element = $(element);
      const titleElement = $element.find(".result__title a");
      const snippetElement = $element.find(".result__snippet");

      if (titleElement.length) {
        const title = titleElement.text().trim();
        const url = titleElement.attr("href");
        const snippet = snippetElement.text().trim();

        if (url && url.startsWith("http")) {
          results.push({
            title,
            url: this.cleanUrl(url),
            snippet: snippet || "No description available",
            source: this.identifySource(url),
            relevance: this.calculateRelevance(title, snippet, query),
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    return results;
  }

  /**
   * Clean and normalize URLs
   */
  cleanUrl(url) {
    try {
      // Remove Google redirect parameters
      if (url.includes("google.com/url?")) {
        const urlParams = new URLSearchParams(url.split("?")[1]);
        return urlParams.get("q") || url;
      }
      return url;
    } catch (error) {
      return url;
    }
  }

  /**
   * Identify the source of a URL
   */
  identifySource(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes("twilio.com")) return "twilio_official";
      if (domain.includes("github.com")) return "github";
      if (domain.includes("stackoverflow.com")) return "stackoverflow";
      if (domain.includes("reddit.com")) return "reddit";
      if (domain.includes("dev.to")) return "dev_to";
      if (domain.includes("medium.com")) return "medium";
      if (domain.includes("support.twilio.com")) return "twilio_support";
      
      return "other";
    } catch (error) {
      return "unknown";
    }
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevance(title, snippet, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const titleLower = title.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    
    let score = 0;
    
    // Title matches are more important
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) score += 2;
      if (snippetLower.includes(term)) score += 1;
    });
    
    // Boost for Twilio-specific terms
    const twilioTerms = ["twilio", "sms", "voice", "video", "whatsapp", "api"];
    twilioTerms.forEach(term => {
      if (titleLower.includes(term) || snippetLower.includes(term)) {
        score += 0.5;
      }
    });
    
    // Boost for recent content indicators
    const recentTerms = ["2024", "recent", "new", "update", "latest"];
    recentTerms.forEach(term => {
      if (titleLower.includes(term) || snippetLower.includes(term)) {
        score += 0.3;
      }
    });
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Check cache for existing results
   */
  getCachedResults(query) {
    const cached = this.searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.results;
    }
    return null;
  }

  /**
   * Cache search results
   */
  cacheResults(query, results) {
    this.searchCache.set(query, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Main search function
   */
  async search(query, options = {}) {
    const {
      maxResults = 10,
      useCache = true,
      searchEngines = ["google", "duckduckgo"],
      includeRecent = true,
    } = options;

    console.log(`🔍 Web search for: "${query}"`);

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResults(query);
      if (cached) {
        console.log("📋 Using cached results");
        return cached;
      }
    }

    try {
      // Generate search queries
      const searchQueries = this.generateSearchQueries(query);
      console.log(`📝 Generated ${searchQueries.length} search queries`);

      let allResults = [];

      // Search using multiple engines
      for (const engine of searchEngines) {
        try {
          for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to first 3 queries per engine
            console.log(`🔍 Searching ${engine}: "${searchQuery}"`);
            
            let results = [];
            if (engine === "google") {
              results = await this.searchGoogle(searchQuery, maxResults);
            } else if (engine === "duckduckgo") {
              results = await this.searchDuckDuckGo(searchQuery, maxResults);
            }

            allResults.push(...results);
            
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ ${engine} search failed:`, error.message);
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(allResults);
      const sortedResults = uniqueResults
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);

      // Add metadata
      const searchResults = {
        query,
        results: sortedResults,
        totalFound: allResults.length,
        searchEngines: searchEngines,
        timestamp: new Date().toISOString(),
        cacheHit: false,
      };

      // Cache results
      this.cacheResults(query, searchResults);

      console.log(`✅ Found ${sortedResults.length} relevant results`);
      return searchResults;
    } catch (error) {
      console.error("❌ Web search failed:", error.message);
      return {
        query,
        results: [],
        totalFound: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Remove duplicate results based on URL
   */
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      if (seen.has(result.url)) {
        return false;
      }
      seen.add(result.url);
      return true;
    });
  }

  /**
   * Search for Twilio-specific issues and updates
   */
  async searchTwilioUpdates(query, options = {}) {
    const twilioQuery = `twilio ${query} update news 2024`;
    return await this.search(twilioQuery, {
      ...options,
      searchEngines: ["google"],
      maxResults: 5,
    });
  }

  /**
   * Search for error-specific solutions
   */
  async searchErrorSolutions(errorCode, query = "") {
    const errorQuery = `twilio error ${errorCode} solution fix ${query}`;
    return await this.search(errorQuery, {
      maxResults: 8,
      searchEngines: ["google", "duckduckgo"],
    });
  }

  /**
   * Search for community discussions
   */
  async searchCommunityDiscussions(query) {
    const communityQuery = `twilio ${query} discussion forum reddit stackoverflow`;
    return await this.search(communityQuery, {
      maxResults: 6,
      searchEngines: ["google"],
    });
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      cacheSize: this.searchCache.size,
      cacheExpiry: this.cacheExpiry,
      supportedEngines: Object.keys(this.searchEngines),
      twilioSources: this.twilioSources,
    };
  }
}

export default WebSearchTool;
