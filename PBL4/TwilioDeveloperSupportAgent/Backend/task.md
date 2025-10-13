# Task Split

# Tier 1

- Scrape API docs, SMS Quickstart, Error Codes, and Webhooks Guide
- Custom chunking preserving complete code examples (don't split mid-function)
- Metadata tags: `{api: sms/voice/video, language: nodejs/python/php, error_code: 21XXX}`
- Qdrant vector DB optimized for code similarity search
- Terminal Q&A: "How do I send an SMS in Node.js?", "What does error 30001 mean?"
- Code syntax highlighting in terminal output

| Module                           | Assigned To | Why                                                                                 |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| 🕸️ Web Scraping                  | **Manoj**   | Mostly data wrangling — good warm-up; uses `axios + cheerio`                        |
| ✂️ Chunking Logic                | **Swikar**  | Needs logical thinking to preserve code blocks, perfect for your full-stack mindset |
| 🧠 Embeddings + Metadata Tagging | **Swikar**  | Core AI logic; you’ll handle OpenAI API + tagging                                   |
| 🧱 Qdrant Setup + Data Insert    | **Manoj**   | Once you give them embeddings, they push it into DB — uses REST API or `qdrant-js`  |
| 🔍 Query + Search Pipeline       | **Swikar**  | Connects everything together — this is the RAG brain                                |
| 💬 Terminal Chat UI              | **Manoj**   | Fun, user-facing part — using `readline-sync` and `cli-highlight`                   |
| 🌈 Syntax Highlighting & Testing | **Both**    | Final polish — test queries, color output, fix any formatting bugs                  |

# Tier 2

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source: API docs for all products + SDK references + error catalog
- Hybrid search: Semantic + exact error code matching
- Code-aware chunking: Extract and index code separately from explanations
- React UI with Monaco Editor for code display and editing
- Conversation memory tracking: programming language preference, API being used
- Response format: Explanation → Code example → Common pitfalls
- Language-specific responses: Detect user's language from question context
- Re-ranking prioritizing most recent API version docs

| Module                                  | Assigned To | Why / Notes                                                                                                                                                                                    |
| --------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🌐 **Scraper – All Twilio APIs + SDKs** | **Manoj**   | Expand Tier 1 scraper to include Voice, WhatsApp, Video, Node.js SDK docs, latest API versions. Make sure to grab code snippets separately.                                                    |
| ✂️ **Chunking Logic – Code-aware**      | **Swikar**  | Split docs into chunks as before, but **store code snippets separately** from text explanations. Add metadata: language, API, version, type (code/text).                                       |
| 🧠 **Embeddings + Metadata Tagging**    | **Swikar**  | Generate embeddings for new chunks (code and text). Ensure language/type metadata is attached for hybrid search.                                                                               |
| 🔍 **Query + Search Pipeline (Hybrid)** | **Manoj**   | Update `searchDocs` to: <br>• detect error codes and boost exact matches<br>• prioritize user language<br>• handle code vs text retrieval separately<br>• re-rank based on version, similarity |
| 💬 **React UI + Chat**                  | **Swikar**  | Build frontend using React. Use **Monaco Editor** for code snippets. Display explanation → code → pitfalls → sources.                                                                          |
| 🗂️ **Conversation Memory**              | **Swikar**  | Track session-level state: language, API being used, past queries. Feed context to `generateAnswer` for coherent multi-turn conversation.                                                      |
| 🎨 **Formatting + Syntax Highlighting** | **Both**    | Ensure code blocks in terminal or web UI are syntax-highlighted. Color explanations, source links.                                                                                             |
| 🧪 **Testing & Validation**             | **Both**    | Test hybrid search, code retrieval, error code queries, multi-turn chat. Compare CLI vs web UI outputs.                                                                                        |

# Tier 3: MCP + Advanced Features

- **MCP Tools:**
  - Web search for recent Twilio updates or known issues
  - Code validator: Check API endpoint URLs, required parameters
  - Twilio Status API: Check for service disruptions
  - Webhook tester: Validate webhook signatures and payload formats
  - Rate limit calculator: Estimate if user's volume exceeds limits
  - Code executor (sandboxed): Test simple Twilio API calls in test mode
- Query classification: `getting_started`, `debugging`, `error_resolution`, `best_practices`, `billing`
- Programming language detection from code snippets in questions
- Multi-turn debugging: Ask for error logs, guide through diagnostic steps
- Confidence-based code suggestions: Show multiple approaches if uncertain
- Error pattern recognition: "This error often occurs when..." with frequency data
- Analytics: Most common errors by API, language-specific pain points
- Feedback loop improving code example relevance

| Tool / Feature                        | Owner          | Description / Responsibilities                                                                                                      | Dependencies / Notes                                            |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **MCP Core / Hub**                    | Swikar         | Build the main MCP orchestrator. Manage tool registration, central logging, and interface for tools to plug in.                     | Both’s tools plug into this. Must agree on input/output format. |
| **Web Search Tool**                   | Swikar + Manoj | Search recent Twilio updates/issues. Swikar handles query formation + API, Manoj handles result formatting + analytics integration. | Needs shared MCP core API.                                      |
| **Code Validator**                    | Swikar         | Validate Twilio API endpoint URLs, required parameters, request format. Produce structured results for MCP.                         | MCP core for tool registration.                                 |
| **Twilio Status API**                 | Manoj          | Fetch live Twilio service status and map it to tool-friendly format. Trigger alerts if service is down.                             | MCP core, optional dashboard integration.                       |
| **Webhook Tester**                    | Manoj          | Validate webhook payloads and signatures. Provide feedback if invalid.                                                              | MCP core; Twilio credentials for testing.                       |
| **Rate Limit Calculator**             | Swikar         | Compute estimated usage vs Twilio limits. Warn if exceeding thresholds.                                                             | Needs configuration for Twilio limits.                          |
| **Code Executor (Sandboxed)**         | Manoj          | Safely run simple Twilio API calls in test mode. Return result logs without risking production data.                                | Sandbox setup, Twilio test credentials.                         |
| **Query Classification**              | Swikar         | Tag incoming queries into: getting_started, debugging, error_resolution, best_practices, billing.                                   | Preprocessing utils; may use ML or rules.                       |
| **Multi-turn Debugging Flow**         | Swikar + Manoj | Guide users through errors step-by-step. Swikar handles flow logic, Manoj handles integration with error patterns and tool results. | Depends on query classification and error pattern recognition.  |
| **Confidence-based Code Suggestions** | Swikar         | Detect low-confidence generated code, offer multiple alternatives with reasoning.                                                   | Requires code validation results.                               |
| **Error Pattern Recognition**         | Manoj          | Map common Twilio errors to causes and solutions. Include frequency statistics.                                                     | Requires Twilio docs / logs; integrate with debugging flow.     |
| **Analytics / Reporting**             | Manoj          | Collect data from tools (errors, API usage, common languages). Display dashboards or logs.                                          | Depends on all other tool outputs.                              |
| **Feedback Loop System**              | Swikar + Manoj | Record user ratings and update tool relevance. Swikar handles storing logic, Manoj handles dashboard/visualization.                 | Shared database / storage.                                      |
