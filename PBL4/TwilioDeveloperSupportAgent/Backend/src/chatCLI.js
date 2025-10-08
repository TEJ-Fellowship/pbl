// backend/src/chatCLI.js
const readlineSync = require("readline-sync");
const { chatWithDocs } = require("./chatAgent.js");
const { highlight } = require("cli-highlight");

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
      const result = await chatWithDocs(query, {
        topK: 3,
        maxTokens: 512,
        temperature: 0.0,
      });

      let answer = "";
      let sources = [];

      if (typeof result === "string") {
        // LLM returned a plain string
        answer = result;
      } else if (result && typeof result === "object") {
        // LLM returned object with answer + sources (or fallback)
        answer = result.answer || "";
        sources = result.sources || [];
      }

      console.log("\n🤖 Answer:\n");

      // Highlight code blocks (```js ... ```)
      const parts = answer.split(/```/);
      parts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          // normal text
          console.log(part);
        } else {
          // inside code block
          const lines = part.split("\n");
          const firstLine = lines[0].trim();
          const lang = /^[a-z0-9-]+$/i.test(firstLine)
            ? firstLine
            : "javascript";
          const code = /^[a-z0-9-]+$/i.test(firstLine)
            ? lines.slice(1).join("\n")
            : part;
          console.log(
            highlight(code, { language: lang, ignoreIllegals: true })
          );
        }
      });

      if (sources?.length) {
        console.log("\n📚 Sources:");
        sources.forEach((src, i) => console.log(`  ${i + 1}. ${src.url}`));
      }
    } catch (err) {
      console.error("❌ Error:", err.message || err);
    }
  }
}

startChat();
