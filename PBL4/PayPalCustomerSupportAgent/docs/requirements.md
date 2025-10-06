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
