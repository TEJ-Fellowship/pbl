const { countTokens, getTokenizer } = require("../utils/tokenCounter");

/**
 * Split markdown into ordered text vs fenced-code segments.
 * Code values include the full fence (e.g. "```js\n...\n```").
 * Incomplete fences (no closing line) stay in "text" segments.
 *
 * @param {string} content
 * @returns {{ type: "text" | "code", value: string }[]}
 */
function segmentMarkdownByFences(content) {
  const segments = [];
  if (content == null || content === "") return segments;
  const fenceRe =
    /^```[^\n\r]*\r?\n([\s\S]*?)^```[ \t]*(?:\r?\n|$)/gm;
  let lastIndex = 0;
  let match;
  while ((match = fenceRe.exec(content)) !== null) {
    const start = match.index;
    const fullFence = match[0];
    if (start > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, start) });
    }
    segments.push({ type: "code", value: fullFence });
    lastIndex = start + fullFence.length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }
  return segments;
}

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
 * Force-split a string into <= maxChunkTokens pieces using a sliding window.
 * @param {boolean} useOverlap - If false, windows abut (for code; avoids duplicating partial fences).
 */
function forceSplitByTokens(
  text,
  maxChunkTokens,
  overlapTokens,
  tokenizer,
  createChunkObject,
  chunks,
  useOverlap,
) {
  const ids = tokenizer.encode(text);
  const stride = useOverlap
    ? Math.max(1, maxChunkTokens - overlapTokens)
    : maxChunkTokens;
  for (let start = 0; start < ids.length; start += stride) {
    const end = Math.min(start + maxChunkTokens, ids.length);
    const piece = tokenizer.decode(ids.slice(start, end));
    chunks.push(createChunkObject(piece));
    if (end >= ids.length) break;
  }
  const lastPiece = chunks[chunks.length - 1].content;
  return useOverlap ? tailByTokens(lastPiece, overlapTokens) : "";
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

  const parts = content.split(/\n\n+/); //splits string into an array using blank lines(paragraphs)
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
      const ids = tokenizer.encode(part); //Turns text into an array of token IDs
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
      const combined = overlapText ? `${overlapText}\n\n${part}` : part;
      // If overlap pushes us over, skip the overlap to respect the limit
      current = countTokens(combined) <= maxChunkTokens ? combined : part;
    }
  }

  if (current) {
    chunks.push(createChunkObject(current));
  }

  return chunks;
  console.log(chunks);
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

module.exports = { chunkScrapedJSON, chunkPageObject, segmentMarkdownByFences };
