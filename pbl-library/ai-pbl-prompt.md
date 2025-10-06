# 🤖 Customer Support Agent Builder - Project Requirements Generator

## Prompt

You are a world-class AI engineering mentor and product manager specializing in conversational AI systems.  
Your task is to generate a **catalog of 5–10 customer support agent projects** that:

- Build **real, functional customer service chatbots** backed by authentic company knowledge bases.
- Use **actual company data** (scraped FAQs, help centers, documentation) – no synthetic data.
- Progress through **four distinct tiers** of technical sophistication (Tier 1 → Tier 4).
- Incorporate **modern AI tooling**: RAG, vector databases, LangChain, and Model Context Protocol (MCP).
- Are explained simply enough for AI beginners (Tier 1) but ambitious enough for advanced builders (Tiers 3–4).
- Include a **"Real-World Inspiration"** note: which actual company's support system this project models after.

**Core Stack:**

- **LLM Framework:** LangChain or LlamaIndex
- **Vector Database:** Pinecone, Weaviate, Chroma, or Qdrant
- **MCP Integration:** Model Context Protocol for tool use and external data access
- **Conversation Management:** Conversation history with context windowing
- **RAG Pipeline:** Retrieval-Augmented Generation for knowledge grounding

**Stack/technology to use:**

- for the customer interface, use JavaScript based stack such as React, Node Express, Mongo and / or Postgres

**Data Source Categories:**

- **Tech Companies:** Google products, Stripe, Twilio, GitHub, Notion, Slack
- **E-commerce:** Shopify, Amazon seller help, Etsy
- **Finance:** PayPal, Wise, Revolut
- **SaaS Tools:** Airtable, Zapier, Mailchimp
- **Regional (Optional):** Nepali companies with English support docs (Khalti, eSewa, Foodmandu)

---

### Tier-to-Technical Complexity Mapping:

- **Tier 1 (Basic RAG Chat):** Simple FAQ scraping, basic vector storage, straightforward Q&A retrieval, simple chat interface.
- **Tier 2 (Production RAG + Context):** Multi-source ingestion, conversation history management, hybrid search (semantic + keyword), response quality improvements.
- **Tier 3 (MCP + Advanced Features):** MCP tool integration, multi-turn conversations, source attribution, confidence scoring, escalation logic.
- **Tier 4 (Enterprise-Grade):** Multi-tenancy, analytics dashboard, A/B testing, human-in-the-loop, integrations with ticketing systems, guardrails.

---

## Output Format Per Project

### [Emoji + Company/Product Name] Customer Support Agent – _One-line Description_

**Overview**

- 1–2 paragraphs explaining:
  - What company/product this agent supports
  - What kind of questions it answers (e.g., billing, technical setup, API usage)
  - Why this is a valuable learning project (complexity of domain, quality of docs, interesting use cases)

**Real-World Inspiration**  
Mention which actual company's support system inspired this (e.g., "Modeled after Stripe's AI-powered documentation search" or "Inspired by Intercom's Resolution Bot"). Include links to the company's help center, API docs, or public support pages that will be scraped.

**Data Sources**  
List specific URLs to scrape:

- FAQ pages
- Help center articles
- API documentation
- Community forums (if applicable)
- Product guides

**Tier 1: Basic RAG Chat**

Core functionality:

- **Data Ingestion:** Scrape and clean HTML from listed sources (BeautifulSoup/Playwright)
- **Chunking Strategy:** Split documents into semantic chunks (500-1000 tokens)
- **Vector Storage:** Embed chunks using OpenAI/Cohere embeddings, store in chosen vector DB
- **Simple Retrieval:** Basic similarity search (top-k=3-5)
- **Chat Interface:** Terminal-based or simple Streamlit/Gradio UI
- **Response Generation:** LLM generates answer from retrieved context
- **No conversation history** – each query is independent

**Tier 2: Production RAG + Context Management**

Enhanced features:

- **Multi-Source Ingestion:** Scrape multiple documentation types (FAQs + guides + API docs)
- **Metadata Enrichment:** Tag chunks with source URL, section, last updated date
- **Hybrid Search:** Combine semantic search with BM25 keyword matching
- **Conversation History:** Maintain last 5-10 turns of context
- **Context Windowing:** Smart truncation to fit LLM context limits
- **Re-ranking:** Use cross-encoders to re-rank retrieved chunks
- **Response Improvements:**
  - Cite sources with URLs
  - Handle "I don't know" gracefully when confidence is low
  - Format code blocks, lists, and links properly
- **Web UI:** Full-featured chat interface (Streamlit/Gradio/Next.js)

**Tier 3: MCP + Advanced Agent Features**

Agentic capabilities:

- **MCP Tool Integration:**
  - Web search fallback (when knowledge base is insufficient)
  - Calculator for pricing/billing questions
  - Current date/time for time-sensitive queries
  - API status checker (if company has status page)
- **Multi-Turn Conversations:**
  - Follow-up question handling
  - Clarification requests
  - Context preservation across session
- **Source Attribution:** Show which docs were used for each answer
- **Confidence Scoring:** Display certainty level, escalate low-confidence queries
- **Query Classification:** Route questions to appropriate knowledge sub-sections
- **Feedback Loop:** Thumbs up/down to improve retrieval
- **Conversation Analytics:** Track common questions, failure cases

**Tier 4: Enterprise-Grade Production System**

Moonshot features:

- **Multi-Tenancy:** Support multiple company knowledge bases in one system
- **Admin Dashboard:**
  - Upload/manage knowledge sources
  - View conversation analytics
  - Monitor performance metrics (answer rate, avg confidence, user satisfaction)
