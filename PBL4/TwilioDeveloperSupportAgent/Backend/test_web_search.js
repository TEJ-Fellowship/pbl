// test_web_search.js
import axios from "axios";
import config from "./config/config.js";

// Standalone web search function (extracted from mcpServer.js)
async function performWebSearch(query, maxResults = 5) {
  const apiKey = config.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error(
      "Google Custom Search API credentials not configured. Please check your .env file."
    );
  }

  // Enhance query with Twilio context
  const enhancedQuery = `${query} site:twilio.com`;

  try {
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: enhancedQuery,
          num: Math.min(maxResults, 10), // Google allows max 10 results per request
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return {
        found: false,
        message: "No relevant results found",
        query: enhancedQuery,
      };
    }

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
      totalResults: response.data.searchInformation?.totalResults || "Unknown",
      searchTime: response.data.searchInformation?.searchTime || "Unknown",
      query: enhancedQuery,
      results,
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;

      if (status === 403) {
        throw new Error(`Google Custom Search API quota exceeded: ${message}`);
      } else if (status === 400) {
        throw new Error(
          `Invalid request to Google Custom Search API: ${message}`
        );
      } else {
        throw new Error(
          `Google Custom Search API error (${status}): ${message}`
        );
      }
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Google Custom Search API request timeout");
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

async function testWebSearch() {
  console.log("🧪 Testing Web Search Tool...\n");

  // Check if environment variables are set
  const apiKey = config.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const engineId = config.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || apiKey === "your_actual_api_key_here") {
    console.log(
      "❌ GOOGLE_CUSTOM_SEARCH_API_KEY not properly set in .env file"
    );
    console.log("   Please update your .env file with the actual API key");
    return;
  }

  if (!engineId) {
    console.log("❌ GOOGLE_CUSTOM_SEARCH_ENGINE_ID not set in .env file");
    return;
  }

  console.log("✅ Environment variables found");
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`🔍 Engine ID: ${engineId}`);

  try {
    console.log('\n🔍 Testing search for "Twilio SMS API"...');

    // Test the performWebSearch function directly
    const results = await performWebSearch("Twilio SMS API", 3);

    console.log("✅ Search completed successfully!");
    console.log(`📊 Found: ${results.found}`);

    if (results.found) {
      console.log(`🔢 Total results: ${results.totalResults}`);
      console.log(`⏱️ Search time: ${results.searchTime} seconds`);
      console.log("\n📝 Results:");

      results.results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   🔗 ${result.link}`);
        console.log(`   📄 ${result.snippet.substring(0, 100)}...`);
      });
    } else {
      console.log("❌ No results found");
    }
  } catch (error) {
    console.log("❌ Search test failed:");
    console.log(`   Error: ${error.message}`);

    if (error.message.includes("quota")) {
      console.log("   💡 Check your Google Cloud billing and quotas");
    } else if (error.message.includes("credentials")) {
      console.log("   💡 Check your API key and Search Engine ID");
    }
  }
}

// Run the test
testWebSearch().catch(console.error);
