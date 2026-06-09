# 🚀 Updated Setup Guide - Foodmandu Support Agent

This guide covers the setup steps after implementing all Tier 1-3 enhancements.

---

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (running locally or cloud)
- Pinecone account (free tier works)
- Google Gemini API key

---

## 🔧 Setup Steps

### 1. **Environment Variables**

Create `.env` file in `backend/` directory:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/foodmandu-support

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=foodmandu-docs
PINECONE_DIMENSION=768

# Google Gemini
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=5000
NODE_ENV=development
```

### 2. **Install Dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. **Initialize Pinecone Index**

Go to Pinecone console and create an index:

- **Name:** `foodmandu-docs`
- **Dimensions:** `768`
- **Metric:** `cosine`
- **Pod Type:** `s1` (starter) or `p1` (performance)

### 4. **Scrape Foodmandu Docs**

```bash
cd backend/src/scraper
node foodmanduScraper.js
```

This will create `foodmanduDocs.json` with all scraped content.

### 5. **Generate & Upload Embeddings**

```bash
cd backend/src/embeddings
node foodmanduEmbeddings.js
```

This will:

- Chunk documents into ~500 token pieces
- Generate Gemini embeddings
- Add metadata (topic, user_type, language)
- Upload to Pinecone

**Expected output:**

```
✅ Uploaded 45 vectors from https://foodmandu.com/Help (topic: support, user_type: customer)
✅ Uploaded 32 vectors from https://foodmandu.com/page/refund-policy (topic: refund, user_type: customer)
...
📊 Total chunks processed: 850+
🎉 All docs ingested!
```

### 6. **Start Backend Server**

```bash
cd backend
npm start
```

Server will start on `http://localhost:5000`

### 7. **Start Frontend**

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## ✅ Verify Setup

### Test RAG Pipeline

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I pay with eSewa?", "language": "en"}'
```

### Test MCP Tools

```bash
# List all tools
curl http://localhost:5000/api/mcp/tools

# Test payment status
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "check_payment_status", "args": {"gateway": "esewa"}}'

# Test weather delay
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "check_weather_delay", "args": {}}'

# Test address validation
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "validate_address", "args": {"address": "Thamel, Kathmandu"}}'
```

### Test Order Tracking

```bash
curl "http://localhost:5000/api/track?orderId=FM100001"
```

### Test Intent Classification

Open the UI and try:

- "Track my order FM100001" → Should trigger MCP tracking
- "I want a refund for FM100001" → Should detect refund_request intent
- "Payment failed for my order" → Should detect payment_issue intent
- "Where is my delivery?" → Should ask for order ID

---

## 🎯 New Features to Test

### 1. **Auto Language Detection**

- Type in Devanagari: "मेरो अर्डर कहाँ छ?"
- System should auto-detect Nepali and respond in Nepali
- Type in English: "Where is my order?"
- System should respond in English

### 2. **Quick Action Buttons**

- Click "Request Refund" → Should pre-fill refund request
- Click "Contact Restaurant" → Should pre-fill contact request
- Click "Track Order" → Should show order selection

### 3. **Urgency Detection & Escalation**

Create a test order that's >90 minutes old:

```javascript
// In backend/src/dummy data/orders.json
// Modify an order's createdAt to be 2 hours ago:
"createdAt": "2024-10-30T10:00:00Z" // Adjust to 2 hours ago
```

Then track it:

- System should auto-create a Ticket
- Response should include escalation message

### 4. **Topic-Aware Search**

Try queries related to specific topics:

- "How do I pay with Khalti?" → Should boost payment topic results
- "What areas do you deliver to?" → Should boost delivery topic results
- "How do I get a refund?" → Should boost refund topic results

### 5. **New MCP Tools**

#### Weather Impact

```javascript
// In UI, ask: "Is weather affecting deliveries?"
// Should call check_weather_delay and report Kathmandu weather
```

#### Payment Status

```javascript
// In UI, ask: "Is eSewa working?"
// Should call check_payment_status and report gateway status
```

#### Address Validation

```javascript
// In UI, ask: "Do you deliver to Thamel?"
// Should call validate_address and confirm delivery area
```

---

## 📊 MongoDB Collections

After running, you should see these collections:

### `chats` (Enhanced)

```javascript
{
  _id: ObjectId,
  question: "Where is my order FM100001?",
  answer: "Order FM100001 status: Order is on the Way...",
  language: "en",
  intent: "track_order",
  mcpTool: "get_all_details",
  orderId: "FM100001",
  latencyMs: 1523,
  method: "MCP",
  userLocation: { lat: 27.7, lng: 85.3 },
  wasEscalated: false,
  ticketId: null,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### `tickets` (New)

```javascript
{
  _id: ObjectId,
  ticketId: "TKT-000001",
  orderId: "FM100001",
  type: "delivery_delay",
  priority: "urgent",
  status: "open",
  customerQuestion: "Where is my order? It's been 2 hours!",
  urgencyReason: "Order is 95 minutes late (promised: 60 min)",
  delayMinutes: 95,
  language: "en",
  metadata: {
    customerPhone: "+977-9841234567",
    restaurantName: "Momo Hut",
    orderTotal: 850,
    paymentMethod: "eSewa",
    eta: 5,
    currentStage: 3
  },
  notes: [],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## 🔍 Analytics Queries

### Chat Analytics

```javascript
// Count by intent
db.chats.aggregate([{ $group: { _id: "$intent", count: { $sum: 1 } } }]);

// Average latency by method
db.chats.aggregate([
  { $group: { _id: "$method", avgLatency: { $avg: "$latencyMs" } } },
]);

// Escalation rate
db.chats.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      escalated: { $sum: { $cond: ["$wasEscalated", 1, 0] } },
    },
  },
]);
```

### Ticket Analytics

```javascript
// Tickets by priority
db.tickets.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]);

