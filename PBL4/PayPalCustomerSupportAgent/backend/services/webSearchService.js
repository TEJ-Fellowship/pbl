const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// ===== CONFIGURATION =====
const GOOGLE_API_KEY = process.env.GOOGLE_WEB_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ID;

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

// ===== WEB SEARCH FUNCTION =====
async function searchPayPalWeb(query) {
  try {
    console.log(`🔍 Searching web for: ${query}`);
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('❌ Google API credentials not configured');
      return [];
    }

    // Build optimized search query
    const optimizedQuery = buildOptimizedSearchQuery(query);
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
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
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
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
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
    const filteredResults = filterAndRankResults(results, query);
    
    // Format results similar to hybrid search structure
    const formattedResults = filteredResults.map((item, index) => ({
      id: `web_search_${index}`,
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink,
      source: 'web_search',
      combinedScore: item.relevanceScore,
      metadata: {
        source: 'web_search',
        title: item.title,
        text: item.snippet,
        link: item.link,
        preview: item.snippet.slice(0, 200) + '...',
        publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || 
                      item.pagemap?.metatags?.[0]?.['og:updated_time'] || 
                      'Unknown'
      }
    }));

    console.log(`Found ${formattedResults.length} filtered web search results`);
    console.log('Final formatted web search results:', JSON.stringify(formattedResults, null, 2));
    return formattedResults.slice(0, 3); // Return top 3 after filtering

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

// ===== BUILD OPTIMIZED SEARCH QUERY =====
function buildOptimizedSearchQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Define query patterns and their optimized search terms
  const queryPatterns = {
    // Status/Outage queries
    outage: /(down|outage|status|working|broken|not working|error|issue|problem|trouble)/i,
    // Recent information queries
    recent: /(recent|current|today|now|latest|new|update|change|announcement|news|happening)/i,
    // Service-specific queries
    service: /(service|maintenance|scheduled|planned|downtime)/i,
    // Fee-related queries
    fees: /(fee|fees|cost|price|pricing|charge|rate|rates)/i,
    // Security queries
    security: /(security|secure|safe|hack|breach|fraud|scam|phishing)/i,
    // Account queries
    account: /(account|login|password|verification|suspended|limited|restricted)/i,
    // Payment queries
    payment: /(payment|transfer|send|receive|payout|transaction|money)/i
  };
  
  let optimizedQuery = '';
  
  // Improved site-specific searches for better accuracy
  if (queryPatterns.outage.test(query) || queryPatterns.recent.test(query)) {
    // For status queries, use more specific targeting
    if (queryPatterns.outage.test(query)) {
      // Try to find actual status pages first
      optimizedQuery = `site:status.paypal.com OR site:paypal.com/status OR site:paypal.com/help/status`;
    } else {
      // For recent queries, use broader but still targeted search
      optimizedQuery = `(site:paypal.com OR site:paypal-community.com) "${query}"`;
    }
  } else if (queryPatterns.fees.test(query)) {
    // For fee queries, focus on official documentation
    optimizedQuery = `site:paypal.com "${query}" (fees OR pricing OR rates)`;
  } else if (queryPatterns.security.test(query)) {
    // For security queries, prioritize official security pages
    optimizedQuery = `site:paypal.com "${query}" (security OR safety OR protection)`;
  } else if (queryPatterns.account.test(query)) {
    // For account queries, focus on help center
    optimizedQuery = `site:paypal.com "${query}" (account OR help OR support)`;
  } else if (queryPatterns.payment.test(query)) {
    // For payment queries, include developer docs
    optimizedQuery = `(site:paypal.com OR site:developer.paypal.com) "${query}" (payment OR transfer OR transaction)`;
  } else {
    // General queries with PayPal context
    optimizedQuery = `site:paypal.com "${query}"`;
  }
  
  // Add time-based modifiers for recent queries
  if (queryPatterns.recent.test(query)) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    optimizedQuery += ` (${todayStr} OR ${yesterdayStr} OR "last week" OR "this week" OR "recently" OR "current")`;
  }
  
  return optimizedQuery;
}

