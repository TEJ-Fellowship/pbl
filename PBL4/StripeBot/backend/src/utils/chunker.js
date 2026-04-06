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
  const fenceRe = /^```[^\n\r]*\r?\n([\s\S]*?)^```[ \t]*(?:\r?\n|$)/gm;
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
 * Paragraph-based chunking for a plain text fragment (one or more "text" segments).
 * Mutates `state`: { current }, `chunks`, via createChunkObject.
 */
function processTextSegmentValue(
  textValue,
  state,
  maxChunkTokens,
  overlapTokens,
  tokenizer,
  createChunkObject,
  chunks,
) {
  const parts = textValue.split(/\n\n+/).filter((p) => p.length > 0);
  for (const part of parts) {
    const candidate = state.current ? `${state.current}\n\n${part}` : part;
    if (countTokens(candidate) <= maxChunkTokens) {
      state.current = candidate;
      continue;
    }
    if (state.current) {
      chunks.push(createChunkObject(state.current));
    }
    if (countTokens(part) > maxChunkTokens) {
      state.current = forceSplitByTokens(
        part,
        maxChunkTokens,
        overlapTokens,
        tokenizer,
        createChunkObject,
        chunks,
        true,
      );
    } else {
      const overlapText = state.current
        ? tailByTokens(state.current, overlapTokens)
        : "";
      const combined = overlapText ? `${overlapText}\n\n${part}` : part;
      state.current = countTokens(combined) <= maxChunkTokens ? combined : part;
    }
  }
}

/**
 * Append a fenced code block: try current chunk, else flush and new chunk, else force-split without overlap.
 */
function processCodeSegmentValue(
  codeValue,
  state,
  maxChunkTokens,
  tokenizer,
  createChunkObject,
  chunks,
) {
  const candidate = state.current
    ? `${state.current}\n\n${codeValue}`
    : codeValue;
  if (countTokens(candidate) <= maxChunkTokens) {
    state.current = candidate;
    return;
  }
  if (state.current) {
    chunks.push(createChunkObject(state.current));
    state.current = "";
  }
  if (countTokens(codeValue) <= maxChunkTokens) {
    chunks.push(createChunkObject(codeValue));
    state.current = "";
    return;
  }
  state.current = forceSplitByTokens(
    codeValue,
    maxChunkTokens,
    0,
    tokenizer,
    createChunkObject,
    chunks,
    false,
  );
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

  const segments = segmentMarkdownByFences(content);
  const state = { current: "" };
  for (const seg of segments) {
    if (seg.type === "text") {
      processTextSegmentValue(
        seg.value,
        state,
        maxChunkTokens,
        overlapTokens,
        tokenizer,
        createChunkObject,
        chunks,
      );
    } else {
      processCodeSegmentValue(
        seg.value,
        state,
        maxChunkTokens,
        tokenizer,
        createChunkObject,
        chunks,
      );
    }
  }
  if (state.current) {
    chunks.push(createChunkObject(state.current));
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

module.exports = { chunkScrapedJSON, chunkPageObject, segmentMarkdownByFences };
