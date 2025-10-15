# Twilio Developer Support Agent - MCP Tools Documentation

## Overview

This document provides comprehensive documentation for all Model Context Protocol (MCP) tools available in the Twilio Developer Support Agent. These tools enable the AI assistant to provide advanced technical support for Twilio API integration and debugging.

## Table of Contents

1. [Core Tools](#core-tools)
2. [Advanced Tools](#advanced-tools)
3. [Tool Usage Examples](#tool-usage-examples)
4. [Error Handling](#error-handling)
5. [Configuration](#configuration)

## Core Tools

### 1. `enhance_chat_context`

**Purpose**: Analyzes user queries to detect programming language, API type, and context for better responses.

**Parameters**:
- `query` (string, required): User query to analyze
- `context` (string, optional): Additional conversation context

**Returns**:
```json
{
  "detectedLanguage": "javascript|python|php|java|unknown",
  "detectedAPI": "sms|voice|video|webhook|unknown",
  "suggestedFocus": "getting_started|debugging|error_resolution|best_practices|general",
  "additionalContext": "string",
  "errorCodes": ["array of detected error codes"],
  "confidence": 0.0-1.0
}
```

**Example**:
```javascript
{
  "query": "How do I send an SMS in Node.js?",
  "context": "I'm getting error 20003"
}
```

### 2. `validate_twilio_code`

**Purpose**: Validates Twilio API code snippets and identifies common issues.

**Parameters**:
- `code` (string, required): Code snippet to validate
- `language` (string, optional): Programming language (default: "javascript")

**Returns**:
```json
{
  "isValid": boolean,
  "issues": ["array of issues found"],
  "suggestions": ["array of improvement suggestions"],
  "language": "string",
  "confidence": 0.0-1.0
}
```

**Example**:
```javascript
{
  "code": "const twilio = require('twilio');\nconst client = twilio(accountSid, authToken);",
  "language": "nodejs"
}
```

### 3. `lookup_error_code`

**Purpose**: Provides detailed information about Twilio error codes.

**Parameters**:
- `errorCode` (string, required): Twilio error code (e.g., "30001", "20003")

**Returns**:
```json
{
  "found": boolean,
  "message": "Error message",
  "description": "Detailed description",
  "solution": "Recommended solution",
  "category": "authentication|resource|validation|rate_limit|account|delivery|unknown",
  "errorCode": "string"
}
```

**Example**:
```javascript
{
  "errorCode": "30001"
}
```

### 4. `detect_programming_language`

**Purpose**: Automatically detects programming language from code snippets or text.

**Parameters**:
- `text` (string, required): Text or code snippet to analyze

**Returns**:
```json
{
  "language": "javascript|python|php|java|unknown",
  "confidence": 0.0-1.0,
  "scores": {
    "javascript": number,
    "python": number,
    "php": number,
    "java": number
  }
}
```

**Example**:
```javascript
{
  "text": "import twilio\nfrom twilio import Client"
}
```

### 5. `web_search`

**Purpose**: Searches for current Twilio documentation, updates, or recent issues.

**Parameters**:
- `query` (string, required): Search query for Twilio-related information
- `maxResults` (number, optional): Maximum results to return (default: 5)

**Returns**:
```json
{
  "found": boolean,
  "totalResults": "string",
  "searchTime": "string",
  "query": "string",
  "results": [
    {
      "rank": number,
      "title": "string",
      "link": "string",
      "snippet": "string",
      "displayLink": "string"
    }
  ]
}
```

**Example**:
```javascript
{
  "query": "Twilio SMS API rate limits 2024",
  "maxResults": 3
}
```

## Advanced Tools

### 6. `check_twilio_status`

**Purpose**: Checks Twilio service status for ongoing disruptions or maintenance.

**Parameters**:
- `service` (string, optional): Specific service to check (sms, voice, video, whatsapp)

**Returns**:
```json
{
  "status": "operational|degraded|outage|unknown",
  "confidence": 0.0-1.0,
  "service": "string",
  "lastChecked": "ISO timestamp",
  "issues": [
    {
      "title": "string",
      "description": "string",
      "source": "string"
    }
  ],
  "message": "string",
  "recommendation": "string"
}
```

**Example**:
```javascript
{
  "service": "sms"
}
```

### 7. `validate_webhook_signature`

**Purpose**: Validates Twilio webhook signatures and payload formats.

**Parameters**:
- `signature` (string, required): X-Twilio-Signature header value
- `url` (string, required): Full webhook URL that was called
- `payload` (string, required): Raw webhook payload body
- `authToken` (string, required): Twilio Auth Token for validation

**Returns**:
```json
{
  "isValid": boolean,
  "validationChecks": {
    "signatureMatch": boolean,
    "urlFormat": boolean,
    "payloadFormat": boolean,
    "authTokenFormat": boolean
  },
  "issues": ["array of issues"],
  "expectedSignature": "string",
  "providedSignature": "string",
  "recommendation": "string"
}
```

**Example**:
```javascript
{
  "signature": "base64-encoded-signature",
  "url": "https://myapp.com/webhook",
  "payload": "{\"MessageSid\":\"SM123\"}",
  "authToken": "your-auth-token"
}
```

### 8. `calculate_rate_limits`

**Purpose**: Calculates if user's API usage will exceed Twilio rate limits.

**Parameters**:
- `apiType` (string, required): Type of API (sms, voice, video, whatsapp)
- `requestsPerSecond` (number, required): Number of requests per second
- `requestsPerMinute` (number, required): Number of requests per minute
- `accountTier` (string, optional): Account tier (trial, pay-as-you-go, enterprise)

**Returns**:
```json
{
  "willExceedLimits": boolean,
  "limits": {
    "perSecond": number,
    "perMinute": number
  },
  "currentUsage": {
    "perSecond": number,
    "perMinute": number
  },
  "warnings": ["array of warnings"],
  "recommendations": ["array of recommendations"],
  "accountTier": "string",
  "apiType": "string",
  "upgradeNeeded": boolean
}
```

**Example**:
```javascript
{
  "apiType": "sms",
  "requestsPerSecond": 2,
  "requestsPerMinute": 150,
  "accountTier": "pay-as-you-go"
}
```

### 9. `execute_twilio_code`

**Purpose**: Executes simple Twilio API calls in sandboxed test mode.

**Parameters**:
- `code` (string, required): Twilio API code to execute
- `language` (string, optional): Programming language (nodejs, python, php)
- `testMode` (boolean, optional): Whether to run in test mode (default: true)

**Returns**:
```json
{
  "success": boolean,
  "output": "string",
  "errors": ["array of errors"],
  "warnings": ["array of warnings"],
  "testMode": boolean,
  "language": "string"
}
```

**Example**:
```javascript
{
  "code": "const twilio = require('twilio');\nconst client = twilio(accountSid, authToken);\nclient.messages.create({...})",
  "language": "nodejs",
  "testMode": true
}
```

## Tool Usage Examples

### Example 1: Complete SMS Integration Support

```javascript
// 1. Enhance context
{
  "tool": "enhance_chat_context",
  "args": {
    "query": "I'm getting error 21211 when sending SMS",
    "context": "Using Node.js with Twilio"
  }
}

// 2. Look up error code
{
  "tool": "lookup_error_code",
  "args": {
    "errorCode": "21211"
  }
}

// 3. Validate user's code
{
  "tool": "validate_twilio_code",
  "args": {
    "code": "client.messages.create({to: '123', from: '+1234567890', body: 'Hello'})",
    "language": "nodejs"
  }
}

// 4. Check if rate limits are an issue
{
  "tool": "calculate_rate_limits",
  "args": {
    "apiType": "sms",
    "requestsPerSecond": 1,
    "requestsPerMinute": 50,
    "accountTier": "pay-as-you-go"
  }
}
```

### Example 2: Webhook Debugging

```javascript
// 1. Validate webhook signature
{
  "tool": "validate_webhook_signature",
  "args": {
    "signature": "received-signature",
    "url": "https://myapp.com/webhook",
    "payload": "webhook-payload",
    "authToken": "auth-token"
  }
}

// 2. Check service status
{
  "tool": "check_twilio_status",
  "args": {
    "service": "sms"
  }
}
```

### Example 3: Code Testing and Validation

```javascript
// 1. Detect language
{
  "tool": "detect_programming_language",
  "args": {
    "text": "from twilio import Client\nclient = Client(account_sid, auth_token)"
  }
}

// 2. Execute code in test mode
{
  "tool": "execute_twilio_code",
  "args": {
    "code": "from twilio import Client\nclient = Client(account_sid, auth_token)\nclient.messages.create(...)",
    "language": "python",
    "testMode": true
  }
}
```

## Error Handling

All tools return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "tool": "tool_name"
}
```

Common error scenarios:
- Invalid parameters
- Network connectivity issues
- API rate limiting
- Authentication failures
- Malformed input data

## Configuration

### Required Environment Variables

```bash
# Google Custom Search API (for web search)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id

# Twilio Credentials (for testing)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

### Rate Limits

- **Web Search**: 100 queries/day (Google Custom Search free tier)
- **Status Checks**: No limits (uses web search)
- **Code Execution**: No limits (sandboxed simulation)
- **Other Tools**: No external API calls

## Security Considerations

1. **Webhook Validation**: Always validate webhook signatures in production
2. **Code Execution**: Current implementation is sandboxed and safe
3. **Auth Tokens**: Never log or expose Twilio credentials
4. **Rate Limiting**: Implement appropriate rate limiting for production use

## Troubleshooting

### Common Issues

1. **Web Search Not Working**
   - Check Google Custom Search API credentials
   - Verify API quota hasn't been exceeded

2. **Code Execution Failing**
   - Ensure code syntax is valid for the specified language
   - Check that Twilio library imports are present

3. **Webhook Validation Errors**
   - Verify Auth Token format (32 alphanumeric characters)
   - Ensure URL and payload are exactly as received

4. **Rate Limit Calculations Incorrect**
   - Check account tier is correctly specified
   - Verify API type matches Twilio's naming convention

## Support

For issues with MCP tools:
1. Check the error messages in tool responses
2. Verify all required parameters are provided
3. Ensure environment variables are properly configured
4. Review the tool documentation for parameter requirements

## Version History

- **v1.0.0**: Initial implementation with core tools
- **v1.1.0**: Added advanced tools (status check, webhook validation, rate limits, code execution)
- **v1.1.1**: Enhanced error handling and documentation
