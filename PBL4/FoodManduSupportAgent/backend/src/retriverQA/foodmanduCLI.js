import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(question) {
  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();

    if (data.success) {
      console.log(
        "\n🤖 Foodmandu Bot:",
        data.data.answer || "No answer found.\n"
      );
    } else {
      console.log("\n❌ Error:", data.error || "Unknown error\n");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

function chat() {
  rl.question("🧍You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("👋 Goodbye!");
      rl.close();
      process.exit(0);
    } else {
      await askQuestion(input);
      chat(); // continue chatting
    }
  });
}

console.log("💬 Foodmandu CLI Chatbot Started!");
console.log("Type your questions or 'exit' to quit.\n");
chat();
