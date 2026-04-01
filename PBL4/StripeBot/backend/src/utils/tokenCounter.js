const { encodingForModel, getEncoding } = require("js-tiktoken");

const TOKENIZER_MODEL = process.env.TOKENIZER_MODEL || "gpt-4o-mini";
const TOKENIZER_FALLBACK_ENCODING =
  process.env.TOKENIZER_FALLBACK_ENCODING || "cl100k_base";

let encoder = null;

function getTokenizer() {
  if (encoder) return encoder;

  try {
    encoder = encodingForModel(TOKENIZER_MODEL);
  } catch (error) {
    console.warn(
      `[tokenCounter] Model encoding not found for "${TOKENIZER_MODEL}", using fallback "${TOKENIZER_FALLBACK_ENCODING}".`,
    );
    encoder = getEncoding(TOKENIZER_FALLBACK_ENCODING);
  }

  return encoder;
}
/*Ensures the input is a valid string, returning an empty string if it's null/undefined.*/
function safeText(input) {
  if (input === null || input === undefined) return "";
  return typeof input === "string" ? input : String(input);
}

/**
 * countTokens(text: string): number
 * Counts the number of tokens (AI word-bites) in a piece of text.
 * Returns 0 safely for null/undefined/empty input.
 */
function countTokens(text) {
  const value = safeText(text);
  if (!value.trim()) return 0;

  const tokenizer = getTokenizer();
  return tokenizer.encode(value).length;
}

/**
 * truncateToTokenLimit(text, maxTokens): string
 * Truncates/cuts off text so token count <= maxTokens.
 */
function truncateToTokenLimit(text, maxTokens) {
  const value = safeText(text);
  if (!value.trim()) return "";
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) return "";

  const tokenizer = getTokenizer();
  const encoded = tokenizer.encode(value);

  if (encoded.length <= maxTokens) return value;

  const truncated = encoded.slice(0, maxTokens);
  return tokenizer.decode(truncated);
}

/**
 * estimateChunkTokenCount(chunk): number
 * Measures text even if it's hidden inside an object (checks fields like 'content' or 'text').
 * Supports string chunk or object chunk (common fields).
 */
function estimateChunkTokenCount(chunk) {
  if (chunk === null || chunk === undefined) return 0;
  if (typeof chunk === "string") return countTokens(chunk);

  // Try common chunk shapes
  const textCandidate =
    chunk.text ?? chunk.content ?? chunk.pageContent ?? chunk.chunk ?? "";

  return countTokens(textCandidate);
}

module.exports = {
  getTokenizer,
  countTokens,
  truncateToTokenLimit,
  estimateChunkTokenCount,
};
