/**
 * Debug Script for Chat Endpoint
 * Run this to test the chat endpoint and see detailed error messages
 */

import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Starting Debug Check...\n");

// 1. Check Environment Variables
console.log("📋 Environment Variables:");
console.log(
  "✓ MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"
);
console.log(
  "✓ PINECONE_API_KEY:",
  process.env.PINECONE_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "✓ PINECONE_INDEX_NAME:",
  process.env.PINECONE_INDEX_NAME ? "✅ Set" : "❌ Missing"
);
console.log(
  "✓ PINECONE_DIMENSION:",
  process.env.PINECONE_DIMENSION ? "✅ Set" : "❌ Missing"
);
console.log(
  "✓ GOOGLE_GEMINI_API_KEY:",
  process.env.GOOGLE_GEMINI_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log("");

// 2. Test MongoDB Connection
console.log("🗄️  Testing MongoDB Connection...");
try {
  const mongoose = await import("mongoose");
  await mongoose.default.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB Connected\n");
  await mongoose.default.disconnect();
} catch (err) {
  console.error("❌ MongoDB Connection Failed:", err.message);
  console.log("");
}

// 3. Test Pinecone Connection
console.log("🔌 Testing Pinecone Connection...");
try {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

  // Test query
  const testVector = new Array(
    parseInt(process.env.PINECONE_DIMENSION || 768)
  ).fill(0);
  const result = await index.query({
    vector: testVector,
    topK: 1,
    includeMetadata: true,
  });

  console.log("✅ Pinecone Connected");
  console.log(
    `   Vectors in index: ${
      result.matches?.length > 0 ? "Yes" : "No (empty index)"
    }\n`
  );
} catch (err) {
  console.error("❌ Pinecone Connection Failed:", err.message);
  console.log("");
}

// 4. Test Gemini API
console.log("🤖 Testing Gemini API...");
try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    }),
  });

  if (response.ok) {
    console.log("✅ Gemini API Working\n");
  } else {
    const error = await response.json();
    console.error(
      "❌ Gemini API Failed:",
      error.error?.message || "Unknown error"
    );
    console.log("");
  }
} catch (err) {
  console.error("❌ Gemini API Failed:", err.message);
  console.log("");
}

// 5. Test Chat Endpoint Flow
console.log("💬 Testing Chat Flow...");
try {
  // Import required modules
  const { classifyIntent } = await import("./src/utils/intentClassifier.js");
  const { hybridSearch } = await import("./src/retriverQA/retriever.js");

  console.log("✅ All modules loaded successfully");

  // Test intent classification
  const testQuestion = "Where is my order?";
  const intent = classifyIntent(testQuestion);
  console.log(
    `✅ Intent Classification: ${intent.intent} (confidence: ${intent.confidence})`
  );

  // Test retrieval (this might fail if Pinecone is empty)
  try {
    const sections = await hybridSearch(testQuestion, 3);
    console.log(`✅ Retrieval: ${sections.length} sections found\n`);
  } catch (err) {
    console.log("⚠️  Retrieval failed (Pinecone might be empty):", err.message);
    console.log("   Run: cd src/embeddings && node foodmanduEmbeddings.js\n");
  }
} catch (err) {
  console.error("❌ Chat Flow Failed:", err.message);
  console.error("Stack:", err.stack);
  console.log("");
}

console.log("✨ Debug check complete!");
console.log("\n📝 Next Steps:");
console.log("1. Fix any ❌ errors above");
console.log(
  "2. If Pinecone is empty, run: cd src/embeddings && node foodmanduEmbeddings.js"
);
console.log("3. Restart your backend: npm start");
