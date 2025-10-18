# 🔍 Google Custom Search API Setup Guide

This guide will help you set up Google Custom Search API for the MCP Web Search Tool, replacing the Brave Search API.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Google Search API Key

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**

   - Click "Select a project" → "New Project"
   - Name: "Stripe Support Agent" (or any name)
   - Click "Create"

3. **Enable Custom Search API**

   - Go to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click on it and press "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key (looks like: `AIzaSyB...`)

### Step 2: Create Custom Search Engine

1. **Go to Google Programmable Search Engine**

   - Visit: https://programmablesearchengine.google.com/
   - Click "Add" to create a new search engine

2. **Configure Search Engine**

   - **Sites to search**: Add these URLs (one per line):
     ```
     stripe.com
     support.stripe.com
     docs.stripe.com
     ```
   - **Language**: English
   - **Name**: "Stripe Documentation Search"

3. **Get Search Engine ID**
   - **Before this, click on "Customize" and then select "Programmatic Access".**
   - Then, copy the "Search Engine ID" (looks like: `0175766625124682`)

### Step 3: Update Environment Variables

1. **Create/Update `.env` file**:

   ```env
   # Google Custom Search API Configuration
   GOOGLE_SEARCH_API_KEY=AIzaSyB...your_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=01757666251246823


   ```

2. **Test the configuration**:
   ```bash
   npm run test:mcp
   ```

## 📊 API Limits & Pricing

### Free Tier

- **100 queries per day**
- **Perfect for development and testing**
- **No credit card required**

### Paid Tier (if needed)

- **$5 per 1,000 queries** (after free tier)
- **Up to 10,000 queries per day**
- **Better for production use**

## 🔧 Configuration Details

### Search Engine Settings

- **Search only**: stripe.com, support.stripe.com, docs.stripe.com
- **Safe Search**: Active
- **Language**: English
- **Results per page**: 10

### API Parameters Used

```javascript
{
  key: process.env.GOOGLE_SEARCH_API_KEY,
  cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
  q: searchQuery,
  num: 10,
  safe: 'active',
  fields: 'items(title,link,snippet,pagemap)'
}
```

## 🧪 Testing Your Setup

### 1. Test API Key

```bash
# Test if API key works
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=stripe%20api"
```

### 2. Test MCP Integration

```bash
# Run MCP tests
npm run test:mcp

# Run specific web search test
node -e "
import WebSearchTool from './services/mcp/webSearchTool.js';
const tool = new WebSearchTool();
tool.execute('stripe webhooks').then(console.log);
"
```

### 3. Test in Chat

```bash
# Start interactive chat
node examples/mcpChatExample.js
# Try: "What are the latest Stripe webhook updates?"
```

## 🚨 Troubleshooting

### Common Issues

1. **"API key not valid"**

   - Check if Custom Search API is enabled
   - Verify API key is correct
   - Ensure billing is set up (even for free tier)

2. **"Search Engine ID not found"**

   - Verify the Search Engine ID is correct
   - Check if the custom search engine is active
   - Ensure it's configured to search the right sites

3. **"Quota exceeded"**

   - You've used all 100 free queries for the day
   - Wait until tomorrow or upgrade to paid plan
   - Check usage in Google Cloud Console

4. **"No results found"**
   - Verify your custom search engine is configured correctly
   - Check if the sites are properly added
   - Test with a simple query like "stripe api"

### Debug Mode

Enable debug logging:

```bash
DEBUG=mcp:* npm run test:mcp
```

## 🔄 Migration from Brave Search

If you were using Brave Search before:

1. **Remove Brave API key** from `.env`
2. **Add Google API credentials** (see Step 3 above)
3. **Update any hardcoded references** to Brave Search
4. **Test the new integration**

## 📈 Performance Comparison

| Feature            | Brave Search       | Google Custom Search |
| ------------------ | ------------------ | -------------------- |
| **Free Tier**      | Paid only          | 100 queries/day      |
| **Setup Time**     | 5-10 minutes       | 5 minutes            |
| **Search Quality** | Good               | Excellent            |
| **Rate Limits**    | 1,000/month (paid) | 100/day (free)       |
| **Stripe Focus**   | Manual filtering   | Custom search engine |

## 🎯 Best Practices

1. **Cache Results**: The tool already caches for 10 minutes
2. **Monitor Usage**: Check Google Cloud Console for usage
3. **Optimize Queries**: Use specific Stripe terms
4. **Handle Errors**: The tool gracefully handles API failures
5. **Rate Limiting**: Don't exceed 100 queries/day on free tier

## 🔗 Useful Links

- [Google Custom Search API Documentation](https://developers.google.com/custom-search/v1/introduction)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Custom Search Engine Setup](https://cse.google.com/)
- [API Quotas and Limits](https://developers.google.com/custom-search/v1/overview#pricing)

---

**Note**: This setup provides a free, reliable web search fallback for your Stripe Intelligence Agent. The 100 queries/day limit is perfect for development and testing, with easy upgrade path for production use.
