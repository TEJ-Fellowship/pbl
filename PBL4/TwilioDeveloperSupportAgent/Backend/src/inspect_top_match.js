// backend/src/inspect_top_match.js
import config from "../config/config.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";

async function main() {
  if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  if (!config.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY missing");
  if (!config.PINECONE_INDEX_NAME)
    throw new Error("PINECONE_INDEX_NAME missing");

  const query =
    process.argv.slice(2).join(" ") || "How do I send an SMS in Node.js?";
  console.log("🔎 Inspecting top match for query:", query);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: "text-embedding-004",
  });

  const client = new Pinecone({ apiKey: config.PINECONE_API_KEY });
  const index = client.Index(config.PINECONE_INDEX_NAME);

  // embed the query
  const qvec = await embeddings.embedQuery(query);

  // query pinecone
  const resp = await index.query({
    vector: qvec,
    topK: 1,
    includeMetadata: true,
  });

  const match = (resp.matches || resp.results?.[0]?.matches || [])[0] || null;
  if (!match) {
    console.log("⚠️ No matches returned by Pinecone for this query.");
    return;
  }

  console.log("\n✅ Top match info:");
  console.log("id:", match.id);
  console.log("score:", match.score ?? match.similarity ?? null);
  console.log("\n📦 Full metadata object (raw):");
  console.log(JSON.stringify(match.metadata || {}, null, 2));

  // If metadata.content isn't included (we avoided storing content in metadata),
  // but sometimes ingestion stored a snippet there — print a short snippet if present.
  if (match.metadata?.content) {
    console.log("\n🔍 snippet (first 400 chars):");
    console.log(
      match.metadata.content.slice(0, 400) +
        (match.metadata.content.length > 400 ? "..." : "")
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("❌ inspect_top_match failed:", e?.message || e);
    process.exit(1);
  });
}
