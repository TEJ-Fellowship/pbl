import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ===== CONFIGURATION =====
const GOOGLE_API_KEY = process.env.GOOGLE_WEB_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ID;

// ===== MCP SERVER SETUP =====
const server = new Server(
  {
    name: "paypal-support-tools",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ===== WEB SEARCH FUNCTION =====
async function searchPayPalWeb(query) {
  try {
    console.log(`🔍 Searching web for: ${query}`);
    
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
    
    // Format results similar to hybrid search
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

// ===== MCP TOOL HANDLERS =====
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "web_search_paypal",
        description: "Search the web for recent PayPal information, updates, outages, or current policies",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query about PayPal"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "web_search_paypal") {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      return {
        content: [{
          type: "text",
          text: "Error: Google API credentials not configured. Please check GOOGLE_WEB_KEY and GOOGLE_SEARCH_ID environment variables."
        }]
      };
    }

    const query = args.query;
    const searchResults = await searchPayPalWeb(query);

    if (searchResults.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No recent web information found for this query."
        }]
      };
    }

    // Format results for LLM consumption
    const formattedText = searchResults.map((result, index) => 
      `[Web Source ${index + 1}]: ${result.title}\n${result.snippet}\nLink: ${result.link}\n`
    ).join('\n');

    return {
      content: [{
        type: "text",
        text: `Recent web search results for "${query}":\n\n${formattedText}`
      }]
    };
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${name}`
    }]
  };
});

// ===== START SERVER =====
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("🚀 PayPal MCP Server started with web search tool");
}

main().catch(console.error);
