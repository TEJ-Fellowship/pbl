# 🧪 Testing Your Discord RAG System

## Quick Test Commands:

### 1. **Test if chunks were created:**
```bash
node testRAG.js
```
**What to look for:**
- ✅ "Loaded 30 chunks from knowledge base!"
- ✅ Shows 3 test queries with results
- ✅ Each result shows "Source: [filename]" and "Score: [number]"

### 2. **Interactive Chat Test:**
```bash
node simpleChat.js
```
**What to look for:**
- ✅ Blue welcome message appears
- ✅ "Loaded 30 chunks from knowledge base!"
- ✅ Prompt: "❓ Ask a question:"

## 🎯 **Test Questions to Try:**

### **Easy Questions (should work well):**
1. `How do I create roles in Discord?`
2. `What are Discord webhooks?`
3. `How do I set up server permissions?`
4. `What is Discord?`

### **Medium Questions:**
1. `How do I invite members to my server?`
2. `What are text and voice channels?`
3. `How do I customize role permissions?`

### **Hard Questions (might not work as well):**
1. `How do I integrate GitHub with Discord?`
2. `What are the different permission levels?`

## ✅ **Signs It's Working:**

### **Good Results:**
- Shows relevant content from your Discord docs
- Score numbers (higher = more relevant)
- Source file names (206029707.txt, 228383668.txt, 360045138571.txt)
- Content matches your question

### **Bad Results:**
- "❌ No relevant information found"
- Completely unrelated content
- Very low scores (0-1)

## 🚨 **Troubleshooting:**

### **If you get "No chunks found":**
```bash
node processDocsSimple.js
```

### **If chat doesn't start:**
- Make sure you're in the `server` directory
- Check if you have `chalk` installed: `npm list chalk`

### **To exit chat:**
Type `exit` or `quit` and press Enter

## 📊 **Expected Performance:**
- **Easy questions**: Score 5-7, relevant content
- **Medium questions**: Score 3-5, somewhat relevant
- **Hard questions**: Score 1-3, might be irrelevant

This is normal for a basic text-based search system!