// ===== FILTER AND RANK RESULTS =====
function filterAndRankResults(results, originalQuery) {
  const lowerQuery = originalQuery.toLowerCase();
  
  // Enhanced quality indicators
  const qualityIndicators = {
    officialPayPal: /paypal\.com|status\.paypal\.com|developer\.paypal\.com|security\.paypal\.com|paypal-community\.com/i,
    recentContent: /(today|yesterday|this week|last week|recent|current|latest|new|updated|2024|2025)/i,
    statusPage: /status|outage|maintenance|incident|downtime|service|issue/i,
    highAuthority: /paypal|paypal-community|stackoverflow|reddit|github/i,
    helpContent: /help|support|guide|tutorial|documentation|faq/i,
    officialDocs: /developer\.paypal\.com|paypal\.com\/developer/i
  };
  
  // Query type detection for better scoring
  const isOutageQuery = /(down|outage|status|working|broken|not working|error|issue|problem|trouble)/i.test(originalQuery);
  const isRecentQuery = /(recent|current|today|now|latest|new|update|change|announcement|news|happening)/i.test(originalQuery);
  const isFeeQuery = /(fee|fees|cost|price|pricing|charge|rate|rates)/i.test(originalQuery);
  const isSecurityQuery = /(security|secure|safe|hack|breach|fraud|scam|phishing)/i.test(originalQuery);
  
  // Score and filter results with enhanced algorithm
  const scoredResults = results.map(item => {
    let relevanceScore = 0.4; // Slightly lower base score for better differentiation
    const content = (item.title + ' ' + item.snippet).toLowerCase();
    
    // Boost official PayPal sources (highest priority)
    if (qualityIndicators.officialPayPal.test(item.link)) {
      relevanceScore += 0.35;
      
      // Extra boost for status pages on outage queries
      if (isOutageQuery && qualityIndicators.statusPage.test(content)) {
        relevanceScore += 0.15;
      }
      
      // Extra boost for developer docs on technical queries
      if (qualityIndicators.officialDocs.test(item.link) && (isFeeQuery || isSecurityQuery)) {
        relevanceScore += 0.1;
      }
    }
    
    // Boost recent content for time-sensitive queries
    if (isRecentQuery && qualityIndicators.recentContent.test(content)) {
      relevanceScore += 0.25;
      
      // Extra boost for very recent content
      if (content.includes('today') || content.includes('yesterday')) {
        relevanceScore += 0.1;
      }
    }
    
    // Boost help/support content for general queries
    if (!isOutageQuery && !isRecentQuery && qualityIndicators.helpContent.test(content)) {
      relevanceScore += 0.15;
    }
    
    // Boost high-authority sources
    if (qualityIndicators.highAuthority.test(item.displayLink)) {
      relevanceScore += 0.1;
    }
    
    // Query-specific content matching
    const queryWords = originalQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const matchedWords = queryWords.filter(word => content.includes(word));
    const wordMatchRatio = matchedWords.length / queryWords.length;
    relevanceScore += wordMatchRatio * 0.2;
    
    // Penalize irrelevant results more strictly
    if (!content.includes('paypal') && !content.includes('payment') && !content.includes('money')) {
      relevanceScore -= 0.2;
    }
    
    // Penalize very old content for recent queries
    if (isRecentQuery && (content.includes('2023') || content.includes('2022')) && !content.includes('2024') && !content.includes('2025')) {
      relevanceScore -= 0.3;
    }
    
    // Penalize duplicate or very similar content
    if (item.snippet && item.snippet.length < 50) {
      relevanceScore -= 0.1;
    }
    
    // Boost results with more detailed content
    if (item.snippet && item.snippet.length > 200) {
      relevanceScore += 0.05;
    }
    
    return {
      ...item,
      relevanceScore: Math.max(0, Math.min(1, relevanceScore)), // Clamp between 0 and 1
      wordMatchRatio,
      isRecent: isRecentQuery && qualityIndicators.recentContent.test(content),
      isOfficial: qualityIndicators.officialPayPal.test(item.link)
    };
  });
  
  // Enhanced filtering and sorting with stricter relevance
  return scoredResults
    .filter(item => {
      // Much stricter filtering - only keep highly relevant results
      const isRelevant = item.relevanceScore > 0.6 || 
                        (item.isOfficial && item.relevanceScore > 0.4) ||
                        (item.wordMatchRatio > 0.7);
      
      // Additional check for status queries - must be about status/outage
      if (isOutageQuery) {
        const content = (item.title + ' ' + item.snippet).toLowerCase();
        const hasStatusKeywords = /(status|outage|down|maintenance|incident|issue|working|service)/i.test(content);
        return isRelevant && hasStatusKeywords;
      }
      
      return isRelevant;
    })
    .sort((a, b) => {
      // Primary sort: relevance score
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort: official sources first
      if (a.isOfficial !== b.isOfficial) {
        return b.isOfficial - a.isOfficial;
      }
      
      // Tertiary sort: recent content for recent queries
      if (isRecentQuery && a.isRecent !== b.isRecent) {
        return b.isRecent - a.isRecent;
      }
      
      // Final sort: word match ratio
      return b.wordMatchRatio - a.wordMatchRatio;
    });
}

