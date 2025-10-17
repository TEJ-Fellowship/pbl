# 🧠 Multi-Turn Conversation Memory Test Guide

## How to Test Memory in the Frontend

### **Step 1: Start Both Servers**

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Step 2: Test Conversation Memory**

#### **Test Case 1: Basic Follow-up**

1. **Ask:** "How do I create products using the Shopify API?"
2. **Wait for response** (should be about product creation)
3. **Ask:** "What about recurring payments?"
4. **Check:** Response should start with "Building on your previous question about creating products..."

#### **Test Case 2: Pronoun Reference**

1. **Ask:** "How do I create products using the Shopify API?"
2. **Wait for response**
3. **Ask:** "How do I manage inventory for these products?"
4. **Check:** Response should reference "these products" and connect to previous conversation

#### **Test Case 3: Multiple Follow-ups**

1. **Ask:** "How do I create products using the Shopify API?"
2. **Ask:** "What about recurring payments?"
3. **Ask:** "How do I handle shipping for these products?"
4. **Check:** Each response should build on the previous conversation

### **Step 3: Check Visual Indicators**

#### **In the Response:**

- Look for phrases like:
  - "Building on your previous question..."
  - "As mentioned earlier..."
  - "Continuing from our discussion about..."
  - "For these products..." (referring to previously discussed products)

#### **In Browser DevTools:**

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Send a follow-up message**
4. **Check the response** - look for `multiTurnContext`:

```json
{
  "multiTurnContext": {
    "turnCount": 3,
    "isFollowUp": true,
    "followUpConfidence": 1.5,
    "userPreferences": {...},
    "conversationStats": {...}
  }
}
```

### **Step 4: Test Context Compression**

#### **Trigger Compression:**

1. **Send 10+ messages** in the same session
2. **Check console logs** for: "Compressing conversation context at turn X"
3. **Verify** that responses still maintain context despite compression

### **Step 5: Test User Preference Learning**

#### **API Preference:**

1. **Ask:** "I'm using the GraphQL Admin API for advanced integrations"
2. **Ask:** "How do I create products?"
3. **Check:** Response should mention GraphQL examples

#### **Technical Level:**

1. **Ask:** "I'm a beginner, how do I create products?"
2. **Ask:** "What about inventory management?"
3. **Check:** Response should be beginner-friendly

## 🔍 **What to Look For**

### **✅ Signs of Working Memory:**

- Responses reference previous messages
- Follow-up questions are detected (`isFollowUp: true`)
- Turn count increases with each message
- User preferences are learned and applied
- Context compression happens after 10 turns
- Responses maintain continuity across long conversations

### **❌ Signs of Broken Memory:**

- Each response treats the question independently
- No references to previous conversation
- `isFollowUp: false` for obvious follow-ups
- Turn count doesn't increase
- No user preference learning
- Responses become generic after many turns

## 🧪 **Quick Test Script**

You can also run this in the browser console to test the API directly:

```javascript
// Test follow-up detection
async function testFollowUp() {
  const sessionId = `test-${Date.now()}`;

  // First message
  const response1 = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "How do I create products using the Shopify API?",
      sessionId: sessionId,
    }),
  });

  const data1 = await response1.json();
  console.log("First response:", data1.answer.substring(0, 100));

  // Follow-up message
  const response2 = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "What about recurring payments?",
      sessionId: sessionId,
    }),
  });

  const data2 = await response2.json();
  console.log("Follow-up detected:", data2.multiTurnContext?.isFollowUp);
  console.log("Follow-up response:", data2.answer.substring(0, 100));
}

testFollowUp();
```

## 📊 **Expected Results**

### **Follow-up Detection:**

- ✅ "What about recurring payments?" → `isFollowUp: true`
- ✅ "How do I manage inventory for these products?" → `isFollowUp: true`
- ✅ "Also, how do I handle shipping?" → `isFollowUp: true`
- ❌ "What is Shopify?" → `isFollowUp: false`

### **Memory Persistence:**

- ✅ Turn count increases: 1, 2, 3, 4...
- ✅ User preferences are learned and applied
- ✅ Context compression happens at turn 10
- ✅ Responses maintain conversation continuity

### **Context Building:**

- ✅ Follow-up responses include previous context
- ✅ Pronoun references are resolved correctly
- ✅ Technical level adapts to user's stated preference
- ✅ API preference influences response examples
