// backend/src/chatAgent.js
const { searchDocs } = require("./queryHandler.js");
let gen = null;
try {
  gen = require("./geminiLLM.js"); // expects { getEmbedding, generateAnswer }
} catch (e) {
  // If geminiLLM is missing, we'll fall back to retrieval-only behavior.
  gen = null;
}

/**
 * chatWithDocs(query, opts)
 * - query: user question string
 * - opts: { topK, maxContextChars, maxTokens, temperature }
 *
 * Returns: string (LLM answer) OR object { fallback: true, results } if LLM not available
 */
async function chatWithDocs(query, opts = {}) {
  if (!query || typeof query !== "string")
    throw new Error("Query must be a non-empty string");

  const topK = opts.topK || 3;
  const maxContextChars = opts.maxContextChars || 3000;
  const maxTokens = opts.maxTokens || 512;
  const temperature =
    typeof opts.temperature === "number" ? opts.temperature : 0.0;

  // 1) Retrieve top chunks
  const results = await searchDocs(query, topK);

  // If no results, return a short fallback
  if (!results || results.length === 0) {
    const msg = "I couldn't find relevant documents in the indexed docs.";
    console.log("\n🤖 Assistant:\n" + msg + "\n");
    return msg;
  }

  // 2) Build concise context (include source URL per chunk)
  const contextPieces = results.map((r, idx) => {
    return `SOURCE ${idx + 1}: ${r.url}\n${r.content}`;
  });
  let context = contextPieces.join("\n\n");
  if (context.length > maxContextChars)
    context = context.slice(0, maxContextChars);

  // 3) If LLM generateAnswer available, use it. Otherwise fallback to returning retrieved snippets.
  if (gen && typeof gen.generateAnswer === "function") {
    const systemInstruction = [
      "You are a Twilio developer support assistant.",
      "Use ONLY the provided CONTEXT to answer the question. If the context does not contain the answer, say: \"I don't know — I couldn't find that in the docs.\"",
      "When showing code, preserve code formatting and language fences.",
      "Prefer concise steps and include example code when appropriate.",
    ].join("\n");

    const prompt = [
      systemInstruction,
      "\nCONTEXT:\n" + context,
      `\nQUESTION:\n${query}`,
      "\nAnswer concisely. Cite source URLs if helpful.",
    ].join("\n\n");

    // call LLM
    const answer = await gen.generateAnswer(prompt, { maxTokens, temperature });
    // print and return
    console.log("\n🤖 Assistant:\n");
    console.log(answer);
    console.log("\n--- End Answer ---\n");
    return answer;
  } else {
    // fallback: return the ranked snippets for now (safe when LLM not configured)
    console.log(
      "\n⚠️ LLM not configured — returning retrieved snippets as fallback.\n"
    );
    results.forEach((r, i) => {
      console.log(`\n#${i + 1} (score ${r.score.toFixed(3)})`);
      console.log(`Source: ${r.url}`);
      console.log(r.content.slice(0, 800));
      console.log("\n------------------------------------\n");
    });
    return { fallback: true, results };
  }
}

module.exports = { chatWithDocs };