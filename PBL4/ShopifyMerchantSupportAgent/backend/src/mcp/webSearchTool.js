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
    this.maxResults = 3;
    this.timeout = 5000; // 5 seconds timeout
  }

  /**
   * Search using DuckDuckGo Instant Answer API
   * @param {string} query - Search query
   * @returns {Object} Search results
   */
  async searchDuckDuckGo(query) {
    try {
      const searchQuery = `Shopify ${query}`;
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
      const searchResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php`,
        {
          params: {
            action: "query",
            list: "search",
            srsearch: `Shopify ${query}`,
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
    // Use web search if confidence is low or query suggests recent information
    const lowConfidence = confidence < 0.6;

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
    ];

    const hasRecentKeywords = recentInfoKeywords.some((keyword) =>
      query.toLowerCase().includes(keyword)
    );

    const hasQuestionWords = /what is|how to|when|where|why|who/i.test(query);

    return lowConfidence || hasRecentKeywords || hasQuestionWords;
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

    if (!this.shouldUseWebSearch(query, confidence)) {
      return {
        error: "Web search not needed for this query",
        results: [],
        summary: null,
      };
    }

    try {
      console.log(`🔍 Performing web search for: ${query}`);

      // Perform searches in parallel
      const [duckDuckGoResults, wikipediaResults, shopifyResults] =
        await Promise.all([
          this.searchDuckDuckGo(query),
          this.searchWikipedia(query),
          this.searchShopifySpecific(query),
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
