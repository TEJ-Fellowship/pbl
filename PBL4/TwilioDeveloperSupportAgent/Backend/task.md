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
