# 🚀 Complete Backend-Frontend Integration Guide

This guide will help you set up and use the complete Stripe Support Agent system with both CLI and web UI access to the full backend functionality.

## 📋 **System Overview**

The integrated system provides:

- **CLI Access**: Full command-line interface with MCP tools
- **Web UI**: Modern React frontend with integrated chat
- **Backend API**: RESTful API with full MCP tool integration
- **Hybrid Search**: BM25 + semantic search capabilities
- **Memory System**: Conversational memory and context
- **MCP Tools**: Calculator, Status Checker, Payment Processor, etc.

## 🛠️ **Setup Instructions**

### **Prerequisites**

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Pinecone account
- Google Gemini API key
- Stripe test API keys

### **Step 1: Backend Setup**

```bash
cd PBL4/StripeCustomerSupportAgent/Backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your API keys
# Required: GEMINI_API_KEY, PINECONE_API_KEY, STRIPE_SECRET_KEY
```

### **Step 2: Frontend Setup**

```bash
cd PBL4/StripeCustomerSupportAgent/Frontend

# Install dependencies
npm install
```

### **Step 3: Database Setup**

```bash
cd PBL4/StripeCustomerSupportAgent/Backend

# Run database migrations
node migrate-database.js

# Setup database
node setup-database.js
```

## 🚀 **Running the System**

### **Option 1: CLI Mode (Full Backend Functionality)**

```bash
cd PBL4/StripeCustomerSupportAgent/Backend

# Start integrated CLI chat
node scripts/startIntegratedCLI.js cli

# Or directly
node scripts/integratedChat.js
```

**Features:**

- Full MCP tool integration
- Hybrid search capabilities
- Memory system
- Query classification
- Real-time status monitoring

### **Option 2: Web UI Mode**

```bash
# Terminal 1: Start Backend
cd PBL4/StripeCustomerSupportAgent/Backend
npm start

# Terminal 2: Start Frontend
cd PBL4/StripeCustomerSupportAgent/Frontend
npm run dev
```

**Access:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Integrated Chat: http://localhost:5173/integrated-chat

### **Option 3: Full Stack (Automated)**

```bash
cd PBL4/StripeCustomerSupportAgent/Backend

# Start both backend and frontend
node scripts/startIntegratedCLI.js full
```

## 🎯 **Usage Examples**

### **CLI Usage**

```bash
# Start CLI mode
node scripts/startIntegratedCLI.js cli

# Example interactions:
❓ Your question: What's Stripe's fee for $1000?
🔧 MCP tools used: calculator
📊 MCP confidence: 95%
✅ Response: Stripe's fee for $1000 is $29.00 (2.9% + $0.30)

❓ Your question: Is Stripe down right now?
🔧 MCP tools used: status_checker
📊 MCP confidence: 90%
✅ Response: All systems operational ✅

❓ Your question: How do I create a payment intent?
🔍 Using hybrid search approach
📚 Found 5 relevant sources
✅ Response: [Detailed API documentation with code examples]
```

### **Web UI Usage**

1. **Navigate to Integrated Chat**: http://localhost:5173/integrated-chat
2. **Ask Questions**: Use the chat interface
3. **View System Status**: Click the system status button
4. **Monitor Tools**: See which MCP tools are being used
5. **View Sources**: See documentation sources used

### **API Usage**

```javascript
// Send message to integrated chat
const response = await fetch("http://localhost:5000/api/integrated-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What's Stripe's fee for $500?",
    sessionId: "session_123",
    userId: "user_456",
  }),
});

const data = await response.json();
console.log(data.data.message); // AI response
console.log(data.data.mcpToolsUsed); // ['calculator']
console.log(data.data.confidence); // 0.95
```

## 🔧 **System Architecture**

### **Backend Components**

- **Express Server**: RESTful API endpoints
- **Integrated Chat Route**: `/api/integrated-chat` - Full MCP integration
- **Memory Controller**: Conversational memory management
- **MCP Integration Service**: Tool orchestration
- **Query Classifier**: AI-powered query routing
- **Hybrid Search**: BM25 + semantic search

### **Frontend Components**

- **React App**: Modern UI with routing
- **Integrated Chat Page**: Full MCP tool integration
- **Chat History**: Session management
- **System Status**: Real-time monitoring
- **Token Usage**: Usage tracking

