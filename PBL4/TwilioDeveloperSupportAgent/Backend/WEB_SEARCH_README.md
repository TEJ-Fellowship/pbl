# Web Search Tool Implementation

## Overview

The Web Search Tool is a comprehensive MCP (Model Context Protocol) tool that enables the Twilio Developer Support Agent to search for recent updates, issues, and community discussions related to Twilio APIs. This implementation addresses the missing Tier 3 requirement for web search functionality.

## Features

### 🔍 **Multi-Engine Search**
- **Google Search**: Primary search engine with rate limiting
- **DuckDuckGo**: Fallback search engine for privacy-focused searches
- **Smart Query Generation**: Automatically generates Twilio-specific search queries

### 🎯 **Specialized Search Types**
1. **General Web Search** (`/api/search/web`)
   - Searches for recent Twilio updates and issues
   - Supports multiple search engines
   - Intelligent query expansion

2. **Twilio Updates** (`/api/search/updates`)
   - Focuses on official Twilio news and announcements
   - Optimized for recent content (past week)
   - Prioritizes official Twilio sources

3. **Error Solutions** (`/api/search/error-solutions`)
   - Searches for solutions to specific Twilio error codes
   - Enhanced error code detection and matching
   - Community-driven solutions

4. **Community Discussions** (`/api/search/community`)
   - Searches forums, Reddit, Stack Overflow, and Dev.to
   - Community-driven insights and discussions
   - Real-world problem-solving approaches

### 🧠 **Intelligent Features**
- **Error Code Detection**: Automatically detects Twilio error codes in queries
- **Relevance Scoring**: Advanced scoring algorithm for result ranking
- **Source Identification**: Categorizes results by source type
- **Caching**: 5-minute cache to reduce API calls and improve performance
- **Rate Limiting**: Built-in delays to prevent search engine blocking

## Architecture

### Core Components

#### 1. WebSearchTool Class (`src/webSearchTool.js`)
```javascript
class WebSearchTool {
  // Main search functionality
  async search(query, options = {})
  
  // Specialized search methods
  async searchTwilioUpdates(query, options = {})
  async searchErrorSolutions(errorCode, query = "")
  async searchCommunityDiscussions(query)
  
  // Utility methods
  generateSearchQueries(originalQuery)
  extractErrorCodes(query)
  calculateRelevance(title, snippet, query)
}
```

#### 2. MCP Tool Manager (`src/mcpWrapper.js`)
```javascript
class MCPToolManager {
  // Tool registration and execution
  async executeTool(toolName, ...args)
  
  // Enhanced response generation
  async generateEnhancedResponse({
    geminiClient,
    query,
    contextBlocks,
    useWebSearch,
    toolManager
  })
}
```

#### 3. API Endpoints (`server.js`)
- `POST /api/search/web` - General web search
- `POST /api/search/updates` - Twilio updates search
- `POST /api/search/error-solutions` - Error solutions search
- `POST /api/search/community` - Community discussions search
- `GET /api/tools` - List available tools
- `POST /api/chat/enhanced` - Enhanced chat with web search

## Usage Examples

### Basic Web Search
```javascript
// Search for recent Twilio updates
const results = await toolManager.executeTool("web_search", "twilio sms api 2024", {
  maxResults: 10,
  searchEngines: ["google", "duckduckgo"]
});
```

### Error Solutions Search
```javascript
// Search for solutions to specific error codes
const results = await toolManager.executeTool("error_solutions", "30001", "authentication");
```

### Enhanced Chat with Web Search
```javascript
// Use web search in chat responses
const response = await generateEnhancedResponse({
  geminiClient,
  query: "How do I fix Twilio error 30001?",
  contextBlocks: chunks,
  useWebSearch: true,
  toolManager
});
```

## Frontend Integration

### WebSearchPanel Component
- **Modal Interface**: Clean, accessible search interface
- **Search Type Selection**: Choose between different search types
- **Real-time Results**: Live search results with source categorization
- **External Links**: Direct links to source articles and discussions

### Features
- **Source Color Coding**: Visual distinction between different sources
- **Relevance Scoring**: Display relevance scores for each result
- **Loading States**: Smooth loading indicators and error handling
- **Responsive Design**: Works on desktop and mobile devices

