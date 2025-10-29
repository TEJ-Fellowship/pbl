const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from mcp-server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ===== RATE LIMITING AND RETRY LOGIC =====
let apiCallCount = 0;
let lastApiCall = 0;
const RATE_LIMIT_DELAY = 1000; // 1 second between calls
const MAX_RETRIES = 3;

// Helper function to make API calls with rate limiting and retry logic
async function makeApiCallWithRetry(apiCall, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Rate limiting: ensure minimum delay between calls
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCall;
      if (timeSinceLastCall < RATE_LIMIT_DELAY) {
        const delay = RATE_LIMIT_DELAY - timeSinceLastCall;
        console.log(`⏳ Rate limiting: waiting ${delay}ms before API call`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      lastApiCall = Date.now();
      apiCallCount++;
      
      console.log(`🌐 Making API call #${apiCallCount} (attempt ${attempt}/${maxRetries})`);
      const result = await apiCall();
      
      return result;
    } catch (error) {
      console.error(`❌ API call attempt ${attempt} failed:`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        
        if (status === 429) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`⏳ Rate limited (429). Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.error('❌ Rate limit exceeded after all retries. Please wait before making more requests.');
            return null;
          }
        } else if (status === 404) {
          console.error('❌ API endpoint not found (404). Check your API credentials and endpoint.');
          return null;
        } else if (status === 403) {
          console.error('❌ API access forbidden (403). Check your API key permissions.');
          return null;
        } else {
          console.error(`❌ API error ${status}: ${statusText}`);
          if (attempt < maxRetries) {
            const delay = 1000 * attempt; // Linear backoff for other errors
            console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return null;
        }
      } else {
        console.error('❌ Network error:', error.message);
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`⏳ Network error. Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return null;
      }
    }
  }
  return null;
}

