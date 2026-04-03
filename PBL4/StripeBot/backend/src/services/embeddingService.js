import { fetch, Headers, Request, Response } from "undici";
import { pipeline } from "@xenova/transformers";

// @xenova/transformers expects Web APIs (Node < 18)
if (typeof globalThis.fetch === "undefined") globalThis.fetch = fetch;
if (typeof globalThis.Headers === "undefined") globalThis.Headers = Headers;
if (typeof globalThis.Request === "undefined") globalThis.Request = Request;
if (typeof globalThis.Response === "undefined") globalThis.Response = Response;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

/** @type {import('@xenova/transformers').FeatureExtractionPipeline | null} */
let embedder = null;

/**
 * Lazy-load embedding model (384-dim, matches stripe_doc_chunks.embedding).
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", MODEL_ID);
  }
  const t = String(text || "").slice(0, 8000);
  const out = await embedder(t, { pooling: "mean", normalize: true });
  const data = out.data;
  return Array.from(data);
}

/** @param {string[]} texts */
export async function embedTexts(texts) {
  const vectors = [];
  for (const t of texts) {
    vectors.push(await embedText(t));
  }
  return vectors;
}
