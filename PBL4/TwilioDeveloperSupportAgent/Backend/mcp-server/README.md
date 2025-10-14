# Twilio Web Search MCP Server

A Model Context Protocol (MCP) server that provides web search capabilities specifically optimized for Twilio developer support.

## Features

- **Web Search**: General web search with Twilio-specific optimizations
- **Twilio Updates**: Search for recent Twilio updates and news
- **Error Solutions**: Find solutions for specific Twilio error codes
- **Community Discussions**: Search community forums and discussions
- **Search Statistics**: Get insights about search performance

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### As an MCP Server

The server communicates via stdio using the Model Context Protocol:

```bash
node server.js
```

### Available Tools

#### 1. web_search
General web search with Twilio-specific optimizations.

**Parameters:**
- `query` (string, required): The search query
- `maxResults` (number, optional): Maximum results (default: 10)
- `searchEngines` (array, optional): Engines to use (default: ["google", "duckduckgo"])
- `includeRecent` (boolean, optional): Prioritize recent results (default: true)

#### 2. twilio_updates
Search specifically for recent Twilio updates and news.

**Parameters:**
- `query` (string, required): Search query for updates
- `maxResults` (number, optional): Maximum results (default: 5)

#### 3. error_solutions
Find solutions for specific Twilio error codes.

**Parameters:**
- `errorCode` (string, required): The Twilio error code
- `query` (string, optional): Additional search context
- `maxResults` (number, optional): Maximum results (default: 8)

#### 4. community_discussions
Search community forums and discussions.

**Parameters:**
- `query` (string, required): Search query for discussions
- `maxResults` (number, optional): Maximum results (default: 6)

#### 5. search_stats
Get search tool statistics.

**Parameters:** None

## Configuration

The server uses the existing `WebSearchTool` class from the parent project, which includes:

- Multiple search engines (Google, DuckDuckGo)
- Twilio-specific source prioritization
- Result caching and deduplication
- Relevance scoring
- Error code detection

## Integration

This MCP server can be integrated with any MCP-compatible client, such as:

- Claude Desktop
- Custom MCP clients
- AI assistants that support MCP

## Example MCP Client Configuration

For Claude Desktop, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "twilio-web-search": {
      "command": "node",
      "args": ["/path/to/mcp-server/server.js"],
      "cwd": "/path/to/mcp-server"
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with debugging
npm run dev

# Run normally
npm start
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `axios`: HTTP client for web requests
- `cheerio`: HTML parsing for search results
- `date-fns`: Date manipulation utilities

## License

MIT
