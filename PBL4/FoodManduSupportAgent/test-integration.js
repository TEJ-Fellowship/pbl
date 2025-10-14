#!/usr/bin/env node

/**
 * Simple integration test script to verify frontend-backend synchronization
 * Run this after starting both frontend and backend servers
 */

const testAPI = async () => {
  const baseURL = "http://localhost:5000";

  console.log("🧪 Testing FoodMandu Support Agent Integration...\n");

  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing health endpoint...");
    const healthResponse = await fetch(`${baseURL}/api/health`);
    const healthData = await healthResponse.json();

    if (healthData.success) {
      console.log("✅ Health check passed");
      console.log(`   Database: ${healthData.database}`);
      console.log(`   Environment: ${healthData.environment}\n`);
    } else {
      throw new Error("Health check failed");
    }

    // Test 2: Chat API with English
    console.log("2️⃣ Testing chat API (English)...");
    const chatResponseEN = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "How can I track my order?",
        language: "en",
      }),
    });

    const chatDataEN = await chatResponseEN.json();

    if (chatDataEN.success) {
      console.log("✅ English chat API working");
      console.log(`   Answer: ${chatDataEN.answer.substring(0, 100)}...\n`);
    } else {
      throw new Error(`English chat failed: ${chatDataEN.error}`);
    }

    // Test 3: Chat API with Nepali
    console.log("3️⃣ Testing chat API (Nepali)...");
    const chatResponseNP = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "मेरो अर्डर कसरी ट्र्याक गर्न सक्छु?",
        language: "np",
      }),
    });

    const chatDataNP = await chatResponseNP.json();

    if (chatDataNP.success) {
      console.log("✅ Nepali chat API working");
      console.log(`   Answer: ${chatDataNP.answer.substring(0, 100)}...\n`);
    } else {
      throw new Error(`Nepali chat failed: ${chatDataNP.error}`);
    }

    // Test 4: Chat History
    console.log("4️⃣ Testing chat history...");
    const historyResponse = await fetch(`${baseURL}/api/chat/history`);
    const historyData = await historyResponse.json();

    if (historyData.success) {
      console.log("✅ Chat history API working");
      console.log(`   Total chats: ${historyData.meta.total}\n`);
    } else {
      throw new Error(`History API failed: ${historyData.error}`);
    }

    console.log("🎉 All tests passed! Frontend and backend are synchronized.");
    console.log("\n📋 Summary of fixes applied:");
    console.log("   ✅ Fixed i18n.js syntax error");
    console.log("   ✅ Fixed API field mismatch (message → question)");
    console.log("   ✅ Fixed port mismatch (3001 → 5000)");
    console.log("   ✅ Added language parameter support");
    console.log("   ✅ Updated Chat model with language field");
    console.log("   ✅ Added bilingual prompt support in Gemini");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("   1. Make sure backend is running on port 5000");
    console.log("   2. Check that MongoDB is connected");
    console.log("   3. Verify environment variables are set");
    console.log("   4. Ensure Pinecone and Gemini API keys are valid");
    process.exit(1);
  }
};

// Run the test
testAPI();
