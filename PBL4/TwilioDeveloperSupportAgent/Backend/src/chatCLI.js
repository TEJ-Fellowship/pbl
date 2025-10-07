// src/chatCLI.js
const readlineSync = require("readline-sync");
const { searchDocs } = require("./queryHandler.js");

console.log("💬 Welcome to Twilio Docs Chat!");
console.log("Type your question or 'exit' to quit.\n");

async function chat() {
  while (true) {
    // Step 1: Get user input
    const query = readlineSync.question("You: ");

    // Step 2: Exit condition
    if (query.toLowerCase() === "exit") {
      console.log("👋 Bye!");
      break;
    }

    try {
      // Step 3: Fetch top relevant chunks
      const results = await searchDocs(query, 3);

      // Step 4: Display them
      console.log("\n📄 Top relevant docs:");
      results.forEach((r, i) => {
        console.log(`\n#${i + 1} (${r.score.toFixed(3)})`);
        console.log(`URL: ${r.url}`);
        console.log(`Content: ${r.content.slice(0, 300)}...`);
      });

      console.log("\n---------------------------------\n");
    } catch (err) {
      console.error("❌ Error fetching results:", err.message);
    }
  }
}

// Run the chat
chat();