### **MCP Tools Available**

- **Calculator Tool**: Stripe fee calculations
- **Status Checker**: Stripe API status monitoring
- **Payment Processor**: Stripe payment operations
- **Web Search**: Current information retrieval
- **Code Validator**: API endpoint validation
- **DateTime Tool**: Time operations
- **Currency Converter**: Multi-currency support

## 📊 **Query Classification System**

The system automatically routes queries to the best approach:

### **MCP_TOOLS_ONLY**

- Calculations: "What's Stripe's fee for $1000?"
- Status checks: "Is Stripe down?"
- Time queries: "What time is it?"
- Currency conversion: "Convert $50 to EUR"

### **HYBRID_SEARCH**

- Documentation: "How do I create a payment intent?"
- API guides: "How to handle webhooks?"
- Tutorials: "How to set up subscriptions?"

### **COMBINED**

- Complex queries: "Calculate fees and show me the API implementation"
- Multi-part: "Is Stripe working and how do I implement webhooks?"

## 🎛️ **System Monitoring**

### **CLI Commands**

```bash
# Check MCP system status
❓ Your question: mcp

# Check classifier status
❓ Your question: classifier

# Get sample questions
❓ Your question: sample
```

### **Web UI Monitoring**

- System status indicators
- MCP tool availability
- Query classifier status
- Service health checks
- Token usage tracking

### **API Endpoints**

```bash
# System health
GET /api/integrated-chat/health

# MCP status
GET /api/integrated-chat/mcp-status

# Classifier status
GET /api/integrated-chat/classifier-status
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **MCP Tools Not Working**

   ```bash
   # Check MCP status
   curl http://localhost:5000/api/integrated-chat/mcp-status
   ```

2. **Database Connection Issues**

   ```bash
   # Check database setup
   node setup-database.js
   ```

3. **Frontend Not Connecting**

   ```bash
   # Check backend is running
   curl http://localhost:5000/api/health
   ```

4. **Environment Variables**
   ```bash
   # Verify all required keys are set
   node -e "console.log(process.env.GEMINI_API_KEY ? '✅' : '❌')"
   ```

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=* node scripts/integratedChat.js

# Check specific service
node scripts/startIntegratedCLI.js server
```

## 📈 **Performance Optimization**

### **Backend Optimization**

- Connection pooling for PostgreSQL
- Caching for Pinecone queries
- Memory management for large conversations
- Rate limiting for API endpoints

### **Frontend Optimization**

- React component memoization
- Lazy loading for chat history
- Efficient state management
- Optimized re-renders

## 🔒 **Security Considerations**

### **API Security**

- CORS configuration
- Request validation
- Rate limiting
- Input sanitization

### **Data Security**

- Environment variable protection
- API key management
- Session security
- Data encryption

## 📚 **Advanced Usage**

### **Custom MCP Tools**

1. Create tool in `services/mcp-tools/`
2. Add to `config/mcp-tools.json`
3. Implement tool interface
4. Test with CLI or API

### **Custom Query Classification**

1. Modify `services/queryClassifier.js`
2. Add new classification rules
3. Update frontend display
4. Test with various queries

### **Custom Memory Context**

1. Extend `controllers/memoryController.js`
2. Add custom context types
3. Implement context retrieval
4. Test with long conversations

## 🎉 **Success Indicators**

### **System Working Correctly**

- ✅ CLI starts without errors
- ✅ Web UI loads and connects
- ✅ MCP tools respond to queries
- ✅ Hybrid search returns results
- ✅ Memory system maintains context
- ✅ Query classification works
- ✅ All API endpoints respond

### **Performance Benchmarks**

- CLI response time: < 2 seconds
- Web UI response time: < 3 seconds
- API response time: < 1 second
- Memory usage: < 500MB
- Database queries: < 100ms

## 🚀 **Next Steps**

1. **Deploy to Production**: Use the deployment guidelines
2. **Add More MCP Tools**: Extend functionality
3. **Customize UI**: Modify frontend components
4. **Add Authentication**: Implement user management
5. **Scale System**: Add load balancing and caching

## 📞 **Support**

For issues or questions:

1. Check the troubleshooting section
2. Review system logs
3. Test individual components
4. Verify environment setup
5. Check API connectivity

---

**🎯 You now have a complete, integrated system that provides both CLI and web UI access to the full backend functionality!**
