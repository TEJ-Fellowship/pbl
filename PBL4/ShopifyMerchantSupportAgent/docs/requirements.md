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
