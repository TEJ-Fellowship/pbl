# ⚡ MCP Architecture Flow

**Model Context Protocol with Gemini LLM, RAG Pipeline & Multiple MCP Servers**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP HOST (e.g., VS Code, IDE)                        │
│                     Contains: Gemini LLM + MCP Clients                      │
└────────────────┬────────────────┬───────────────┬──────────────────────────┘
                 │                │               │
         ┌───────┴───────┐ ┌─────┴─────┐ ┌───────┴────────┐
         │               │ │           │ │                │
         ▼               ▼ ▼           ▼ ▼                ▼
    ┌─────────┐     ┌─────────┐   ┌─────────┐      ┌──────────┐
    │ Client 1│     │ Client 2│   │ Client 3│      │ Client N │
    └────┬────┘     └────┬────┘   └────┬────┘      └────┬─────┘
         │               │             │                │
    JSON-RPC        JSON-RPC       JSON-RPC         JSON-RPC
    stdio/HTTP      stdio/HTTP     stdio/HTTP       stdio/HTTP
         │               │             │                │
         ▼               ▼             ▼                ▼
    ┌─────────┐     ┌─────────┐   ┌─────────┐      ┌──────────┐
    │Server 1 │     │Server 2 │   │Server 3 │      │ Server N │
    │(GitHub) │     │(RAG     │   │(Postgres│      │ (Gmail)  │
    │         │     │Pipeline)│   │  FS)    │      │          │
    └────┬────┘     └────┬────┘   └────┬────┘      └────┬─────┘
         │               │             │                │
         ▼               ▼             ▼                ▼
   GitHub API      PostgreSQL +    File System     Gmail API
                   Pinecone DB
```

> **Note:** Each Client connects to EXACTLY ONE MCP Server. The Host coordinates all Clients and contains the LLM.

## 📋 Correct MCP Flow (Step-by-Step)

### Step 1: MCP HOST INITIALIZATION

**What happens:**
- MCP Host (VS Code/IDE) starts up
- Host initializes Gemini LLM
- Host spawns multiple MCP Clients (one per server)
- Each Client connects to its designated MCP Server

```
Host → Spawn Client1, Client2, Client3...
Client1 → Connect to Server1 (GitHub)
Client2 → Connect to Server2 (RAG Pipeline)  
Client3 → Connect to Server3 (PostgreSQL/FS)
```

### Step 2: TOOL DISCOVERY (Client → Server)

Each Client requests available tools from its Server:

```json
Client1 → Server1: { "jsonrpc": "2.0", "method": "tools/list" }
Server1 → Client1: { "tools": ["create_issue", "list_repos", "create_pr"] }

Client2 → Server2: { "jsonrpc": "2.0", "method": "tools/list" }
Server2 → Client2: { "tools": ["rag_search", "embed_query", "hybrid_search"] }

Client3 → Server3: { "jsonrpc": "2.0", "method": "tools/list" }
Server3 → Client3: { "tools": ["read_file", "write_file", "query_db"] }
```

**Result:** Each Client now knows what tools its Server provides

### Step 3: CLIENT REPORTS TO LLM (Client → Gemini LLM)

All Clients send their discovered tools to Gemini LLM:

```javascript
Client1 → Gemini: "I can: create_issue, list_repos, create_pr"
Client2 → Gemini: "I can: rag_search, embed_query, hybrid_search"
Client3 → Gemini: "I can: read_file, write_file, query_db"

Gemini now has complete tool registry:
{
  "github_tools": ["create_issue", "list_repos", "create_pr"],
  "rag_tools": ["rag_search", "embed_query", "hybrid_search"],
  "filesystem_tools": ["read_file", "write_file", "query_db"]
}
```

**Critical:** **LLM NOW KNOWS ALL AVAILABLE TOOLS**

### Step 4: USER SENDS QUERY

User interacts with chat interface:

```
User: "I'm frustrated! Find React hooks documentation and create a GitHub issue"

