import "dotenv/config";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

async function testMemoryInFrontend() {
  console.log("🎭 Frontend Memory Test - Copy this into browser console\n");

  const sessionId = `frontend-test-${Date.now()}`;

  console.log("// Test 1: Initial Question");
  console.log(`const response1 = await fetch('${API_BASE_URL}/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "How do I create products using the Shopify API?",
    sessionId: "${sessionId}"
  })
});
const data1 = await response1.json();
console.log('✅ First response:', data1.answer.substring(0, 100) + '...');
console.log('Turn count:', data1.multiTurnContext?.turnCount);`);

  console.log("\n// Test 2: Follow-up Question");
  console.log(`const response2 = await fetch('${API_BASE_URL}/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What about recurring payments?",
    sessionId: "${sessionId}"
  })
});
const data2 = await response2.json();
console.log('✅ Follow-up detected:', data2.multiTurnContext?.isFollowUp);
console.log('Follow-up confidence:', data2.multiTurnContext?.followUpConfidence);
console.log('Turn count:', data2.multiTurnContext?.turnCount);
console.log('Response:', data2.answer.substring(0, 150) + '...');`);

  console.log("\n// Test 3: Another Follow-up");
  console.log(`const response3 = await fetch('${API_BASE_URL}/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "How do I manage inventory for these products?",
    sessionId: "${sessionId}"
  })
});
const data3 = await response3.json();
console.log('✅ Follow-up detected:', data3.multiTurnContext?.isFollowUp);
console.log('Turn count:', data3.multiTurnContext?.turnCount);
console.log('Response:', data3.answer.substring(0, 150) + '...');`);

  console.log("\n// Test 4: Check Statistics");
  console.log(`const statsResponse = await fetch('${API_BASE_URL}/stats/${sessionId}');
const stats = await statsResponse.json();
console.log('📊 Conversation Stats:', JSON.stringify(stats, null, 2));`);

  console.log("\n🎯 Expected Results:");
  console.log("✅ First response: Normal answer about product creation");
  console.log("✅ Follow-up detected: true (confidence > 1.0)");
  console.log("✅ Turn count: Increases (1, 2, 3...)");
  console.log(
    "✅ Follow-up responses: Start with 'Building on your previous question...'"
  );
  console.log(
    "✅ Pronoun resolution: 'these products' refers to previously discussed products"
  );

  console.log("\n🔍 What to Look For:");
  console.log("- Responses that reference previous conversation");
  console.log("- Turn count increasing with each message");
  console.log("- Follow-up detection working correctly");
  console.log("- Context building in responses");
  console.log("- User preference learning");
}

testMemoryInFrontend();
