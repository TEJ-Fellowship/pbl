const { countTokens, getTokenizer } = require("../utils/tokenCounter");

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
  // If the text is shorter than the overlap we want, return the whole thing and encode it into tokens
  const ids = tokenizer.encode(text);
  if (ids.length <= overlapTokens) return text;
  // Slice the array of IDs to get only the last 'overlapTokens' and decode them into text
  return tokenizer.decode(ids.slice(ids.length - overlapTokens));
}
/**
 * Chunks a single scraped page object.
 * @param {Object} pageObject - One item from the scraped JSON array
 * @param {object} options - { maxChunkTokens, overlapTokens }
 * @returns {Object[]} Array of DB-ready chunk objects
 */

function chunkPageObject(pageObject, options = {}) {
  const maxChunkTokens = options.maxChunkTokens || 800;
  const overlapTokens = options.overlapTokens || 100;

  const {
    content,
    id,
    url,
    category,
    title,
    scrapedAt,
    docType,
    metadata: sourceMetadata,
  } = pageObject;

  if (!content || !content.trim()) return [];

  // Metadata to carry into every chunk from this page
  const docMetadata = {
    source_id: id,
    url,
    category,
    title,
    docType,
    scrapedAt,
    source: sourceMetadata?.source,
    contentType: sourceMetadata?.contentType,
  };

  const chunks = [];
  const tokenizer = getTokenizer();

  const createChunkObject = (chunkContent) => ({
    content: chunkContent,
    metadata: {
      ...docMetadata,
      chunk_index: chunks.length,
      token_count: countTokens(chunkContent),
    },
  });

  const parts = content.split(/\n\n+/);
  let current = "";

  for (const part of parts) {
    const candidate = current ? `${current}\n\n${part}` : part;

    if (countTokens(candidate) <= maxChunkTokens) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(createChunkObject(current));
    }

    if (countTokens(part) > maxChunkTokens) {
      const ids = tokenizer.encode(part);
      const stride = Math.max(1, maxChunkTokens - overlapTokens);

      for (let start = 0; start < ids.length; start += stride) {
        const end = Math.min(start + maxChunkTokens, ids.length);
        const piece = tokenizer.decode(ids.slice(start, end));
        chunks.push(createChunkObject(piece));
        if (end >= ids.length) break;
      }

      // Fix: carry overlap after force-split (was missing before)
      const lastPiece = chunks[chunks.length - 1].content;
      current = tailByTokens(lastPiece, overlapTokens);
    } else {
      const overlapText = current ? tailByTokens(current, overlapTokens) : "";
      current = overlapText ? `${overlapText}\n\n${part}` : part;
    }
  }

  if (current) {
    chunks.push(createChunkObject(current));
  }

  return chunks;
}

/**
 * Processes the full scraped JSON array.
 * @param {Object[]} scrapedPages - The array your teammate produces
 * @param {object} options - { maxChunkTokens, overlapTokens }
 * @returns {Object[]} Flat array of all DB-ready chunks across all pages
 */
function chunkScrapedJSON(scrapedPages, options = {}) {
  if (!Array.isArray(scrapedPages) || scrapedPages.length === 0) return [];

  return scrapedPages.flatMap((page) => chunkPageObject(page, options));
}

module.exports = { chunkScrapedJSON, chunkPageObject };
