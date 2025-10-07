const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const { model } = require("../geminiLLM");

async function embedChunks() {
  const chunks = JSON.parse(fs.readFileSync("./data/chunks.json", "utf-8"));
  const embeddings = [];

  for (const chunk of chunks) {
    try {
      const response = await model.embed({ input: chunk.content });
      embeddings.push({
        id: chunk.id,
        url: chunk.url,
        content: chunk.content,
        vector: response.embedding, // Gemini returns numerical vector here
      });

      console.log(`✅ Embedded: ${chunk.id}`);
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

// Run the function
embedChunks();