- **A/B Testing:** Test different prompts, retrieval strategies, chunking methods
- **Human Handoff:** Seamless escalation to human support with full context
- **Integration Hub:**
  - Slack/Discord bot deployment
  - Zendesk/Freshdesk ticket creation
  - Webhooks for notifications
- **Advanced RAG:**
  - Query expansion and rewriting
  - Hypothetical document embeddings (HyDE)
  - Parent-child chunk relationships
- **Guardrails:**
  - PII detection and masking
  - Toxicity filtering
  - Prompt injection protection
- **Evaluation Suite:**
  - Automated testing with golden Q&A pairs
  - RAGAS metrics (faithfulness, answer relevance, context precision)
  - Regression testing on knowledge base updates

---

## Important Guidelines

- **Real Data Only:** Every project MUST specify actual URLs to scrape. No made-up FAQs.
- **Tier 1 Achievability:** Should be completable in 1-2 weeks by someone new to RAG.
- **Progressive Complexity:** Each tier builds naturally on the previous one.
- **MCP in Tier 3:** Don't introduce MCP tools until the basic RAG pipeline works.
- **Tier 4 Ambition:** Should feel like a real startup product, not just a toy.
- **Scraping Ethics:** Include note about respecting robots.txt and rate limiting.
- **Clear Instructions:** Specify exact libraries (e.g., "use LangChain's RecursiveCharacterTextSplitter").

---

## 🛠️ Technical Feature Packs

Use these when defining **Tier 3** and **Tier 4** capabilities.

### 1. 🔍 Advanced Retrieval

- **Hybrid Search:** BM25 + semantic search fusion
- **Query Rewriting:** Rephrase user questions for better retrieval
- **HyDE (Hypothetical Documents):** Generate hypothetical answer, embed it, search
- **Multi-Query Retrieval:** Generate multiple search queries per question
- **Parent Document Retrieval:** Retrieve small chunks, return larger parent documents
- **Re-ranking:** Cross-encoder models to reorder results

### 2. 🧠 Conversation Intelligence

- **Intent Classification:** Detect question type (billing, technical, account, etc.)
- **Entity Extraction:** Pull out product names, account IDs, dates
- **Clarification Engine:** Ask follow-ups when query is ambiguous
- **Conversation Summarization:** Compress long chat history
- **Topic Tracking:** Maintain what the conversation is about across turns

### 3. 🛡️ Safety & Quality

- **Confidence Thresholds:** Only answer when certainty > X%
- **Source Citation:** Always link back to original docs
- **Hallucination Detection:** Verify answer is grounded in retrieved context
- **PII Masking:** Detect and redact sensitive information
- **Toxicity Filters:** Block inappropriate queries/responses
- **Prompt Injection Defense:** Sanitize user inputs

### 4. 📊 Analytics & Monitoring

- **Query Analytics:** Most asked questions, failure rate, avg response time
- **Knowledge Gap Detection:** Track unanswered questions
- **User Satisfaction:** CSAT scores, thumbs up/down tracking
- **A/B Testing Framework:** Compare prompt templates, retrieval methods
- **Performance Metrics:** Latency, token usage, cost per conversation
- **Error Logging:** Capture and categorize failures

### 5. 🔗 Integration & Deployment

- **MCP Tools:**
  - Web search (Brave/Google)
  - Calculator (for pricing questions)
  - Weather API (for shipping/delivery)
  - Status page checker
  - Knowledge base search across multiple sources
- **Chat Platforms:** Slack, Discord, WhatsApp, Telegram bots
- **Ticketing Systems:** Zendesk, Freshdesk, Intercom integration
- **API Endpoints:** REST API for embedding in apps
- **Webhook Support:** Real-time notifications

### 6. 🚀 Advanced Agent Features

- **Multi-Step Reasoning:** Chain-of-thought for complex queries
- **Tool Orchestration:** Decide when to use which MCP tool
- **Proactive Suggestions:** "You might also want to know..."
- **Contextual Help:** Surface related articles automatically
- **Guided Troubleshooting:** Step-by-step diagnostic flows

---

## 📋 Example Invocation

> "Generate 7 customer support agent projects using **LangChain + Pinecone + MCP**, covering a mix of **SaaS tools, e-commerce, and fintech** companies. Each project should specify exact FAQ/help center URLs to scrape and include a 'Real-World Inspiration' linking to the actual company's support system."

---

## 🎯 Sample Project Variations

When generating the catalog, vary projects across:

1. **Domain Complexity:**

   - Simple (FAQ-heavy): E-commerce shipping policies
   - Medium (mixed): SaaS product features
   - Complex (technical): API documentation support

2. **Documentation Type:**

   - Structured FAQs (easy to scrape)
   - Knowledge base articles (medium)
   - API docs + community forums (hard)

3. **Company Size:**

   - Startup (smaller, focused docs)
   - Mid-size (moderate documentation)
   - Enterprise (extensive, multi-product docs)

4. **Geographic Focus:**
   - Global (English): Stripe, Notion, GitHub
   - Regional (Nepali with English): Khalti, eSewa
   - Both: Mix for diversity

---

## ✅ Quality Checklist

Each generated project must include:

- [ ] Specific company/product name
- [ ] 3+ actual URLs to scrape (with wayback links if sites might change)
- [ ] Clear domain/question types the bot handles
- [ ] Tier 1 completable by RAG beginners
- [ ] Tier 2 introduces production concerns (scale, quality, UX)
- [ ] Tier 3 includes ≥2 MCP tools
- [ ] Tier 4 has ≥3 enterprise features
- [ ] Link to inspiration company's actual support system
- [ ] Note on scraping ethics/robots.txt

---

**Remember:** The goal is to build **real, useful agents** that could actually help customers, not just toy demos. Every project should feel like it could evolve into a real product.
