// backend/src/chatCLI.js
const readlineSync = require("readline-sync");
const { chatWithDocs } = require("./chatAgent.js");

async function startChat() {
  console.log("🤖 Twilio Developer Support Agent Ready!");
  console.log("Type your question (or 'exit' to quit).");

  while (true) {
    const query = readlineSync.question("\nYou: ").trim();
    if (!query) continue;
    if (query.toLowerCase() === "exit") {
      console.log("👋 Bye!");
      break;
    }

    try {
      await chatWithDocs(query, { topK: 3, maxTokens: 512, temperature: 0.0 });
    } catch (err) {
      console.error("❌ Error:", err.message || err);
    }
  }
}

startChat();