// Average delay for escalated orders
db.tickets.aggregate([
  { $match: { type: "delivery_delay" } },
  { $group: { _id: null, avgDelay: { $avg: "$delayMinutes" } } },
]);
```

---

## 🐛 Troubleshooting

### "Pinecone index not found"

- Verify index name in `.env` matches Pinecone console
- Check dimension is exactly 768

### "Gemini API error"

- Verify API key is valid
- Check quota limits (free tier: 60 requests/minute)

### "MongoDB connection failed"

- Ensure MongoDB is running: `mongod` or check cloud connection string
- Verify `MONGODB_URI` in `.env`

### "No context found for query"

- Re-run embeddings: `node backend/src/embeddings/foodmanduEmbeddings.js`
- Check Pinecone index has vectors

### "Intent not detected"

- Check intent classifier patterns in `backend/src/utils/intentClassifier.js`
- Try more explicit queries: "Track order FM100001"

---

## 📚 Documentation

- **Main Implementation:** `GAPS_FILLED_SUMMARY.md`
- **Backend API:** `backend/TEST_API.md`
- **MCP Tools:** `backend/src/mcp/tools/README.md`
- **Order Structure:** `ORDER_DATA_STRUCTURE.md`
- **Testing:** `TEST_SCENARIOS.md`

---

## 🎉 Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Can switch between English/Nepali
- [ ] RAG returns relevant answers
- [ ] Order tracking shows live map
- [ ] Quick action buttons work
- [ ] Intent classification detects 9+ intents
- [ ] Escalation creates tickets for late orders
- [ ] Weather/payment/address tools accessible
- [ ] Analytics data saves to MongoDB

---

## 🚀 Next Steps

1. **Test with real users** - Get feedback on empathetic tone
2. **Monitor analytics** - Check intent distribution, latency, escalation rate
3. **Tune search** - Adjust topic boost weights if needed
4. **Add more intents** - Extend classifier as new patterns emerge
5. **Integrate Foodmandu API** - Replace dummy data with live orders (Tier 4)

---

**All systems are ready! 🎊**

You now have a production-ready Tier 1-3 Foodmandu Support Agent with:

- Smart RAG pipeline (Gemini + Pinecone)
- 10 MCP tools
- Auto-escalation
- Full analytics
- Bilingual support (English/Nepali)
- Empathetic tone
