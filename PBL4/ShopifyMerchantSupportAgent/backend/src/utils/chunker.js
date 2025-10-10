// Simple word/char-based chunker with overlap; also supports token-aware chunking via rough tokenization
export function estimateTokens(t) {
  if (!t) return 0;
  const byChars = Math.ceil(t.length / 4);
  const byWords = (t.match(/\S+/g) || []).length;
  return Math.max(byWords, byChars);
}

export function splitTextIntoChunks(options) {
  const {
    text,
    // char-based defaults
    chunkSizeChars = 3500,
    chunkOverlapChars = 400,
    // token-aware optional settings
    chunkSizeTokens,
    chunkOverlapTokens,
    model,
  } = options || {};
  if (!text) return [];

  const useTokens = Number.isFinite(chunkSizeTokens) && chunkSizeTokens > 0;

  // Rough tokenizer: estimate tokens as ~4 chars per token
  const countTokens = estimateTokens;

  const paragraphs = text.split(/\n{2,}/);
  const merged = [];
  let current = "";

  const withinBudget = (candidate) => {
    if (!useTokens) return candidate.length <= chunkSizeChars;
    return countTokens(candidate) <= chunkSizeTokens;
  };

  const hardBreakParagraph = (p) => {
    const out = [];
    const words = p.split(/\s+/);
    let buf = "";
    for (const w of words) {
      const next = buf ? buf + " " + w : w;
      if (withinBudget(next)) {
        buf = next;
      } else {
        if (buf) out.push(buf.trim());
        buf = w;
        if (!withinBudget(buf)) {
          // fallback: force-slice by chars if even a word exceeds token/char budget
          const limit = useTokens
            ? Math.max(20, Math.floor(chunkSizeTokens * 4))
            : chunkSizeChars;
          for (let i = 0; i < buf.length; i += limit) {
            out.push(buf.slice(i, i + limit));
          }
          buf = "";
        }
      }
    }
    if (buf) out.push(buf.trim());
    return out;
  };

  for (const p of paragraphs) {
    const candidate = current ? current + "\n\n" + p : p;
    if (withinBudget(candidate)) {
      current = candidate;
    } else {
      if (current) merged.push(current);
      if (!withinBudget(p)) {
        merged.push(...hardBreakParagraph(p));
        current = "";
      } else {
        current = p;
      }
    }
  }
  if (current) merged.push(current);

  // add overlap
  if (merged.length <= 1) return merged;
  const withOverlap = [];
  for (let i = 0; i < merged.length; i++) {
    const prev = i > 0 ? merged[i - 1] : "";
    if (!useTokens) {
      const overlap = prev.slice(Math.max(0, prev.length - chunkOverlapChars));
      withOverlap.push((overlap ? overlap + "\n\n" : "") + merged[i]);
    } else {
      // Build token-overlap tail
      const targetOverlap = Math.max(0, chunkOverlapTokens || 0);
      if (targetOverlap <= 0) {
        withOverlap.push(merged[i]);
      } else {
        // take as many characters from the end of prev as needed to reach the token overlap
        let tail = "";
        for (let k = prev.length; k >= 0; k -= 200) {
          tail = prev.slice(Math.max(0, k - 200)) + tail;
          if (countTokens(tail) >= targetOverlap || k === 0) break;
        }
        // trim tail to approximate desired overlap
        while (countTokens(tail) > targetOverlap && tail.length > 0) {
          tail = tail.slice(
            Math.min(tail.length, Math.ceil(tail.length * 0.9))
          );
        }
        const combined = (tail ? tail + "\n\n" : "") + merged[i];
        withOverlap.push(combined);
      }
    }
  }
  return withOverlap;
}

export function splitRespectingCodeBlocks(text, opts = {}) {
  // Keep fenced code blocks intact by splitting around them first
  const parts = text.split(/(```[\s\S]*?```)/g);
  const chunks = [];
  for (const part of parts) {
    if (!part) continue;
    if (/^```[\s\S]*?```$/.test(part)) {
      chunks.push(part);
    } else {
      chunks.push(...splitTextIntoChunks({ text: part, ...opts }));
    }
  }
  return chunks;
}

export function enhanceChunkWithCodeBlocks(chunk, codeBlocks, opts = {}) {
  // If no code blocks, return chunk as-is
  if (!codeBlocks || codeBlocks.length === 0) {
    return chunk;
  }

  // Add code blocks as context at the end of the chunk
  const codeContext = codeBlocks
    .map(
      (cb) =>
        `\n\nCode Example:\n\`\`\`${cb.type || "javascript"}\n${
          cb.content
        }\n\`\`\``
    )
    .join("\n");

  // Check if adding code blocks would exceed token limit
  const enhancedText = chunk + codeContext;
  const estimatedTokens = estimateTokens(enhancedText);
  const maxTokens = opts.chunkSizeTokens || 800;

  if (estimatedTokens <= maxTokens) {
    return enhancedText;
  } else {
    // If too long, include only the first few code blocks
    const limitedCodeBlocks = codeBlocks.slice(
      0,
      Math.min(2, codeBlocks.length)
    );
    const limitedContext = limitedCodeBlocks
      .map(
        (cb) =>
          `\n\nCode Example:\n\`\`\`${cb.type || "javascript"}\n${
            cb.content
          }\n\`\`\``
      )
      .join("\n");

    return chunk + limitedContext;
  }
}
