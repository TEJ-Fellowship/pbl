# 🔄 Query Routing Flow: "Is Shopify Down Right Now?"

## 📋 Overview

This document explains the complete flow for queries like **"is shopify down right now"** through the system, including classification, RAG search, and MCP tool execution.

---

## 🎯 Query: "is shopify down right now"

### **Step-by-Step Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER QUERY                                    │
│         "is shopify down right now"                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 1: QUERY TYPE CLASSIFICATION                  │
│  (chatController.js:382 - classifyQueryType)                   │
│                                                                  │
│  Query: "is shopify down right now"                             │
│     ↓                                                            │
│  Check: queryLower.includes("shopify")                          │
│     → TRUE ✅                                                    │
│     ↓                                                            │
│  Result:                                                         │
│    {                                                             │
│      queryType: "shopify_related",                              │
│      shouldUseRAG: true,                                        │
│      shouldUseWebSearch: false,                                 │
│      shouldUseMCPTools: false  // ❌ NOT triggered here!        │
│    }                                                             │
│                                                                  │
│  Console Output:                                                 │
│    🎯 Query classified as: shopify_related                      │
│    🔧 Should use RAG: true                                      │
│    🔧 Should use MCP tools: false                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 2: RAG SEARCH (ALWAYS RUNS FIRST)             │
│  (chatController.js:949-974)                                    │
│                                                                  │
│  1. Generate Embedding                                          │
│     Query → Vector [0.123, -0.456, ...]                         │
│                                                                  │
│  2. Intent Classification                                       │
│     await intentClassifier.classifyIntent(message)               │
│     → Intent: "troubleshooting" (likely)                        │
│                                                                  │
│  3. Hybrid Search (Semantic + Keyword)                          │
│     await retriever.search({                                     │
│       query: "is shopify down right now",                        │
│       queryEmbedding: [...],                                   │
│       k: 8                                                      │
│     })                                                           │
│                                                                  │
│  4. Get Search Results                                          │
│     Results: [                                                   │
│       { doc: "...", score: 0.75, ... },                         │
│       { doc: "...", score: 0.68, ... },                        │
│       ...                                                       │
│     ]                                                            │
│                                                                  │
│  ⚠️ NOTE: Even if results are low quality or not found,        │
│     RAG still generates an answer!                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: GENERATE RAG ANSWER                      │
│  (chatController.js:1050-1056)                                  │
│                                                                  │
│  await multiTurnManager.generateEnhancedResponse(                │
│    message,                                                     │
│    sessionId,                                                   │
│    messages,                                                    │
│    results,  // From hybrid search                              │
│    intentSpecificPrompt                                         │
│  )                                                               │
│                                                                  │
│  Generated Answer (example):                                     │
│    "Based on the documentation, I couldn't find specific         │
│     information about current Shopify downtime. However,         │
│     you can check the Shopify status page for real-time         │
│     updates..."                                                 │
│                                                                  │
│  Confidence Score: 65% (moderate - not definitive)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 4: MCP TOOL ENHANCEMENT (AFTER RAG)            │
│  (chatController.js:1086-1105)                                   │
│                                                                  │
│  if (mcpOrchestrator) {                                          │
│    const mcpResult = await mcpOrchestrator.processWithTools(    │
│      message,                                                    │
│      confidence.score / 100,  // 0.65 (from RAG)                │
│      answer  // Original RAG answer                             │
│    )                                                             │
│  }                                                               │
│                                                                  │
│  Inside processWithTools():                                      │
│    1. decideToolUse(query, confidence)                          │
│       ↓                                                          │
│    2. Check: shouldUseStatusChecker(query)                      │
│       Query: "is shopify down right now"                        │
│       Keywords: ["down", "status", "outage", ...]              │
│       Match: "down" ✅                                           │
│       → Returns: true                                           │
│       ↓                                                          │
│    3. Tools Selected: ["shopify_status"]                        │
│                                                                  │
│  Console Output:                                                 │
│    🔧 MCP Decision for query: "is shopify down right now"        │
│       (confidence: 0.65)                                        │
│    🔧 Tools selected: [shopify_status]                          │
│    🔧 Using MCP tools: shopify_status                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 5: EXECUTE SHOPIFY STATUS CHECKER             │
│  (mcpOrchestrator.js:232 - executeTools)                        │
│                                                                  │
│  shopifyStatusTool.checkStatus(query)                            │
│     ↓                                                            │
│  1. Fetch from Shopify Status API                                │
│     GET https://status.shopify.com/api/v2/status.json            │
│                                                                  │
│  2. Parse Status Data                                            │
│     {                                                             │
│       overallStatus: "operational",                              │
│       incidents: [...],                                         │
│       maintenance: [...],                                        │
│       components: [...]                                         │
│     }                                                             │
│                                                                  │
│  3. Generate Status Summary                                      │
│     "## 🟢 Shopify Status Overview                              │
│      All systems operational. No incidents reported."            │
│                                                                  │
│  Result:                                                         │
│    {                                                             │
│      status: { ... },                                           │
│      summary: "## 🟢 Shopify Status Overview...",               │
│      hasIssues: false,                                          │
│      lastChecked: "2024-01-15T10:30:00Z"                        │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 6: ENHANCE ANSWER WITH TOOL RESULTS           │
│  (mcpOrchestrator.js:356 - enhanceAnswerWithToolResults)        │
│                                                                  │
│  Original RAG Answer:                                            │
│    "Based on the documentation, I couldn't find specific         │
│     information about current Shopify downtime..."              │
│                                                                  │
│  + Status Tool Results:                                          │
│    "## 🟢 Shopify Status Overview                                │
│     All systems operational. No incidents reported.             │
│     Last checked: 2024-01-15 10:30 UTC"                        │
│                                                                  │
│  = Enhanced Final Answer:                                        │
│    "Based on the documentation, I couldn't find specific        │
│     information about current Shopify downtime. However,         │
│     you can check the Shopify status page for real-time          │
│     updates.                                                     │
│                                                                  │
│     ## 🟢 Shopify Status Overview                               │
│     All systems operational. No incidents reported.             │
│     Last checked: 2024-01-15 10:30 UTC"                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STEP 7: RETURN FINAL RESPONSE                      │
│                                                                  │
│  Response Object:                                                │
│    {                                                             │
│      answer: "Based on the documentation...",                   │
│      confidence: { score: 85, level: "High" },                  │
│      sources: [...],  // From RAG search                        │
│      mcpTools: {                                                 │
│        toolsUsed: ["shopify_status"],                           │
│        toolResults: {                                            │
│          shopify_status: {                                      │
│            status: {...},                                       │
│            summary: "...",                                      │
│            hasIssues: false                                     │
│          }                                                       │
│        }                                                         │
│      },                                                          │
│      queryClassification: {                                      │
│        queryType: "shopify_related",                            │
│        shouldUseRAG: true                                       │
│      },                                                          │
│      intentClassification: {                                    │
│        intent: "troubleshooting",                               │
│        confidence: 0.85                                         │
│      }                                                           │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Mental Visualization

### **Flow Diagram**

```
                    "is shopify down right now"
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Query Classification│
                    │  (classifyQueryType)│
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Contains "shopify"?  │
                    │      YES ✅          │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ queryType:           │
                    │ "shopify_related"    │
                    │ shouldUseRAG: true   │
                    └─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         RAG SEARCH (ALWAYS FIRST)      │
        │                                         │
        │  1. Generate Embedding                  │
        │  2. Intent Classification               │
        │  3. Hybrid Search (Semantic + Keyword)  │
        │  4. Generate Answer                     │
        │                                         │
        │  Result: Answer + Confidence Score      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    MCP TOOL ENHANCEMENT (AFTER RAG)     │
        │                                         │
        │  processWithTools(query, confidence)    │
        │         │                                │
        │         ▼                                │
        │  decideToolUse()                        │
        │         │                                │
        │         ▼                                │
        │  shouldUseStatusChecker()               │
        │  Query contains "down"? ✅              │
        │         │                                │
        │         ▼                                │
        │  Tools: ["shopify_status"]              │
        │         │                                │
        │         ▼                                │
        │  Execute: shopifyStatusTool.checkStatus()│
        │         │                                │
        │         ▼                                │
        │  Fetch from status.shopify.com          │
        │         │                                │
        │         ▼                                │
        │  Parse & Generate Summary               │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │      ENHANCE ANSWER WITH RESULTS         │
        │                                         │
        │  Original RAG Answer                    │
        │  +                                      │
        │  Status Checker Results                 │
        │  =                                      │
        │  Enhanced Final Answer                  │
        └─────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Return Response    │
                    │   to User            │
                    └─────────────────────┘
```

---

## ✅ Key Points

### **1. Classification Flow**

```
Query: "is shopify down right now"
    ↓
classifyQueryType()
    ↓
Contains "shopify"? → YES
    ↓
queryType = "shopify_related"
shouldUseRAG = true
shouldUseMCPTools = false  // ❌ NOT set here!
```

**Important:** `shouldUseMCPTools` is `false` at this stage because the query is Shopify-related. MCP tools are NOT used as an alternative to RAG, but as an **enhancement** after RAG.

### **2. RAG Always Runs First**

For `shopify_related` queries, RAG **always** runs first, regardless of:
- Whether good results are found
- Confidence score
- Query content

The system doesn't skip RAG even if it knows the answer might not be in the knowledge base.

### **3. MCP Tools as Enhancement (Not Fallback)**

MCP tools are called **AFTER** RAG completes, not as a fallback:

```javascript
// Line 1086-1105 in chatController.js
if (mcpOrchestrator) {
  const mcpResult = await mcpOrchestrator.processWithTools(
    message,
    confidence.score / 100,  // RAG confidence
    answer  // Original RAG answer
  );
  finalAnswer = mcpResult.enhancedAnswer;  // Enhanced with tool results
}
```

**Flow:**
1. RAG generates answer (even if low quality)
2. MCP tools check if they should enhance it
3. If status checker matches, it adds real-time status
4. Final answer = RAG answer + Tool results

### **4. Status Checker Trigger Logic**

```javascript
// shopifyStatusTool.js:126-160
shouldUseStatusChecker(query) {
  const statusKeywords = [
    "down", "not working", "outage", "issue",
    "status", "maintenance", "incident",
    "is shopify down", ...
  ];
  
  return statusKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
}
```

**For "is shopify down right now":**
- Contains "down" → ✅ Returns `true`
- Status checker is executed
- Results are appended to RAG answer

---

## 📊 Terminal Output Example

```
🎯 Query classified as: shopify_related
🔧 Should use web search: false
🔧 Should use MCP tools: false
🔧 Should use RAG: true

🔍 Processed query: "is shopify down right now"
🔍 Performing semantic search...
🔍 Performing keyword search...
📊 Keyword search found 12 results
🔄 Applying fusion ranking...
✅ Hybrid search completed: 8 results

🎯 Intent classified as: troubleshooting (confidence: 0.85)
🎯 Full intent classification object: {
  "intent": "troubleshooting",
  "confidence": 0.85,
  "method": "hybrid"
}

💡 Generated 3 proactive suggestions

🔧 MCP Decision for query: "is shopify down right now" (confidence: 0.65)
🔧 Tools selected: [shopify_status]
🔧 Using MCP tools: shopify_status

🔍 Checking Shopify status for: is shopify down right now
✅ Shopify status check completed

✅ SAVING ASSISTANT MESSAGE:
   - User question: "is shopify down right now"
   - Classified intent: "troubleshooting"
```

---

## 🔍 Code Locations

### **1. Query Classification**
- **File:** `backend/controllers/chatController.js`
- **Function:** `classifyQueryType()` (Line 382)
- **Purpose:** Determines routing strategy (RAG/Web/MCP)

### **2. RAG Search**
- **File:** `backend/controllers/chatController.js`
- **Lines:** 949-974
- **Purpose:** Always runs for Shopify-related queries

### **3. MCP Tool Enhancement**
- **File:** `backend/controllers/chatController.js`
- **Lines:** 1086-1105
- **Function:** `mcpOrchestrator.processWithTools()`

### **4. Status Checker Decision**
- **File:** `backend/src/mcp/mcpOrchestrator.js`
- **Function:** `decideToolUse()` (Line 60)
- **Calls:** `shouldUseStatusChecker()` (Line 106)

### **5. Status Checker Implementation**
- **File:** `backend/src/mcp/shopifyStatusTool.js`
- **Function:** `shouldUseStatusChecker()` (Line 126)
- **Function:** `checkStatus()` (Line 293)

---

## 🎯 Summary

### **Your Understanding:**
> "is shopify down right now" is classified as shopify_related, does RAG, and if answer not found, uses MCP tools (status checker)

### **Actual Flow:**
1. ✅ **Classified as `shopify_related`** → Correct
2. ✅ **RAG always runs first** → Correct
3. ⚠️ **MCP tools run AFTER RAG** (not as fallback) → Slight correction
   - MCP tools enhance the RAG answer
   - Status checker is triggered because query contains "down"
   - Results are appended to the RAG answer

### **Key Difference:**
- **Not:** RAG fails → Use MCP tools
- **Actually:** RAG completes → Check if MCP tools should enhance → Add tool results to answer

---

## 🔄 Alternative Scenarios

### **Scenario 1: Query without "down" keyword**
```
Query: "how do I set up Shopify payments"
    ↓
classifyQueryType() → shopify_related
    ↓
RAG Search → Generates answer
    ↓
processWithTools() → shouldUseStatusChecker() → false
    ↓
No status checker executed
    ↓
Return RAG answer only
```

### **Scenario 2: Non-Shopify status query**
```
Query: "is AWS down right now"
    ↓
classifyQueryType() → general_knowledge
    ↓
shouldUseWebSearch: true
    ↓
Web Search Tool → Searches internet
    ↓
Return web search results
```

### **Scenario 3: High confidence RAG answer**
```
Query: "how to create a product in Shopify"
    ↓
RAG Search → High quality results (score: 0.92)
    ↓
Generate answer → Confidence: 90%
    ↓
processWithTools() → No status checker (no "down" keyword)
    ↓
Return high-confidence RAG answer
```

---

*This document explains the complete routing flow for status-related queries in your Shopify Merchant Support Agent system.*



