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
- ✅ Cultural context (festival rush times, food preferences) 

---
