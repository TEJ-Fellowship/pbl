// backend/src/embedChunks.js
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const { getEmbedding } = require("./geminiLLM");

async function embedChunks() {
  const chunks = JSON.parse(fs.readFileSync("./data/chunks.json", "utf-8"));
  const embeddings = [];

  for (const chunk of chunks) {
    try {
      const vector = await getEmbedding(chunk.content);
      if (vector) {
        embeddings.push({
          id: chunk.id,
          url: chunk.url,
          content: chunk.content,
          vector,
        });
        console.log(`✅ Embedded: ${chunk.id}`);
      } else {
        console.warn(`⚠️ Skipped: ${chunk.id}`);
      }
    } catch (err) {
      console.error(`❌ Error embedding ${chunk.id}:`, err.message);
    }
  }

  fs.writeFileSync(
    "./data/embeddings.json",
    JSON.stringify(embeddings, null, 2)
  );

  console.log(`🔥 All embeddings generated! Total: ${embeddings.length}`);
}

embedChunks();