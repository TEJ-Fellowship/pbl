// Backend/src/uploadToQdrant.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const COLLECTION = process.env.QDRANT_COLLECTION || "twilio_docs_t1";
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 64);

function qdrantHeaders() {
  const h = { "Content-Type": "application/json" };
  if (QDRANT_API_KEY) h["api-key"] = QDRANT_API_KEY;
  return h;
}

async function createCollection(vectorSize) {
  const body = {
    vectors: { size: vectorSize, distance: "Cos" },
  };
  try {
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, body, {
      headers: qdrantHeaders(),
    });
    console.log(
      `✅ Collection '${COLLECTION}' created/updated with vector size ${vectorSize}`
    );
  } catch (err) {
    // If collection exists, endpoint may return error — still proceed
    console.error(
      "⚠️ createCollection warning:",
      err.response?.data || err.message
    );
  }
}

async function upsertBatch(points) {
  const url = `${QDRANT_URL}/collections/${COLLECTION}/points?wait=true`;
  const payload = { points };
  const res = await axios.put(url, payload, {
    headers: qdrantHeaders(),
    timeout: 120000,
  });
  return res.data;
}

async function run() {
  const embeddingsPath = path.resolve("./src/data/embeddings.json");
  if (!fs.existsSync(embeddingsPath)) {
    console.error("❌ embeddings.json not found at", embeddingsPath);
    process.exit(1);
  }

  const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8"));
  if (!embeddings.length) {
    console.error("❌ embeddings.json is empty");
    process.exit(1);
  }

  const vectorSize = embeddings[0].vector.length;
  await createCollection(vectorSize);

  console.log(
    `🔁 Upserting ${embeddings.length} points in batches of ${BATCH_SIZE}...`
  );
  let count = 0;
  for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
    const slice = embeddings.slice(i, i + BATCH_SIZE);
    const points = slice.map((e, idx) => ({
      id: e.id, // use string id from your pipeline
      vector: e.vector,
      payload: {
        url: e.url,
        content: e.content,
      },
    }));

    try {
      await upsertBatch(points);
      count += points.length;
      console.log(`  ✅ Upserted ${count}/${embeddings.length}`);
    } catch (err) {
      console.error(
        "❌ Upsert batch error:",
        err.response?.data || err.message
      );
    }
  }

  // small report
  const report = {
    timestamp: new Date().toISOString(),
    collection: COLLECTION,
    total_points_indexed: embeddings.length,
    vector_size: vectorSize,
  };
  fs.writeFileSync(
    path.resolve("./src/data/qdrant_index_report.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(
    "🎉 Upload complete. Report saved to src/data/qdrant_index_report.json"
  );
}

run().catch((err) => {
  console.error("Fatal upload error:", err.message);
});