// ===== DETECT IF WEB SEARCH IS NEEDED =====
function shouldUseWebSearch(query) {
  const lowerQuery = query.toLowerCase();
  
  // More selective web search triggers - only for queries that really need current info
  const webSearchTriggers = [
    // Time-sensitive queries
    'recent', 'current', 'today', 'now', 'latest', 'new', 'happening',
    'yesterday', 'this week', 'last week', 'recently', 'updated',
    
    // Status/outage queries - only these specific ones
    'outage', 'down', 'status', 'working', 'broken', 'not working',
    'maintenance', 'scheduled', 'incident', 'problem', 'trouble',
    'error', 'failed', 'unavailable', 'offline', 'up', 'online',
    
    // News/announcement queries
    'update', 'change', 'announcement', 'news', 'alert', 'notice',
    
    // Security queries that need current info
    'breach', 'hack', 'fraud', 'scam',
    
    // Account issues that might need current status
    'suspended', 'limited', 'restricted', 'locked', 'banned'
  ];
  
  // Check for trigger words
  const hasTrigger = webSearchTriggers.some(trigger => lowerQuery.includes(trigger));
  
  // More specific patterns: only use web search for these specific cases
  const alwaysWebSearchPatterns = [
    /is paypal (down|working|up|offline|available)/i,
    /paypal (status|outage|maintenance|service)/i,
    /(recent|current|today|now).*paypal/i,
    /paypal.*(breach|hack|fraud|security)/i,
    /paypal.*(suspended|limited|restricted)/i
  ];
  
  const hasPattern = alwaysWebSearchPatterns.some(pattern => pattern.test(query));
  
  // Only use web search for specific cases, not all PayPal queries
  const shouldUseWeb = hasTrigger || hasPattern;
  
  console.log(`Web search decision for "${query}": hasTrigger=${hasTrigger}, hasPattern=${hasPattern}, shouldUseWeb=${shouldUseWeb}`);
  
  return shouldUseWeb;
}

// ===== COMBINE HYBRID AND WEB RESULTS =====
function combineHybridAndWebResults(hybridResults, webResults) {
  console.log(`Combining ${hybridResults.length} hybrid + ${webResults.length} web results`);
  
  // Balanced combination logic - prioritize hybrid results for accuracy
  const allResults = [];
  
  // Add hybrid results with minimal score reduction
  hybridResults.forEach((result, index) => {
    allResults.push({
      ...result,
      source: 'hybrid',
      adjustedScore: result.combinedScore * 0.9, // Minimal reduction
      priority: 'documentation',
      originalScore: result.combinedScore
    });
  });
  
  // Add web results with moderate scoring
  webResults.forEach((result, index) => {
    allResults.push({
      ...result,
      source: 'web_search',
      adjustedScore: result.combinedScore * 1.1, // Moderate boost
      priority: 'recent_info',
      isRecent: result.isRecent || false,
      isOfficial: result.isOfficial || false,
      originalScore: result.combinedScore
    });
  });
  
  // Balanced sorting algorithm - prioritize quality over source
  allResults.sort((a, b) => {
    // Primary: adjusted score (quality first)
    if (Math.abs(a.adjustedScore - b.adjustedScore) > 0.1) {
      return b.adjustedScore - a.adjustedScore;
    }
    
    // Secondary: official sources first
    if (a.isOfficial !== b.isOfficial) {
      return b.isOfficial - a.isOfficial;
    }
    
    // Tertiary: recent content for recent queries
    if (a.isRecent !== b.isRecent) {
      return b.isRecent - a.isRecent;
    }
    
    // Quaternary: prefer hybrid for general queries, web for status queries
    const isStatusQuery = /(down|status|outage|maintenance|working)/i.test(hybridResults[0]?.metadata?.text || '');
    if (isStatusQuery && a.source !== b.source) {
      return a.source === 'web_search' ? -1 : 1;
    } else if (!isStatusQuery && a.source !== b.source) {
      return a.source === 'hybrid' ? -1 : 1;
    }
    
    // Final: original combined score
    return b.originalScore - a.originalScore;
  });
  
  // Return top 3 results with balanced mix
  const topResults = allResults.slice(0, 3);
  
  console.log(`Final combined results: ${topResults.length} (${topResults.filter(r => r.source === 'web_search').length} web + ${topResults.filter(r => r.source === 'hybrid').length} hybrid)`);
  
  return topResults;
}

module.exports = {
  searchPayPalWeb,
  shouldUseWebSearch,
  combineHybridAndWebResults
};