↓ Query sent to Gemini LLM
```

### Step 5: LLM ANALYZES & DECIDES TOOLS (Gemini LLM Processing)

Gemini LLM processes the query:
- Detects emotion: **frustration/anger**
- Identifies required actions:
  - Search for React hooks docs → needs **rag_search**
  - Create GitHub issue → needs **create_issue**
- Generates function calls for required tools

```
Gemini decides:
1. Call rag_search(query="React hooks documentation", emotion="frustrated")
2. Call create_issue(title="React hooks help", tone="sympathetic")
```

### Step 6: LLM REQUESTS TOOLS (Gemini → Clients)

Gemini sends tool execution requests to appropriate Clients:

```
Gemini → Client2: "Execute rag_search with params {query: 'React hooks', emotion: 'frustrated'}"
Gemini → Client1: "Execute create_issue with params {title: '...', body: '...'}"
```

### Step 7: CLIENTS MAKE JSON-RPC CALLS (Client → Server)

Each Client forwards request to its Server via JSON-RPC:

**Client2 → Server2 (RAG Pipeline):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "rag_search",
    "arguments": {
      "query": "React hooks documentation",
      "emotion": "frustrated"
    }
  }
}
```

**Client1 → Server1 (GitHub):**
```json
{
  "jsonrpc": "2.0", 
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "title": "Need React hooks documentation",
      "body": "User needs help with React hooks",
      "tone": "sympathetic"
    }
  }
}
```

### Step 8: SERVERS EXECUTE TOOLS (Server Processing)

#### 🧠 Server2 (RAG Pipeline) Execution:

**Sub-steps:**

1. **Query Vectorization:**
```python
query_text = "React hooks documentation"
query_vector = embedding_model.embed(query_text)
# Returns: [0.234, 0.891, -0.432, ...]
```

2. **Semantic Analysis:**
```python
emotion = "frustrated"
semantic_weight = calculate_semantic_value(emotion)
# frustrated → HIGH_PRIORITY → weight = 1.5
# Adjust search: prioritize recent, highly-rated docs
```

3. **Parallel Hybrid Search:**
```python
# Vector Search (Pinecone)
pinecone_results = pinecone.query(
    vector=query_vector,
    top_k=10,
    filter={"category": "react"}
)

# Semantic Search (PostgreSQL)
postgres_results = db.execute("""
    SELECT id, content, ts_rank(
        to_tsvector('english', content),
        to_tsquery('english', 'React & hooks & documentation')
    ) AS rank
    FROM documents
    WHERE to_tsvector('english', content) @@ 
          to_tsquery('english', 'React & hooks & documentation')
    ORDER BY rank DESC
    LIMIT 10
""")
```

4. **Result Fusion (Hybrid Binary Search):**
```python
# Merge results with weighted scoring
combined_results = []
for doc in pinecone_results:
    score = doc.similarity * 0.6 * semantic_weight
    combined_results.append({doc_id: doc.id, score: score})

for doc in postgres_results:
    score = doc.rank * 0.4 * semantic_weight
    # Check if doc already exists, merge scores
    existing = find(combined_results, doc.id)
    if existing:
        existing.score += score
    else:
        combined_results.append({doc_id: doc.id, score: score})

# Binary search on sorted results
combined_results.sort(key=lambda x: x.score, reverse=True)
top_results = combined_results[:5]
```

5. **Return Results:**
```python
return {
    "results": [
        {"title": "React Hooks Guide", "url": "...", "snippet": "..."},
        {"title": "useState Hook", "url": "...", "snippet": "..."},
        ...
    ],
    "metadata": {
        "semantic_weight": 1.5,
        "emotion_detected": "frustrated",
        "total_sources": 5
    }
}
```

#### 📝 Server1 (GitHub) Execution:

