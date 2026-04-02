const {
  countTokens,
  truncateToTokenLimit,
  getTokenizer,
} = require("../utils/tokenCounter");

/**
 * Grabs a specific number of tokens from the very end of a string.
 * This is used to create a "bridge" between two chunks
 * so the AI doesn't lose the meaning of a sentence cut in half.
 * * @param {string} text - The source text to pull from.
 * @param {number} overlapTokens - How many tokens to take from the end.
 * @returns {string} The last X tokens converted back into text.
 */

function tailByTokens(text, overlapTokens) {
  if (!text || overlapTokens <= 0) return "";
  const tokenizer = getTokenizer();
  // If the text is shorter than the overlap we want, return the whole thing
  const ids = tokenizer.encode(text);
  if (ids.length <= overlapTokens) return text;
  // Slice the array of IDs to get only the last 'overlapTokens' and decode them
  return tokenizer.decode(ids.slice(ids.length - overlapTokens));
}
/**
 * Splits a long document into smaller, AI-friendly pieces (chunks).
 * It splits by paragraphs first to keep thoughts together, then checks
 * token counts to ensure each piece fits within the AI's "context window."
 * * @param {string} text - The full text to be divided.
 * @param {object} options - Configuration for maxChunkTokens and overlapTokens.
 * @returns {string[]} An array of text chunks with overlapping ends/starts.
 */

function chunkTextByTokens(text, options = {}) {
  // Default limits: 500 tokens per chunk, with 50 tokens of repeated context
  const maxChunkTokensRaw = Number(options.maxChunkTokens ?? 500);
  const overlapTokensRaw = Number(options.overlapTokens ?? 50);

  const maxChunkTokens =
    Number.isInteger(maxChunkTokensRaw) && maxChunkTokensRaw > 0
      ? maxChunkTokensRaw
      : 500;
  const overlapTokens =
    Number.isInteger(overlapTokensRaw) && overlapTokensRaw >= 0
      ? overlapTokensRaw
      : 50;

  if (!text || !text.trim()) return [];

  const chunks = [];
  // Split by double newlines to try and preserve paragraph structure
  const parts = text.split(/\n\n+/);
  let current = "";
  for (const part of parts) {
    // Create a "test" version of the chunk including the new paragraph
    const candidate = current ? `${current}\n\n${part}` : part;

    // If the test version is small enough, keep adding to the current bucket
    if (countTokens(candidate) <= maxChunkTokens) {
      current = candidate;
      continue;
    }
    // current is full, push it
    if (current) {
      chunks.push(current);
    }
    // SPECIAL CASE: single part is too big -> split into multiple token windows
    if (countTokens(part) > maxChunkTokens) {
      const tokenizer = getTokenizer();
      const ids = tokenizer.encode(part);
      const stride = Math.max(1, maxChunkTokens - Math.max(0, overlapTokens));

      for (let start = 0; start < ids.length; start += stride) {
        const end = Math.min(start + maxChunkTokens, ids.length);
        const piece = tokenizer.decode(ids.slice(start, end));
        chunks.push(piece);
        if (end >= ids.length) break;
      }

      // NORMAL CASE:tart new chunk with token overlap from previous chunk
      const overlap = current ? tailByTokens(current, overlapTokens) : "";
      current = overlap ? `${overlap}\n\n${part}` : part;
      // safety in case overlap + part exceeds
      if (countTokens(current) > maxChunkTokens) {
        current = truncateToTokenLimit(current, maxChunkTokens);
      }
    }
    // If there is any leftover text in the last bucket, save it
    if (current) {
      chunks.push(current);
    }
    return chunks;
  }
}

module.exports = { chunkTextByTokens };