// ===== WEB SEARCH SERVICE =====
class WebSearchService {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_WEB_KEY;
    this.searchEngineId = process.env.GOOGLE_SEARCH_ID;
  }

  async searchPayPalWeb(query) {
    try {
      console.log(`🔍 Searching web for: ${query}`);
      
      if (!this.googleApiKey || !this.searchEngineId) {
        console.error('❌ Google API credentials not configured');
        return [];
      }

      // Build optimized search query
      const optimizedQuery = this.buildOptimizedSearchQuery(query);
      console.log(`🔍 Optimized search query: ${optimizedQuery}`);

      // Use single optimized search strategy instead of multiple calls
      let results = [];
      
      // Determine the best search strategy based on query type
      const isOutageQuery = /(down|outage|status|working|broken|not working)/i.test(query);
      const isRecentQuery = /(recent|current|today|now|latest|new|update|change)/i.test(query);
      
      let searchQuery;
      let searchParams;
      
      if (isOutageQuery) {
        // For outage queries, prioritize status pages
        searchQuery = 'site:status.paypal.com OR site:paypal.com/status';
        searchParams = {
          key: this.googleApiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          num: 8,
          safe: 'off',
          sort: 'date',
          dateRestrict: 'd30',
          lr: 'lang_en'
        };
      } else {
        // For other queries, use the optimized query
        searchQuery = optimizedQuery;
        searchParams = {
          key: this.googleApiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          num: 8,
          safe: 'off',
          sort: 'date',
          dateRestrict: isRecentQuery ? 'd30' : 'm1',
          lr: 'lang_en'
        };
      }
      
      console.log(`🔍 Using search strategy: ${isOutageQuery ? 'status-focused' : 'general'}`);
      
      // Make single API call with retry logic
      const response = await makeApiCallWithRetry(async () => {
        return await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: searchParams
        });
      });
      
      if (!response) {
        console.error('❌ All API call attempts failed');
        return [];
      }
      
      results = response.data.items || [];
      console.log(`✅ Search returned ${results.length} results`);
      
      // Log API response for debugging (only if results are found)
      if (results.length > 0) {
        console.log(`📊 API response summary: ${results.length} items found`);
        console.log(`📊 Search info: ${response.data.searchInformation?.totalResults || 'unknown'} total results`);
      } else {
        console.log('⚠️ No results found from API');
      }
      
      // Filter and rank results for better accuracy
      const filteredResults = this.filterAndRankResults(results, query);
      
      return filteredResults.map((item, index) => ({
        id: `web_search_${index}`,
        title: item.title,
        snippet: item.snippet,
        link: item.link,
        source: 'web_search',
        score: item.relevanceScore
      })).slice(0, 3); // Return top 3 after filtering

    } catch (error) {
      console.error('❌ Web search error:', error.message);
      
      // Handle specific error types
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        console.error(`❌ HTTP Error ${status}: ${statusText}`);
        
        if (status === 429) {
          console.error('❌ Rate limit exceeded. Please wait before making more requests.');
        } else if (status === 404) {
          console.error('❌ API endpoint not found. Check your API credentials.');
        } else if (status === 403) {
          console.error('❌ API access forbidden. Check your API key permissions.');
        }
      } else {
        console.error('❌ Network or configuration error:', error.message);
      }
      
      return [];
    }
  }

  // Build optimized search query
  buildOptimizedSearchQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Define query patterns and their optimized search terms
    const queryPatterns = {
      // Status/Outage queries
      outage: /(down|outage|status|working|broken|not working|error|issue)/i,
      // Recent information queries
      recent: /(recent|current|today|now|latest|new|update|change|announcement|news)/i,
      // Service-specific queries
      service: /(service|maintenance|scheduled|planned)/i,
      // Fee-related queries
      fees: /(fee|fees|cost|price|pricing|charge)/i,
      // Security queries
      security: /(security|secure|safe|hack|breach|fraud)/i
    };
    
    let optimizedQuery = '';
    
    // Add site-specific searches for better accuracy
    if (queryPatterns.outage.test(query) || queryPatterns.recent.test(query)) {
      // For status queries, prioritize official PayPal sources
      optimizedQuery = `site:paypal.com OR site:status.paypal.com OR site:paypal-community.com "${query}"`;
    } else if (queryPatterns.fees.test(query)) {
      // For fee queries, focus on official documentation
      optimizedQuery = `site:paypal.com OR site:developer.paypal.com "${query}" fees`;
    } else if (queryPatterns.security.test(query)) {
      // For security queries, prioritize official security pages
      optimizedQuery = `site:paypal.com OR site:security.paypal.com "${query}" security`;
    } else {
      // General queries with PayPal context
      optimizedQuery = `PayPal "${query}"`;
    }
    
    // Add time-based modifiers for recent queries
    if (queryPatterns.recent.test(query)) {
      const today = new Date().toISOString().split('T')[0];
      optimizedQuery += ` (${today} OR yesterday OR "last week" OR "this week")`;
    }
    
    return optimizedQuery;
  }

  // Filter and rank results
  filterAndRankResults(results, originalQuery) {
    const lowerQuery = originalQuery.toLowerCase();
    
    // Define quality indicators
    const qualityIndicators = {
      officialPayPal: /paypal\.com|status\.paypal\.com|developer\.paypal\.com|security\.paypal\.com/i,
      recentContent: /(today|yesterday|this week|last week|recent|current)/i,
      statusPage: /status|outage|maintenance|incident/i,
      highAuthority: /paypal|paypal-community|stackoverflow|reddit/i
    };
    
    // Score and filter results
    const scoredResults = results.map(item => {
      let relevanceScore = 0.5; // Base score
      
      // Boost official PayPal sources
      if (qualityIndicators.officialPayPal.test(item.link)) {
        relevanceScore += 0.3;
      }
      
      // Boost status page results for outage queries
      if (qualityIndicators.statusPage.test(item.title + ' ' + item.snippet) && 
          (lowerQuery.includes('down') || lowerQuery.includes('outage') || lowerQuery.includes('status'))) {
        relevanceScore += 0.2;
      }
      
      // Boost recent content for time-sensitive queries
      if (qualityIndicators.recentContent.test(item.title + ' ' + item.snippet) && 
          (lowerQuery.includes('today') || lowerQuery.includes('recent') || lowerQuery.includes('current'))) {
        relevanceScore += 0.2;
      }
      
      // Boost high-authority sources
      if (qualityIndicators.highAuthority.test(item.displayLink)) {
        relevanceScore += 0.1;
      }
      
      // Penalize irrelevant results (but be more lenient)
      if (!item.title.toLowerCase().includes('paypal') && !item.snippet.toLowerCase().includes('paypal')) {
        relevanceScore -= 0.1; // Reduced penalty
      }
      
      // Penalize very old content for recent queries
      if ((lowerQuery.includes('today') || lowerQuery.includes('recent')) && 
          item.snippet.toLowerCase().includes('2023') && !item.snippet.toLowerCase().includes('2024')) {
        relevanceScore -= 0.2;
      }
      
      return {
        ...item,
        relevanceScore: Math.max(0, Math.min(1, relevanceScore)) // Clamp between 0 and 1
      };
    });
    
    // Filter out low-quality results and sort by relevance
    return scoredResults
      .filter(item => item.relevanceScore > 0.2) // Keep results with reasonable relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  shouldUseWebSearch(query) {
    const lowerQuery = query.toLowerCase();
    const triggers = [
      'recent', 'current', 'today', 'now', 'latest', 'new',
      'outage', 'down', 'status', 'working', 'broken',
      'update', 'change', 'announcement', 'news',
      'maintenance', 'scheduled', 'incident', 'issue',
      'not working', 'error', 'problem'
    ];
    
    return triggers.some(trigger => lowerQuery.includes(trigger));
  }
}

module.exports = WebSearchService;