## Configuration

### Environment Variables
```env
# Optional: Customize search behavior
WEB_SEARCH_CACHE_EXPIRY=300000  # 5 minutes in milliseconds
WEB_SEARCH_RATE_LIMIT=1000      # Delay between requests in ms
WEB_SEARCH_MAX_RESULTS=10       # Default max results per search
```

### Search Engine Configuration
```javascript
const searchEngines = {
  google: {
    baseUrl: "https://www.google.com/search",
    params: { num: 10, tbs: "qdr:d" }  // Past day
  },
  duckduckgo: {
    baseUrl: "https://html.duckduckgo.com/html",
    params: { kl: "us-en" }
  }
};
```

## Testing

### Test Script
```bash
# Run web search tests
npm run test-web-search
```

### Test Coverage
- ✅ Basic web search functionality
- ✅ Error solutions search
- ✅ Twilio updates search
- ✅ Community discussions search
- ✅ MCP tool manager integration
- ✅ Caching and performance
- ✅ Error handling and fallbacks

## Performance Optimizations

### Caching Strategy
- **5-minute cache** for search results
- **Query deduplication** to avoid duplicate searches
- **Result normalization** for consistent formatting

### Rate Limiting
- **1-second delays** between search requests
- **Request queuing** to prevent overwhelming search engines
- **Graceful fallbacks** when primary search fails

### Memory Management
- **Result pagination** to limit memory usage
- **Cache size limits** to prevent memory leaks
- **Automatic cleanup** of expired cache entries

## Error Handling

### Robust Error Recovery
- **Search Engine Fallbacks**: If Google fails, try DuckDuckGo
- **Partial Results**: Return available results even if some searches fail
- **User-Friendly Messages**: Clear error messages for debugging

### Logging and Monitoring
- **Detailed Logging**: Track search performance and errors
- **Response Time Metrics**: Monitor search speed and efficiency
- **Success Rate Tracking**: Monitor search reliability

## Future Enhancements

### Planned Features
1. **Search Analytics**: Track popular queries and results
2. **Result Summarization**: AI-powered result summaries
3. **Custom Search Sources**: Add more specialized sources
4. **Search History**: User search history and favorites
5. **Advanced Filtering**: Filter by date, source, or content type

### Integration Opportunities
1. **Twilio Status API**: Real-time service status integration
2. **GitHub Issues**: Direct GitHub issue search
3. **Stack Overflow API**: Enhanced Stack Overflow integration
4. **Reddit API**: Better Reddit community search

## Security Considerations

### Privacy Protection
- **No Query Logging**: Search queries are not permanently stored
- **Rate Limiting**: Prevents abuse and protects search engines
- **User Agent Rotation**: Prevents detection and blocking

### Data Handling
- **Temporary Storage**: Results are cached temporarily only
- **No Personal Data**: No user information is stored in search results
- **Secure Requests**: All requests use HTTPS and proper headers

## Troubleshooting

### Common Issues

#### Search Results Not Loading
- Check network connectivity
- Verify search engine availability
- Check rate limiting settings

#### Poor Result Quality
- Adjust relevance scoring parameters
- Update search query generation logic
- Review source filtering criteria

#### Performance Issues
- Check cache configuration
- Monitor memory usage
- Review rate limiting settings

### Debug Mode
```javascript
// Enable debug logging
const webSearchTool = new WebSearchTool();
webSearchTool.debug = true;
```

## Contributing

### Adding New Search Sources
1. Add source configuration to `twilioSources` array
2. Update `identifySource()` method
3. Add source-specific parsing logic
4. Update tests and documentation

### Improving Search Quality
1. Enhance `calculateRelevance()` algorithm
2. Add more sophisticated query expansion
3. Implement result re-ranking
4. Add domain-specific optimizations

---

## Summary

The Web Search Tool successfully implements the missing Tier 3 MCP requirement, providing comprehensive web search capabilities for the Twilio Developer Support Agent. With multiple search engines, specialized search types, intelligent query processing, and robust error handling, it significantly enhances the agent's ability to provide up-to-date information and solutions to developers.

The implementation is production-ready with proper caching, rate limiting, and error handling, making it a valuable addition to the Twilio Developer Support Agent ecosystem.
