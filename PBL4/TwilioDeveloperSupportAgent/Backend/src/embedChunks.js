//  backend/src/embedChunks.js
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const { getEmbedding } = require("./geminiLLM");

async function embedChunks() {
  const chunks = JSON.parse(fs.readFileSync("./src/data/chunks.json", "utf-8"));
  const embeddings = [];

  for (const chunk of chunks) {
    try {
      const vector = await getEmbedding(chunk.content);
      embeddings.push({
        id: chunk.id,
        url: chunk.url,
        content: chunk.content,
        vector,
      });

      console.log(`✅ Embedded: ${chunk.id}`);
    } catch (err) {
      console.error(`❌ Error embedding ${chunk.id}:`, err.message);
    }
  }

  fs.writeFileSync(
    "./src/data/embeddings.json",
    JSON.stringify(embeddings, null, 2)
  );
  console.log(`🔥 All embeddings generated! Total: ${embeddings.length}`);
}

// Run the function
embedChunks();
