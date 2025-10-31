import { spawn } from "child_process";
import readline from "readline";

// Test script to automatically send a question to chat.js
const question = "How do I create a programmable voice call?";

console.log(`🧪 Testing chat.js with question: "${question}"`);
console.log("=".repeat(60));

// Spawn the chat.js process
const chatProcess = spawn("node", ["src/chat.js"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  shell: false,
});

let outputBuffer = "";
let questionSent = false;

// Handle stdout
chatProcess.stdout.on("data", (data) => {
  const output = data.toString();
  outputBuffer += output;
  process.stdout.write(output);

  // Wait for the question prompt, then send our question
  if (!questionSent && output.includes("Your question:")) {
    setTimeout(() => {
      console.log(`\n📤 Sending question: "${question}"`);
      chatProcess.stdin.write(question + "\n");
      questionSent = true;

      // After sending, wait a bit then send exit
      setTimeout(() => {
        console.log("\n📤 Sending exit command...");
        chatProcess.stdin.write("exit\n");
      }, 30000); // 30 seconds to get response
    }, 1000);
  }
});

// Handle stderr
chatProcess.stderr.on("data", (data) => {
  process.stderr.write(data.toString());
});

// Handle process exit
chatProcess.on("exit", (code) => {
  console.log(`\n✅ Process exited with code ${code}`);
  console.log("=".repeat(60));
  process.exit(code);
});

// Handle errors
chatProcess.on("error", (error) => {
  console.error("❌ Error spawning process:", error);
  process.exit(1);
});

