import fs from "fs";

// Function to split the text into chunks (each 1000–1500 characters)
function chunkText(text) {
  const chunks = [];
  const lines = text.split("\n");
  let buffer = "";

  for (let line of lines) {
    // Add line to current chunk
    buffer += line + "\n";

    // If the chunk is long enough and not inside code block
    if (buffer.length > 1500 && !line.includes("```")) {
      chunks.push(buffer.trim());
      buffer = "";
    }
  }

  // Push any leftover text as last chunk
  if (buffer.trim().length > 0) chunks.push(buffer.trim());

  return chunks;
}

// MAIN FUNCTION
function chunkDocs() {
  const rawDocs = JSON.parse(fs.readFileSync("./data/rawDocs.json", "utf-8"));
  const allChunks = [];

  rawDocs.forEach((doc) => {
    const chunks = chunkText(doc.text);
    chunks.forEach((chunk, index) => {
      allChunks.push({
        id: `${doc.url}-chunk-${index}`,
        url: doc.url,
        content: chunk,
      });
    });
  });

  fs.writeFileSync("./data/chunks.json", JSON.stringify(allChunks, null, 2));
  console.log(`✅ Chunking complete! Total chunks: ${allChunks.length}`);
}

// Run the function
chunkDocs();
