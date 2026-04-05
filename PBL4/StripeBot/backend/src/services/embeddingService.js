/** undici: HTTP client for Node.js
 * use for implement the standard fetch API in Node.js
 */
import { fetch, Headers, Request, Response } from "undici";
/** xenova/transformers: pipeline for feature extraction
 * @xenova/transformers: JS library to run ML model locally on CPU
 * Transformers: refers to a type of AI model architecture
 * pipeline: helper that loads and runs transformer models easily in JavaScript for feature extraction
 */
import { pipeline } from "@xenova/transformers";

// @xenova/transformers expects Web APIs (Node < 18)
if (typeof globalThis.fetch === "undefined") globalThis.fetch = fetch;
if (typeof globalThis.Headers === "undefined") globalThis.Headers = Headers;
if (typeof globalThis.Request === "undefined") globalThis.Request = Request;
if (typeof globalThis.Response === "undefined") globalThis.Response = Response;

/**
 * "Xenova/all-MiniLM-L6-v2": embedding model, converts text → 384-dimensional vector (numbers)
 * 384 dimension: every sentence is converted into a list of 384 numbers
 * why: it's a small model that is fast and accurate for feature extraction
 */
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

/** @type {import('@xenova/transformers').FeatureExtractionPipeline | null} */
let embedder = null;

/**
 * embedText: function converts a piece of text into a 384-dimensional embedding vector using an AI model.
 * return: JavaScript array, length = 384
 */
export async function embedText(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", MODEL_ID);
  }
  const t = String(text || "").slice(0, 8000);
  /** embedder: the embedding model
   * t: processed text input to embed
   * pooling: "mean": average the embeddings of the tokens to get a single vector
   * normalize: true: normalize the embedding to have a length of 1
   */
  const out = await embedder(t, { pooling: "mean", normalize: true });
  const data = out.data;
  return Array.from(data);
}

/** @param {string[]} texts
 * takes multiple texts and returns multiple embedding vectors
 * vectors: array of embedding vectors
 */
export async function embedTexts(texts) {
  const vectors = [];
  for (const t of texts) {
    vectors.push(await embedText(t));
  }
  return vectors;
}
