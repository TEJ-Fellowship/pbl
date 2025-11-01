# MCP Policy Query Handling Critique

## Executive Summary

Policy-related MCP handling has **good foundation** but needs **improvements** for better policy change detection, result formatting, and user experience.

---

## ✅ What's Working Well

### 1. **Query Classification** ✓

- QueryRouter correctly identifies policy queries
- Routes to `hybrid` or `mcp_only` with `web_search` tool
- Fallback detection patterns are comprehensive

### 2. **Web Search Implementation** ✓

- Extended date range (3 months) for policy queries
- Filters to only PayPal official policy pages
- Includes country-specific pages (AU, UK, US)
- Returns up to 5 results for policy queries

### 3. **Error Handling** ✓

- Try-catch blocks in tool execution
- Graceful fallback when AI tool selection fails
- Proper error messages returned

---

## ❌ Critical Issues Found

### 1. **Result Limiting Mismatch** 🔴 HIGH PRIORITY

**Location**: `mcp-server/src/index.js:206`

**Issue**: MCP server response limits results to 3, but `webSearch.js` returns 5 for policy queries.

```javascript
// Current (WRONG):
text: `Found ${results.length} recent results:\n\n${results
  .slice(0, 3)  // ← Hardcoded to 3 results
```

**Impact**: Policy queries lose 2 potentially important results.

**Fix**: Make result limit dynamic based on query type.

---

### 2. **Undefined Variable Bug** 🔴 HIGH PRIORITY

**Location**: `mcp-server/src/index.js:196`

**Issue**: Uses undefined variable `q` instead of `args.query`.

```javascript
// Current (WRONG):
text: `No recent results found for: ${q}`,  // ← 'q' is undefined

// Should be:
text: `No recent results found for: ${args.query}`,
```

**Impact**: Throws error when no results found for policy queries.

---

### 3. **Misleading "Recent" Message** 🟡 MEDIUM PRIORITY

**Location**: `mcp-server/src/index.js:509, 196`

**Issue**: Message says "No recent results" but policy queries look back 3 months.

```javascript
// Current:
message: `No recent results found for: ${query}`,
```

**Impact**: Confusing message for policy queries that intentionally search older updates.

**Fix**: Context-aware messages based on query type.

---

### 4. **Missing Policy Query Examples** 🟡 MEDIUM PRIORITY

**Location**: `backend/services/mcpToolsSchema.js:65-72`

**Issue**: Tool schema has no examples for policy queries.

```javascript
examples: [
  {
    query: "is paypal down today",
    arguments: {
      query: "PayPal outage status today",
    },
  },
],
```

**Impact**: AI may not recognize policy queries as candidates for `search_web` tool.

**Fix**: Add policy change query examples.

---

### 5. **Tool Selection Prompt Missing Policy Guidance** 🟡 MEDIUM PRIORITY

**Location**: `backend/services/utils/mcpToolSelector.js:25-51`

**Issue**: Tool selection prompt doesn't specifically guide AI to use `search_web` for policy queries.

**Impact**: AI might not select `search_web` for policy queries reliably.

**Fix**: Add specific guidance about policy queries in the prompt.

---

### 6. **Response Doesn't Highlight Official Sources** 🟡 MEDIUM PRIORITY

**Location**: `mcp-server/src/index.js:201-214`

**Issue**: Response doesn't indicate that results are from official PayPal policy pages.

**Current format**:

```
1. Policy Title
   Policy snippet
   https://paypal.com/...
```

**Better format**:

```
1. [OFFICIAL] Policy Title
   Policy snippet
   📅 Updated: [date if available]
   🔗 https://paypal.com/...
```

**Impact**: Users don't immediately know these are official sources.

---

### 7. **No Date Information in Results** 🟡 MEDIUM PRIORITY

**Location**: `mcp-server/src/components/webSearch.js` → `mcp-server/src/index.js`

**Issue**: Results don't show when policy was updated (we search back 3 months but don't show dates).

**Impact**: Users can't tell how recent policy changes are.

**Fix**: Include date metadata in search results if available.

---

## 📋 Recommended Fixes Priority

### Immediate (Before Production)

1. ✅ Fix undefined variable `q` → `args.query`
2. ✅ Make result limit dynamic (5 for policy queries, 3 for others)

### High Priority

3. ✅ Add policy query examples to tool schema
4. ✅ Update tool selection prompt with policy query guidance
5. ✅ Context-aware messages (not just "recent")

### Medium Priority

6. ✅ Highlight official sources in response format
7. ✅ Include date information in results
8. ✅ Better formatting for policy query responses

---

## 🔧 Specific Code Fixes Needed

### Fix 1: Undefined Variable

```javascript
// mcp-server/src/index.js:196
- text: `No recent results found for: ${q}`,
+ text: `No recent results found for: ${args.query}`,
```

### Fix 2: Dynamic Result Limit

```javascript
// mcp-server/src/index.js:201-214
const isPolicyQuery = /(policy.*change|policy.*update|change.*policy)/i.test(args.query);
const resultLimit = isPolicyQuery ? 5 : 3;
text: `Found ${results.length} results:\n\n${results
  .slice(0, resultLimit)
```

### Fix 3: Add Policy Query Example

```javascript
// backend/services/mcpToolsSchema.js:65-72
examples: [
  {
    query: "is paypal down today",
    arguments: {
      query: "PayPal outage status today",
    },
  },
  {
    query: "what are the recent policy changes",
    arguments: {
      query: "PayPal policy changes updates",
    },
  },
],
```

---

## 📊 Overall Assessment

| Category            | Score | Notes                            |
| ------------------- | ----- | -------------------------------- |
| **Functionality**   | 7/10  | Works but has bugs               |
| **User Experience** | 6/10  | Messages could be clearer        |
| **Error Handling**  | 8/10  | Good fallback mechanisms         |
| **Code Quality**    | 7/10  | Some undefined variables         |
| **Documentation**   | 6/10  | Missing policy-specific examples |

**Overall Grade: B+ (Good, but needs fixes)**

---

## ✅ Test Cases to Verify Fixes

1. **Policy Query Test**

   - Query: "What are the recent policy changes?"
   - Expected: Returns 5 results from PayPal official policy pages
   - Verify: No undefined variable errors

2. **Australian Policy Test**

   - Query: "Australian policy changes"
   - Expected: Includes AU-specific policy pages
   - Verify: Results show official sources clearly

3. **No Results Test**

   - Query: "Policy changes from 2020"
   - Expected: Graceful "no results" message
   - Verify: Uses correct variable, doesn't say "recent" if searching older

4. **Mixed Query Test**
   - Query: "Recent policy updates and PayPal status"
   - Expected: Uses web_search tool correctly
   - Verify: Tool selection prompt guides AI properly

---

## 🎯 Conclusion

The policy MCP handling has a **solid foundation** with good search logic and filtering. However, there are **critical bugs** (undefined variable) and **UX improvements** needed to make it production-ready. With the fixes above, this would be an **excellent** implementation.

**Recommendation**: Fix critical bugs immediately, then implement UX improvements before next release.
