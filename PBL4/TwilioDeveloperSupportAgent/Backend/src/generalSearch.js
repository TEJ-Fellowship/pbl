/**
 * General Search - Web search module for queries that need latest/outside information
 *
 * This module handles web searches using Google Custom Search API.
 * Used when queries require information not available in scraped documentation
 * or when looking for latest updates, status, or external resources.
 *
 * Moved from MCP tools to separate it as a distinct routing option.
 */

import axios from "axios";
import config from "../config/config.js";

class GeneralSearch {
  constructor() {
    // Configuration is loaded from config.js
    this.apiKey = config.GOOGLE_CUSTOM_SEARCH_API_KEY;
    this.searchEngineId = config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  }

  /**
   * Perform web search using Google Custom Search API
   * Automatically scopes searches to Twilio.com domain
   *
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results to return (default: 5)
   * @returns {Promise<Object>} Search results with found status, results array, and metadata
   */
  async performWebSearch(query, maxResults = 5) {
    // Validate API credentials
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error(
        "Google Custom Search API credentials not configured. Please check your .env file."
      );
    }

    // Enhance query to focus on Twilio documentation
    const enhancedQuery = `${query} site:twilio.com`;

    try {
      const response = await axios.get(
        "https://www.googleapis.com/customsearch/v1",
        {
          params: {
            key: this.apiKey,
            cx: this.searchEngineId,
            q: enhancedQuery,
            num: Math.min(maxResults, 10), // Google allows max 10 results per request
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Handle no results case
      if (!response.data.items || response.data.items.length === 0) {
        return {
          found: false,
          message: "No relevant results found",
          query: enhancedQuery,
          results: [],
          timestamp: new Date().toISOString(),
        };
      }

      // Format results
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
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Handle specific API errors
      if (error.response?.status === 403) {
        throw new Error(
          "Google Custom Search API quota exceeded or invalid credentials"
        );
      } else if (error.response?.status === 429) {
        throw new Error("Google Custom Search API rate limit exceeded");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Web search request timed out");
      } else {
        throw new Error(`Web search API error: ${error.message}`);
      }
    }
  }

  /**
   * Check if General Search is available (has API credentials)
   *
   * @returns {boolean} True if API credentials are configured
   */
  isAvailable() {
    return !!(this.apiKey && this.searchEngineId);
  }
}

export default GeneralSearch;
