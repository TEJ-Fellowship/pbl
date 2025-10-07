// backend/src/chunkDoc.js
import fs from "fs";

// 🧩 Function: Split big text into smaller chunks (for embedding)
function chunkText(text) {
  const chunks = [];
  const lines = text.split("\n");
  let buffer = "";

  for (let line of lines) {
    buffer += line + "\n";

    // ✅ Create new chunk once length > 1500 and not inside code block
    if (buffer.length > 1500 && !line.includes("```")) {
      chunks.push(buffer.trim());
      buffer = "";
    }
  }

  if (buffer.trim().length > 0) chunks.push(buffer.trim());
  return chunks;
}

// 🧠 Function: Detect language from code snippets using keyword clues
function detectLanguage(text) {
  if (/const|let|=>|console\.log/.test(text)) return "JavaScript";
  if (/def |import |print\(|lambda/.test(text)) return "Python";
  if (/#include|int main|std::/.test(text)) return "C++";
  if (/<\?php|echo |->/.test(text)) return "PHP";
  return "Unknown";
}

// ⚡ Function: Extract Twilio error codes (e.g., 21211, 20003, etc.)
function extractErrorCodes(text) {
  const matches = text.match(/\b\d{5}\b/g); // find 5-digit numbers
  return matches ? [...new Set(matches)] : [];
}

// 🎯 MAIN FUNCTION
function chunkDocs() {
  const rawDocs = JSON.parse(
    fs.readFileSync("./src/data/twilio_docs/scraped.json", "utf-8")
  );
  const allChunks = [];

  rawDocs.forEach((doc) => {
    const chunks = chunkText(doc.content);
    chunks.forEach((chunk, index) => {
      allChunks.push({
        id: `${doc.url}-chunk-${index}`,
        url: doc.url,
        category: doc.category || "general", // from scraper
        language: detectLanguage(chunk),
        errorCodes: extractErrorCodes(chunk),
        content: chunk,
      });
    });
  });

  fs.writeFileSync(
    "./src/data/chunks.json",
    JSON.stringify(allChunks, null, 2)
  );
  console.log(`✅ Chunking complete! Total chunks: ${allChunks.length}`);
}

// Run function
chunkDocs();
