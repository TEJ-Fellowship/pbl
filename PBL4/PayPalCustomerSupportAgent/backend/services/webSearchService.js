const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// ===== CONFIGURATION =====
const GOOGLE_API_KEY = process.env.GOOGLE_WEB_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ID;

// ===== WEB SEARCH FUNCTION =====
async function searchPayPalWeb(query) {
  try {
    console.log(`🔍 Searching web for: ${query}`);
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('❌ Google API credentials not configured');
      return [];
    }

    // Call Google Custom Search API
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: `PayPal ${query}`,
        num: 3, // Get top 3 results
        safe: 'off'
      }
    });

    const results = response.data.items || [];
    
    // Format results similar to hybrid search structure
    const formattedResults = results.map((item, index) => ({
      id: `web_search_${index}`,
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink,
      source: 'web_search',
      combinedScore: 0.8 - (index * 0.1), // Decreasing score for ranking
      metadata: {
        source: 'web_search',
        title: item.title,
        text: item.snippet,
        link: item.link,
        preview: item.snippet.slice(0, 200) + '...'
      }
    }));

    console.log(`✅ Found ${formattedResults.length} web search results`);
    return formattedResults;

  } catch (error) {
    console.error('❌ Web search error:', error.message);
    return [];
  }
}

// ===== DETECT IF WEB SEARCH IS NEEDED =====
function shouldUseWebSearch(query) {
  const lowerQuery = query.toLowerCase();
  const webSearchTriggers = [
    'recent', 'current', 'today', 'now', 'latest', 'new',
    'outage', 'down', 'status', 'working', 'broken',
    'update', 'change', 'announcement', 'news'
  ];
  
  return webSearchTriggers.some(trigger => lowerQuery.includes(trigger));
}

// ===== COMBINE HYBRID AND WEB RESULTS =====
function combineHybridAndWebResults(hybridResults, webResults) {
  // Combine both result sets
  const allResults = [...hybridResults, ...webResults];
  
  // Sort by combined score (web results have high scores)
  allResults.sort((a, b) => b.combinedScore - a.combinedScore);
  
  // Return top 3 results (mix of hybrid and web)
  return allResults.slice(0, 3);
}

module.exports = {
  searchPayPalWeb,
  shouldUseWebSearch,
  combineHybridAndWebResults
};
