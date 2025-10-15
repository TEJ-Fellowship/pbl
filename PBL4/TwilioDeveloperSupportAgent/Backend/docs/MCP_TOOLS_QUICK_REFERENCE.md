# MCP Tools Quick Reference

## All Available Tools

| Tool | Purpose | Status |
|------|---------|--------|
| `enhance_chat_context` | Analyze queries for language/API detection | ✅ Implemented |
| `validate_twilio_code` | Validate Twilio code snippets | ✅ Implemented |
| `lookup_error_code` | Look up Twilio error codes | ✅ Implemented |
| `detect_programming_language` | Auto-detect programming language | ✅ Implemented |
| `web_search` | Search Twilio documentation | ✅ Implemented |
| `check_twilio_status` | Check service status | ✅ **NEW** |
| `validate_webhook_signature` | Validate webhook signatures | ✅ **NEW** |
| `calculate_rate_limits` | Calculate rate limit compliance | ✅ **NEW** |
| `execute_twilio_code` | Execute code in sandbox | ✅ **NEW** |

## Tier 3 Requirements Status

### ✅ Completed Requirements
- [x] Web search for recent Twilio updates or known issues
- [x] Code validator: Check API endpoint URLs, required parameters
- [x] Twilio Status API: Check for service disruptions
- [x] Webhook tester: Validate webhook signatures and payload formats
- [x] Rate limit calculator: Estimate if user's volume exceeds limits
- [x] Code executor (sandboxed): Test simple Twilio API calls in test mode

### Additional Features Implemented
- [x] Programming language detection
- [x] Error code lookup with detailed explanations
- [x] Context enhancement for better responses
- [x] Comprehensive validation checks
- [x] Detailed documentation and examples

## Quick Usage Examples

### Check if all Tier 3 tools are working:
```bash
# Test status check
curl -X POST http://localhost:3001/mcp/call \
  -d '{"tool": "check_twilio_status", "args": {"service": "sms"}}'

# Test webhook validation
curl -X POST http://localhost:3001/mcp/call \
  -d '{"tool": "validate_webhook_signature", "args": {"signature": "test", "url": "https://example.com", "payload": "{}", "authToken": "test123456789012345678901234567890"}}'

# Test rate limit calculation
curl -X POST http://localhost:3001/mcp/call \
  -d '{"tool": "calculate_rate_limits", "args": {"apiType": "sms", "requestsPerSecond": 2, "requestsPerMinute": 150}}'

# Test code execution
curl -X POST http://localhost:3001/mcp/call \
  -d '{"tool": "execute_twilio_code", "args": {"code": "console.log(\"Hello Twilio\");", "language": "nodejs"}}'
```

## Implementation Notes

- All tools are fully implemented and tested
- Error handling is comprehensive
- Documentation is complete with examples
- Tools follow MCP protocol standards
- Security considerations are addressed
- Rate limiting and validation are built-in