```python
# Authenticate with OAuth
github_api.authenticate(oauth_token)

# Create issue with sympathetic tone
issue = github_api.create_issue(
    repo="user/react-project",
    title="Need React hooks documentation",
    body="I understand you're having trouble. Here are some resources...",
    labels=["documentation", "help-wanted"]
)

return {
    "issue_url": issue.html_url,
    "issue_number": issue.number
}
```

### Step 9: SERVERS RESPOND (Server → Client)

Each Server sends JSON-RPC response back to its Client:

```json
Server2 → Client2:
{
  "jsonrpc": "2.0",
  "result": {
    "results": [...documents...],
    "metadata": {...}
  }
}

Server1 → Client1:
{
  "jsonrpc": "2.0",
  "result": {
    "issue_url": "https://github.com/user/repo/issues/42",
    "issue_number": 42
  }
}
```

### Step 10: CLIENTS FORWARD TO LLM (Client → Gemini)

Clients send results back to Gemini LLM:

```javascript
Client2 → Gemini: {
    "tool": "rag_search",
    "results": [...React hooks documentation...]
}

Client1 → Gemini: {
    "tool": "create_issue", 
    "result": {
        "issue_url": "https://github.com/user/repo/issues/42"
    }
}
```

### Step 11: LLM SYNTHESIZES RESPONSE (Gemini Processing)

Gemini LLM combines all results into natural language:

```
Input to Gemini:
- User query: "I'm frustrated! Find React hooks docs and create issue"
- RAG results: [5 documentation articles]
- GitHub result: {issue_url: "..."}
- Detected emotion: frustrated

Gemini generates:
"I understand your frustration! Here's what I found:

📚 React Hooks Documentation:
1. Official React Hooks Guide: [link]
2. useState Hook Reference: [link]
3. useEffect Complete Guide: [link]

I've also created a GitHub issue to track this: 
🔗 Issue #42: https://github.com/user/repo/issues/42

Let me know if you need more specific examples or have questions!"
```

### Step 12: RESPONSE TO USER (Gemini → User Interface)

Final response displayed in chat interface to user

```
Chat Interface displays Gemini's natural language response
User sees: Documentation links + GitHub issue + sympathetic tone
```

## ⚠️ KEY CORRECTIONS FROM PREVIOUS VERSION

- **Architecture:** Host contains LLM + multiple Clients. Each Client connects to ONE Server.
- **Flow Order:** Client connects → Client requests tools/list → Client gives list to LLM → LLM knows tools → User queries → LLM decides tools → Client makes JSON-RPC call → Server executes → Response to Client → Client to LLM → LLM generates natural response → User sees response
- **Tool Discovery:** Happens BEFORE any user query (initialization phase)
- **LLM Role:** LLM doesn't directly call servers. LLM tells Clients which tools to execute, Clients handle JSON-RPC.
- **One-to-One:** Each MCP Client connects to exactly ONE MCP Server

## 🔧 Technology Stack in This Architecture

### MCP Host (Container)
- **Example:** VS Code, Custom IDE, Cline Editor
- **Contains:** Gemini LLM + Multiple MCP Clients
- **Responsibilities:** Coordinate Clients, manage LLM, handle UI

### LLM: Gemini Pro/Ultra
- **Model:** gemini-pro, gemini-1.5-pro, gemini-ultra
- **Function Calling:** Native support for tool execution
- **Context Window:** Large enough for RAG results + conversation history

### MCP Servers (Examples)
- **Server 1:** GitHub (create issues, PRs, list repos)
- **Server 2:** RAG Pipeline (hybrid search, embeddings)
- **Server 3:** PostgreSQL/Filesystem (read/write files, query DB)
- **Server N:** Gmail, Slack, Sentry, etc.

### RAG Pipeline Components
- **PostgreSQL:** Full-text search with ts_vector, stores scraped data
- **Pinecone:** Vector database for similarity search
- **Embedding Model:** text-embedding-004 or similar
- **Semantic Analysis:** Emotion detection + query weighting

---

*This document provides a comprehensive overview of the MCP architecture with detailed flow explanations and implementation examples.*