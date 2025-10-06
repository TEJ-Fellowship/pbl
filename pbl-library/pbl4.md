# 🤖 Customer Support Agent Catalog - 6 Production-Ready Projects

_Building real AI support agents with actual company knowledge bases - JavaScript Edition_

---

## 🎮 Discord Community Support Agent – Server Management & Bot Help

**Overview**

Build an intelligent support agent for Discord server administrators and moderators managing community servers, configuring bots, setting up roles and permissions, handling moderation tools, and troubleshooting common issues. Discord hosts 150M+ monthly active users across millions of servers, making community management support critical. This agent handles both non-technical questions (how to create channels, invite members) and technical ones (webhook setup, bot development, API integration). The complexity comes from Discord's extensive permission system, bot ecosystem, and the need to guide users through multi-step server setup processes.

**Real-World Inspiration**  
Modeled after [Discord's Support Center](https://support.discord.com/) and their in-app help system. Discord uses AI-powered search across help articles and has community-driven support through their official server.

**Data Sources**

- Discord Support Center: https://support.discord.com/
- Server Setup Guide: https://support.discord.com/hc/en-us/articles/360045138571
- Roles & Permissions: https://support.discord.com/hc/en-us/articles/206029707
- Moderation Tools: https://support.discord.com/hc/en-us/sections/360008589993-Moderation
- Bot Integration: https://support.discord.com/hc/en-us/articles/228383668
- Discord Developer Docs: https://discord.com/developers/docs/
- Webhooks Guide: https://discord.com/developers/docs/resources/webhook
- Bot API Reference: https://discord.com/developers/docs/topics/oauth2
- Community Guidelines: https://discord.com/guidelines
- Safety & Privacy: https://support.discord.com/hc/en-us/sections/360000045712

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape 3 core sections (Server Setup, Roles & Permissions, Moderation) with Cheerio
- Chunk docs into 700 tokens with RecursiveCharacterTextSplitter, preserve step-by-step guides
- Embed with OpenAI text-embedding-3-small, store in Chroma (local)
- Terminal-based Q&A with colored output (chalk)
- Single-turn conversations, preserve Discord emoji indicators (⚙️, 🔒, ➕)

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Scrape all 10 sources with content-type detection (support articles, API docs, policies)
- Hybrid search: Semantic (Chroma) + BM25 keyword (FlexSearch) with 0.65/0.35 weighting
- Re-rank with cross-encoder (Transformers.js)
- React UI styled like Discord (dark theme, similar colors) + Express API
- Conversation memory tracking server context (size, purpose: gaming/study/community)
- MongoDB for conversation storage, Discord-style markdown formatting
- Source citations with expandable accordions, code blocks with syntax highlighting

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

- **MCP Tools:** Brave web search, permission calculator (bitfield math), Discord status checker, bot token validator, webhook tester, role hierarchy checker
- Multi-turn context compression, query classification (setup/moderation/bots/API)
- Confidence scoring with auto-escalation (<0.5): "Check Discord's official support server"
- PostgreSQL analytics: top questions by category, time-based patterns, escalation rate
- Feedback loop with thumbs up/down, weekly retraining of retrieval weights
- Special handling for permission queries (many similar docs need precise ranking)

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Multi-tenant for different server types (gaming/education/business communities)
- Admin dashboard: knowledge management, real-time analytics (Socket.io), performance metrics
- A/B testing framework: tone (formal vs. friendly), response length, model variants
- **Discord Bot deployment** (discord.js): slash commands `/help [question]`, DM support, server-specific customization
- Advanced RAG: HyDE, query expansion, parent-child chunks, query rewriting
- **Guardrails:** Bot token detection and auto-redaction (⚠️ critical security feature), toxicity filtering, PII masking, rate limiting (Redis)
- Zapier webhooks for monitoring, Zendesk integration for escalation
- CI/CD with automated evaluation suite (250 golden Q&A pairs, RAGAS metrics)
- **Unique security focus:** 100% bot token detection rate to prevent credential leaks

**Tech Stack:** React, Express, MongoDB, PostgreSQL, Chroma, OpenAI, MCP SDK, discord.js, Transformers.js, Socket.io

---

## Project 2: 📦 Shopify Merchant Support Agent – Store Setup & Troubleshooting

**Overview**

Create a support agent for Shopify merchants navigating store setup, theme customization, app integrations, payment gateway configuration, and shipping policies. Shopify serves 2M+ merchants worldwide, making merchant support a critical area. This agent handles both non-technical questions (pricing plans, policy setup) and technical ones (Liquid templating, API usage). The complexity comes from Shopify's vast ecosystem of themes, apps, and integrations, requiring the agent to navigate product-specific documentation across multiple domains.

**Real-World Inspiration**  
Inspired by [Shopify Help Center's](https://help.shopify.com/) AI assistant "Shopify Magic" and their community forums. Shopify uses AI to deflect common support tickets and guide merchants through setup wizards.

**Data Sources**

- Shopify Help Center: https://help.shopify.com/
- Shopify Manual: https://help.shopify.com/manual
- Theme Development: https://shopify.dev/docs/themes
- App Development: https://shopify.dev/docs/apps
- API Documentation: https://shopify.dev/docs/api
- Shipping Guide: https://help.shopify.com/manual/shipping
- Payment Setup: https://help.shopify.com/manual/payments
- Community Forums: https://community.shopify.com/ (top threads only)

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape Help Center + Shopify Manual (focus on Getting Started, Products, Orders)
- Chunk into 700 tokens, metadata tags: `{section, merchant_level: beginner/advanced}`
- Embed and store in Chroma (local vector DB for easier setup)
- Terminal interface handling common questions: "How do I add products?", "What are Shopify fees?"
- Simple retrieval without conversation history

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source ingestion: Help docs + API docs + theme docs + forums
- Hybrid search optimized for product names and feature keywords
- React storefront-style UI with Shopify Polaris design system
- Conversation memory tracking merchant's store type (fashion/electronics/etc)
- Context-aware responses: "Since you're setting up a clothing store, you'll want..."
- Rich formatting: embedded videos, step-by-step guides, screenshots citations

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

- **MCP Tools:**
  - Web search for recent app reviews/comparisons
  - Calculator for pricing comparisons (Shopify vs competitors)
  - Shopify Status API checker
  - Theme compatibility checker (validate if app works with merchant's theme)
  - Currency converter for international merchants
- Intent classification: `setup`, `troubleshooting`, `optimization`, `billing`
- Smart routing: Technical queries → API docs, Business queries → Help Center
- Proactive suggestions: "You might also want to set up abandoned cart recovery"
- Session-based memory: Remember merchant's plan tier (Basic/Shopify/Advanced)
- Analytics dashboard tracking most-asked questions by merchant segment

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Multi-language support for international merchants (EN, ES, FR, DE)
- Integration with Shopify Admin API (read-only): fetch merchant's actual store data
- Personalized responses: "I see you're on the Basic plan, here's how to..."
- App recommendation engine based on store category and traffic
- A/B test different onboarding flows for new merchants
- Zendesk integration for complex issues requiring human support
- Admin panel showing knowledge gaps by merchant segment
- Automated evaluation using Shopify's actual support ticket data (if available)
- WhatsApp bot for mobile-first merchants in emerging markets

**Tech Stack:** React (Polaris), Express, MongoDB, Chroma/Pinecone, OpenAI, MCP SDK, i18next (multi-language)

---

## Project 3: 🏦 PayPal Customer Support Agent – Payments, Disputes & Account Management

**Overview**

Build a support agent for PayPal users dealing with payment issues, transaction disputes, account limitations, refund requests, and international transfers. PayPal processes billions in transactions and handles complex scenarios like chargebacks, currency conversions, and buyer/seller protection. This agent must handle emotionally-charged situations (frozen accounts, disputed charges) with empathy while providing accurate policy information. The challenge is balancing self-service automation with appropriate escalation to human agents for sensitive financial matters.

**Real-World Inspiration**  
Modeled after [PayPal's Resolution Center](https://www.paypal.com/disputes/) and their chatbot that handles initial triage before escalating to specialists. PayPal uses AI to classify dispute types and suggest resolution paths.

**Data Sources**

- PayPal Help Center: https://www.paypal.com/us/cshelp/
- User Agreement & Policies: https://www.paypal.com/us/webapps/mpp/ua/useragreement-full
- Seller Protection: https://www.paypal.com/us/webapps/mpp/security/seller-protection
- Buyer Protection: https://www.paypal.com/us/webapps/mpp/paypal-safety-and-security
- Fee Structure: https://www.paypal.com/us/webapps/mpp/paypal-fees
- Dispute Resolution: https://www.paypal.com/disputes/
- Developer Docs (for business users): https://developer.paypal.com/docs/

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape Help Center FAQs, fee structure, and dispute resolution guides
- Chunk with special handling for policy text (preserve full paragraphs)
- Weaviate vector DB with metadata: `{topic: payments/disputes/account, user_type: personal/business}`
- Terminal Q&A for common queries: "How do I request a refund?", "Why was my payment held?"
- Simple sentiment detection to flag frustrated users

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source: Help docs + legal policies + developer docs
- Hybrid search weighted toward exact policy matches (important for compliance)
- React UI with empathetic tone adaptation based on query sentiment
- Conversation memory tracking issue type (payment hold, chargeback, etc.)
- Structured response format: Issue → Policy → Steps → Expected timeline
- Confidence-based disclaimers: "This is general guidance. For account-specific issues, contact support"
- MongoDB storing anonymized conversation data for pattern analysis

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

- **MCP Tools:**
  - Web search for recent PayPal policy changes or outages
  - Calculator for fee calculations (domestic/international/currency conversion)
  - PayPal Status API checker
  - Currency exchange rate API (for international payment questions)
  - Transaction timeline simulator (estimate hold periods based on history)
- Query classification: `payment_issue`, `dispute`, `account_limitation`, `fees`, `refund`
- Sentiment analysis with `sentiment` library → escalate if frustration detected
- Multi-turn dispute resolution wizard: gather details step-by-step
- Confidence scoring with mandatory escalation for account-specific or legal questions
- Analytics: dispute types, resolution rate without escalation, avg satisfaction
- Feedback loop identifying policy gaps in documentation

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Multi-tenant for PayPal business users managing multiple merchant accounts
- Integration with PayPal API (sandbox): verify transaction statuses, pull dispute details
- Personalized guidance: "Your transaction from Jan 15 for $234.50 is currently..."
- Automated dispute form pre-filling based on conversation context
- Escalation workflow: Create case in ticketing system with full context + sentiment score
- Human handoff with warm transfer: "Connecting you to a specialist. Here's what we've discussed..."
- A/B testing empathetic vs. formal tone for different query types
- Compliance guardrails: never provide legal advice, always cite official policies
- PII masking for email addresses, phone numbers in logs
- Admin dashboard: escalation rate by issue type, policy documentation gaps
- Webhook notifications to PayPal support when high-priority escalation occurs
- Automated evaluation using historical support ticket data (accuracy on known resolutions)

**Tech Stack:** React, Express, MongoDB, Weaviate, OpenAI, MCP SDK, PayPal API SDK, sentiment analysis

---

## Project 4: 📧 Mailchimp Support Agent – Email Marketing & Automation Help

**Overview**

Develop a support agent for Mailchimp users creating email campaigns, building automation workflows, managing subscriber lists, and interpreting analytics. Mailchimp serves small businesses and marketers who often lack technical expertise, requiring clear, jargon-free explanations. The agent handles everything from "How do I create my first campaign?" to "Why is my open rate low?" This project is excellent for learning how to explain complex marketing concepts simply while providing actionable, data-driven advice.

**Real-World Inspiration**  
Inspired by [Mailchimp's Help Center](https://mailchimp.com/help/) and their in-app contextual help. Mailchimp uses AI to suggest content blocks, subject lines, and send-time optimization.

**Data Sources**

- Mailchimp Help & Support: https://mailchimp.com/help/
- Getting Started Guides: https://mailchimp.com/help/getting-started-with-mailchimp/
- Campaign Creation: https://mailchimp.com/help/create-a-campaign/
- Automation Guides: https://mailchimp.com/help/about-automation/
- List Management: https://mailchimp.com/help/getting-started-audience/
- Analytics & Reports: https://mailchimp.com/help/about-reports/
- API Documentation: https://mailchimp.com/developer/
- Marketing Resources: https://mailchimp.com/resources/ (best practices)

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape Getting Started, Campaign Creation, and List Management guides
- Chunk into 600 tokens optimized for step-by-step instructions
- Pinecone with metadata: `{category: campaigns/automation/lists, difficulty: beginner/advanced}`
- Terminal interface for FAQs: "How do I import contacts?", "What's a good open rate?"
- Preserve numbered lists and screenshots in context

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source: Help docs + best practice articles + API docs + marketing resources
- Hybrid search with boost for recent articles (email marketing trends change fast)
- React UI styled like Mailchimp's interface (familiar to users)
- Conversation memory tracking user's goal (create campaign, fix deliverability, etc.)
- Context-aware tutorials: If user asks about automation, offer related workflow templates
- Rich responses: Embed example campaigns, template previews, metric benchmarks
- Smart follow-ups: "Your open rate is 15%. Here's how to improve it..."

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

- **MCP Tools:**
  - Web search for latest email marketing trends and best practices
  - Email subject line analyzer (calculate character count, spam score)
  - Send time optimizer (suggest best days/times based on industry)
  - Calculator for email list growth projections
  - Template compatibility checker (mobile/desktop rendering)
- Query classification: `campaign_creation`, `deliverability`, `automation`, `analytics`, `api_integration`
- Skill level detection: Adjust explanation depth based on user's questions
- Interactive campaign builder: Guide user through creation step-by-step
- Benchmark comparisons: "Your 22% open rate is above average for retail (18%)"
- Analytics: Most common roadblocks in campaign creation, feature discovery gaps
- Feedback identifying documentation clarity issues

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Multi-tenant for marketing agencies managing multiple client accounts
- Mailchimp API integration (OAuth): Pull actual campaign stats, list sizes, recent sends
- Personalized advice: "Your last campaign to 'Newsletter Subscribers' had 24% opens..."
- Campaign audit feature: Analyze user's campaign setup and suggest improvements
- A/B testing different learning paths (video vs. text tutorials)
- Template recommendation engine based on industry and campaign goals
- Slack integration for marketing team collaboration
- Admin dashboard: Track learning curve (time from signup to first campaign), feature adoption
- Automated content gaps analysis: Which features have no help requests? (might indicate discoverability issues)
- Compliance checks: Remind users about GDPR, CAN-SPAM requirements
- Human escalation for account billing or deliverability issues requiring investigation
- CI/CD with evaluation using customer success team's historical "good answer" examples

**Tech Stack:** React, Express, MongoDB, Pinecone, OpenAI, MCP SDK, Mailchimp API, Chart.js

---

## Project 5: 🌐 Twilio Developer Support Agent – API Integration & Debugging

**Overview**

Create a support agent for developers integrating Twilio's communication APIs (SMS, Voice, Video, WhatsApp). Twilio's developer-first platform requires the agent to understand code snippets, debug webhook issues, explain error codes, and guide API authentication. This is a highly technical support agent that must handle multiple programming languages (Node.js, Python, PHP, Ruby), interpret API logs, and suggest code fixes. The challenge is providing precise technical guidance while being accessible to developers of varying skill levels.

**Real-World Inspiration**  
Modeled after [Twilio's Support Center](https://support.twilio.com/) and their developer docs assistant. Twilio provides code-heavy documentation with language-specific examples and interactive API explorers.

**Data Sources**

- Twilio Help Center: https://support.twilio.com/
- API Documentation: https://www.twilio.com/docs/usage/api
- SMS Quickstarts: https://www.twilio.com/docs/sms/quickstart
- Voice Quickstarts: https://www.twilio.com/docs/voice/quickstart
- WhatsApp API: https://www.twilio.com/docs/whatsapp
- Video API: https://www.twilio.com/docs/video
- Error Codes: https://www.twilio.com/docs/api/errors
- Webhooks Guide: https://www.twilio.com/docs/usage/webhooks
- Node.js SDK: https://www.twilio.com/docs/libraries/node

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape API docs, SMS Quickstart, Error Codes, and Webhooks Guide
- Custom chunking preserving complete code examples (don't split mid-function)
- Metadata tags: `{api: sms/voice/video, language: nodejs/python/php, error_code: 21XXX}`
- Qdrant vector DB optimized for code similarity search
- Terminal Q&A: "How do I send an SMS in Node.js?", "What does error 30001 mean?"
- Code syntax highlighting in terminal output

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source: API docs for all products + SDK references + error catalog
- Hybrid search: Semantic + exact error code matching
- Code-aware chunking: Extract and index code separately from explanations
- React UI with Monaco Editor for code display and editing
- Conversation memory tracking: programming language preference, API being used
- Response format: Explanation → Code example → Common pitfalls
- Language-specific responses: Detect user's language from question context
- Re-ranking prioritizing most recent API version docs

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

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

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Multi-tenant for dev agencies building on Twilio for multiple clients
- Twilio API integration: Pull account usage, recent errors from Twilio logs
- Personalized debugging: "I see you had 15 webhook failures today. Here's why..."
- Code diff analyzer: Compare user's code to working examples, highlight issues
- A/B testing different code explanation styles (comments vs. separate explanation)
- GitHub integration: Read user's repo (with permission), suggest fixes in context
- Slack/Discord bot for developer community channels
- Admin dashboard: API adoption metrics, error resolution rate, documentation gaps
- Advanced RAG: Use code embeddings (StarCoder or CodeBERT) for better code search
- Automated testing with Twilio's actual error logs (if partnership allows)
- Human escalation for account-specific issues (billing, limits) with ticket creation
- CI/CD with code example regression testing (ensure all examples still work)
- Webhook signature validation service with real-time testing
- Cost optimization recommendations based on usage patterns

**Tech Stack:** React, Express, MongoDB, Qdrant, OpenAI Codex, MCP SDK, Twilio API, Monaco Editor

---

## Project 6: 🍔 Foodmandu Support Agent – Food Delivery Help (Nepal)

**Overview**

Build a support agent for Foodmandu, Nepal's leading food delivery platform, handling restaurant browsing issues, order tracking, payment problems, delivery delays, and refund requests. This project is unique as it serves Nepali users with bilingual support (English/Nepali), deals with local payment methods (eSewa, Khalti), and addresses region-specific challenges like address finding in Kathmandu Valley. The agent must handle both customer-side (order issues) and restaurant partner-side queries (menu updates, order management). Excellent for learning localized support and handling operational urgency (hungry customers want fast answers!).

**Real-World Inspiration**  
Inspired by [Foodmandu's Help Center](https://foodmandu.com/Help) and their in-app chat support. Food delivery apps use AI to handle high-volume, time-sensitive queries during peak meal times.

**Data Sources**

- Foodmandu Help Center: https://foodmandu.com/Help
- FAQ Section: https://foodmandu.com/FAQ
- Restaurant Partner Guide: https://foodmandu.com/page/restaurant-partners
- Delivery Areas: https://foodmandu.com/page/coverage
- Payment Methods: https://foodmandu.com/page/payment-options
- Refund Policy: https://foodmandu.com/page/refund-policy
- How to Order: https://foodmandu.com/page/how-to-order
- Contact Information: https://foodmandu.com/Contact

**Tier 1: Basic RAG Chat** ⏱️ _Days 1-3_

- Scrape Help Center, FAQs, How to Order, and Payment Options pages
- Chunk into 500 tokens (shorter for quick answers to urgent queries)
- Chroma local vector DB with metadata: `{topic: ordering/payment/delivery, user_type: customer/restaurant}`
- Terminal interface for common questions: "Where's my order?", "How do I pay with eSewa?"
- Bilingual support detection (respond in language of query)

**Tier 2: Production RAG + Context** ⏱️ _Days 4-7_

- Multi-source: All help docs + coverage maps + refund policies
- Hybrid search optimized for local terms (Kathmandu locations, Nepali payment methods)
- React UI with Nepali language toggle (using i18next)
- Conversation memory tracking order issue type and urgency level
- Location-aware responses: "Delivery in Thamel usually takes 45-60 minutes"
- Empathetic tone for delays: "I understand you're hungry. Let me help track your order..."
- Real-time order status display (if order ID provided)
- Quick action buttons: "Track Order", "Request Refund", "Contact Restaurant"

**Tier 3: MCP + Advanced Features** ⏱️ _Days 8-11_

- **MCP Tools:**
  - Web search for restaurant reviews or menu changes
  - ETA calculator based on time of day and location
  - Weather API (delays during rain in Kathmandu)
  - Payment gateway status checker (eSewa, Khalti APIs)
  - Address validator for Kathmandu Valley locations
- Query classification: `order_tracking`, `payment_issue`, `refund_request`, `restaurant_query`, `delivery_problem`
- Urgency detection: Flag queries about very late orders for priority
- Multi-turn order troubleshooting: Collect order ID, restaurant, issue details
- Smart escalation: Auto-create support ticket for orders >90 minutes late
- Proactive updates: "Your restaurant is preparing your order (15 min estimated)"
- Analytics: Peak support times (lunch/dinner rushes), common delivery areas with issues
- Feedback loop identifying problematic restaurants or delivery zones

**Tier 4: Enterprise-Grade** ⏱️ _Days 12-14_

- Bilingual NLU optimized for Nepali English (common phrases, transliterations)
- Foodmandu API integration: Real-time order tracking, restaurant status, rider location
- Personalized responses: "Hi Ramesh, your order from Momo Hut is on the way..."
- Automatic refund processing for policy-compliant cases (order >2 hours late)
- Restaurant partner portal: "How do I update my menu?", "Pause orders temporarily"
- A/B testing Nepali vs. English default for different user segments
- WhatsApp bot integration (very popular in Nepal)
- SMS notifications for order updates (low smartphone penetration in some areas)
- Admin dashboard: Support volume during meal rushes, delivery zone performance
- Rider app integration: Common rider issues ("Customer not answering phone")
- Escalation workflow: Connect to call center during peak times with wait time estimates
- Compliance: Handle food quality complaints per Nepal Food Standards
- Multi-modal support: Voice input in Nepali for accessibility
- Automated evaluation using customer satisfaction surveys post-delivery
- Cost optimization: Deflect simple queries to chatbot, route complex to humans
- Festival/event mode: Adjusted responses during Dashain, Tihar (high order volumes)

**Tech Stack:** React, Express, MongoDB, Chroma, OpenAI, MCP SDK, i18next (bilingual), Foodmandu API, Twilio (SMS)

**Unique Challenges:**

- Nepali language nuances (Romanized Nepali in queries)
- Local payment ecosystem (eSewa, Khalti, COD)
- Address ambiguity (no standardized postal codes in many areas)
- Cultural context (festival rush times, food preferences)

---

## 🛠️ Shared Technical Foundation

All projects use this core stack:

**Frontend:**

- React 18+ with functional components
- Tailwind CSS for styling
- Vite for build tooling
- Recharts or Chart.js for analytics

**Backend:**

- Node.js with Express
- MongoDB for conversation storage
- PostgreSQL for analytics (Tier 3+)
- Redis for caching (Tier 4)

**AI/ML:**

- LangChain.js for RAG orchestration
- OpenAI API (GPT-4, text-embedding-3-small)
- Transformers.js for local ML (re-ranking, toxicity)
- Vector DBs: Pinecone, Chroma, Weaviate, or Qdrant

**Tools:**

- MCP SDK for tool integration
- Cheerio/Playwright for scraping
- Jest for testing
- Docker for containerization

---

## 📦 Starter Template Repository

Each project includes:

```
project-name/
├── README.md                    # Project-specific setup
├── LEARNING_PATH.md            # Tier-by-tier guide
├── package.json
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── services/
│   │   ├── scraper.js
│   │   ├── ingest.js
│   │   ├── retriever.js
│   │   └── llm.js
│   └── config/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── vite.config.js
├── scripts/
│   ├── scrape.js
│   ├── ingest.js
│   └── evaluate.js
└── tests/
    ├── golden-qa.json
    └── integration.test.js
```

---

## ✅ Quality Checklist

Each project includes:

- ✅ 6+ actual URLs to scrape with working examples
- ✅ Clear domain/question types the bot handles
- ✅ Tier 1 completable in 3 days by beginners
- ✅ Tier 2 production-ready web interface
- ✅ Tier 3 includes 4+ MCP tools
- ✅ Tier 4 has 5+ enterprise features
- ✅ Link to real company's support system
- ✅ Scraping ethics guidelines (robots.txt, rate limits)
- ✅ 2-week timeline with daily milestones
- ✅ Evaluation methodology (golden Q&A sets)

---

## 📚 Additional Resources

**Documentation:**

- LangChain.js: https://js.langchain.com/
- MCP SDK: https://modelcontextprotocol.io/
- Pinecone: https://docs.pinecone.io/
- OpenAI: https://platform.openai.com/docs

**Learning Materials:**

- RAG fundamentals course (included in each project)
- Vector database comparison guide
- MCP tool development tutorial
- Production deployment checklist

---

## 🎓 Learning Outcomes

By completing any of these projects, you'll master:

- **Week 1:** Web scraping, document chunking, vector embeddings, RAG basics, full-stack JavaScript
- **Week 2:** MCP tool orchestration, conversation management, production deployment, testing & evaluation

**Career Skills Gained:**

- Build production AI applications
- Work with modern AI infrastructure (LangChain, vector DBs, LLMs)
- Full-stack development (React + Node.js + MongoDB)
- DevOps (Docker, CI/CD, monitoring)
- Product thinking (UX, analytics, iteration)

---

**All projects are MIT licensed and include complete source code, documentation, and video tutorials.**

_Ready to build real AI that helps real people? Pick your project and start coding! 🚀_
