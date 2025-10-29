## Task Division — PayPal Customer Support Agent (ASHOK & ANU)

### Tier 1 — Basic RAG Chat (Days 1–3)

| Module | Assigned To | Why / Notes |
|---|---|---|
| Web Scraping (Help, Fees, Buyer/Seller Protection, User Agreement) | ANU | Deterministic data wrangling; extend existing scraper scripts |
| Chunking & Policy-Preserving Parsing | ASHOK | Preserve paragraphs/sections for policy integrity |
| Embeddings + Metadata Tagging | ASHOK | Core AI pipeline; add `{topic, user_type, source}` |
| Vector DB Setup + Data Insert (Pinecone) | ANU | Ops/data flow; push embeddings, manage namespaces |
| Query + Retrieval Pipeline (Backend RAG) | ASHOK | Orchestrate retrieval + Gemini prompting |
| Terminal Q&A | ANU | CLI harness for testing; sentiment surfacing |
| Sentiment Detection (basic) | ASHOK | Gemini-based with profanity fallback |

### Tier 2 — Production RAG + Context (Days 4–7)

| Module | Assigned To | Why / Notes |
|---|---|---|
| Multi-source (add Developer Docs) | ANU | Expand scraper to `developer.paypal.com/docs` |
| Hybrid Search (semantic + keyword/policy boost) | ASHOK | BM25/keywords + source weighting (legal > help > fees) |
| Conversation Memory + Issue-Type Tracking | ASHOK | Track `payment_issue/dispute/account_limitation/fees/refund` |
| Structured Response (Issue → Policy → Steps → Timeline) | ASHOK | Templated outputs for consistency/compliance |
| Confidence Disclaimers + Escalation Rules | ASHOK | Guardrails for account-specific/legal questions |
| MongoDB Conversation Storage | ANU | Persist anonymized chats, sentiment, issue type, sources |
| React UI Enhancements (empathy + sources) | ANU | Show sentiment cues and cited sources |

### Tier 3 — MCP + Advanced Features (Days 8–11)

| Module | Assigned To | Why / Notes |
|---|---|---|
| MCP Server + Tools (web search, status, FX, fee calc) | ANU | External APIs/tools via MCP SDK |
| Query Classification + Escalation Logic | ASHOK | Deterministic + model-based routing |
| Dispute Resolution Wizard (multi-turn) | ASHOK | Dialog state machine, slot-filling |
| Confidence Scoring + Mandatory Escalation Gates | ASHOK | Safety and compliance thresholds |
| Analytics (types, resolution rate, satisfaction) | ANU | Aggregate metrics from MongoDB |
| Feedback Loop (policy gaps) | ANU | Identify missing docs; expand corpus |

### Tier 4 — Enterprise Grade (Days 12–14)

| Module | Assigned To | Why / Notes |
|---|---|---|
| PayPal API Integration (sandbox: transactions, disputes) | ASHOK | Secure backend integrations |
| Multi-tenant Support (business accounts) | ANU | Tenant context, keys, data partitioning |
| Automated Dispute Form Pre-fill + Handoff | ASHOK | Compose from memory/wizard; prepare payloads |
| Escalation Workflow (ticketing system) | ANU | Create tickets with sentiment and context |
| PII Masking + Compliance Guardrails | ASHOK | Logging scrubbing; legal language constraints |
| Admin Dashboard + Webhooks | ANU | Ops UI and alerting for high-priority cases |
| A/B Testing for Tone | ANU | Experiment scaffolding and reporting |


