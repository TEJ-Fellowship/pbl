# 💳 Stripe Customer Support Agent – Task Division

## **Tier 1: Basic RAG Chat** ⏱️ _Days 1–3_

| Module                                      | Assigned To | Why                                                                                         |
| ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| 🕸️ **Web Scraping (API, Webhooks, Errors)** | **Sankar**  | Strong in API/data extraction — good for Playwright + Cheerio setup.                        |
| 🧹 **HTML Cleaning & Preprocessing**        | **Sankar**  | Works alongside scraping — ensures clean text and consistent structure.                     |
| ✂️ **Chunking Logic (LangChain Splitter)**  | **Sanjeev** | Requires understanding of token logic and chunk boundaries — perfect for AI pipeline setup. |
| 🧠 **Embeddings + Pinecone Integration**    | **Sanjeev** | Core AI logic; familiar with OpenAI embedding APIs and vector storage.                      |
| 🔍 **Retriever (Cosine Search)**            | **Sanjeev** | Natural continuation from embeddings — builds initial retrieval flow.                       |
| 💬 **Terminal Chat (Q&A Interface)**        | **Sankar**  | Great starting user interaction module using `inquirer` or `readline`.                      |
| 🌈 **Testing & Syntax Highlighting**        | **Both**    | Jointly verify formatting, highlighting, and query-response correctness.                    |

---

## **Tier 2: Production RAG + Context Management** ⏱️ _Days 4–7_

| Module                                           | Assigned To | Why                                                                       |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| 🌐 **Multi-Source Scraper (All 9 Stripe Docs)**  | **Sankar**  | Builds on Tier 1 scraper; adds more sources and code snippet extraction.  |
| ✂️ **Advanced Chunking – Code-aware**            | **Sanjeev** | Needs logic to separate code and text — fits AI/data structure mindset.   |
| 🧠 **Embedding + Metadata Enrichment**           | **Sanjeev** | Handles metadata tagging and embeddings for code/text chunks.             |
| 🔍 **Hybrid Search (Semantic + BM25)**           | **Sankar**  | Good mix of retrieval algorithms and backend logic.                       |
| 💬 **React Chat UI + Express API**               | **Sanjeev** | Connects frontend to backend; skilled in React + API integration.         |
| 🗂️ **Conversation Memory (MongoDB + LangChain)** | **Sankar**  | Requires understanding of context retention for multi-turn conversations. |
| 🎨 **UI Formatting + Code Highlighting**         | **Sanjeev** | Frontend polish using `react-syntax-highlighter` and Tailwind CSS.        |
| 🧪 **Integration Testing**                       | **Both**    | End-to-end testing from scraping → embeddings → UI interaction.           |

---

## **Tier 3: MCP + Advanced Agent Features** ⏱️ _Days 8–11_

| Module                                                       | Assigned To | Why                                                                    |
| ------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| 🧰 **MCP Tool Integration (Web Search, Status, Calculator)** | **Sanjeev** | Involves reasoning and orchestration — ideal for AI logic work.        |
| 💬 **Multi-turn Conversation Engine + Compression**          | **Sanjeev** | Works with conversation memory, token windows, and summarization.      |
| 🧾 **Query Classification (API/Billing/Disputes)**           | **Sanjeev** | Uses prompt engineering and classification logic — fits LLM expertise. |
| 📊 **Analytics + Feedback Loop (MongoDB + PostgreSQL)**      | **Sankar**  | Backend-focused; involves data modeling and feedback aggregation.      |
| 📈 **Confidence Scoring & Logging**                          | **Sankar**  | Handles retrieval scoring, metrics, and performance logging.           |
| 🧪 **Validation + Evaluation Metrics (RAGAS-like)**          | **Both**    | Collaborate on retrieval testing and result evaluation.                |

---

## **Tier 4: Enterprise-Grade Production System** ⏱️ _Days 12–14_

| Module                                              | Assigned To | Why                                                                      |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| 🧱 **Multi-Tenancy + Namespaced Vector Indexing**   | **Sankar**  | Focused on backend data architecture and tenant schema design.           |
| 🧑‍💻 **Admin Dashboard (React + Recharts)**           | **Sanjeev** | Advanced frontend work with visualization and user interactivity.        |
| 🧪 **A/B Testing Framework + Statistical Analysis** | **Sankar**  | Good fit for quantitative comparison and backend control logic.          |
| 🧍‍♂️ **Human Handoff + Escalation Logic**             | **Sanjeev** | Requires understanding of LLM reasoning and conversation flow.           |
| 🔐 **Guardrails (PII + Toxicity + Rate Limit)**     | **Sankar**  | Involves backend validation and content safety — strong data-side logic. |
| 🔗 **Slack + Discord Bot Integration**              | **Sanjeev** | Fits event-driven and communication API experience.                      |
| 🧪 **CI/CD + Evaluation Suite**                     | **Both**    | Ensure deployment, testing, and production quality collaboratively.      |

---

## **Summary by Developer**

### 🧑‍💻 **Sanjeev – AI & Frontend Focus**

- Chunking, Embedding, Retrieval Logic
- LLM Query Handling, Context Memory
- React Chat + Admin Dashboard
- MCP Tools, Query Classification
- Multi-turn Conversations, Summarization
- Slack/Discord Bot Integrations & UI Visualization

### ⚙️ **Sankar – Backend & Data Focus**

- Web Scraping + HTML Preprocessing
- Pinecone + MongoDB + PostgreSQL Setup
- Hybrid Search + Confidence Scoring
- Analytics & Feedback Loop
- Guardrails + Security + Rate Limiting
- A/B Testing + CI/CD Integration

---

## 📅 **Timeline Overview**

| Phase      | Duration   | Key Deliverables                                  |
| ---------- | ---------- | ------------------------------------------------- |
| **Tier 1** | Days 1–3   | Scraper, embeddings, terminal chat                |
| **Tier 2** | Days 4–7   | Multi-source ingestion, hybrid search, React UI   |
| **Tier 3** | Days 8–11  | MCP tools, confidence scoring, analytics          |
| **Tier 4** | Days 12–14 | Admin dashboard, multi-tenancy, guardrails, CI/CD |
