// Simple word/char-based chunker with overlap; preserves code blocks by splitting on paragraphs first
export function splitTextIntoChunks({
  text,
  chunkSizeChars = 3500,
  chunkOverlapChars = 400,
}) {
  if (!text) return [];
  const paragraphs = text.split(/\n{2,}/);
  const merged = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length <= chunkSizeChars) {
      current = current ? current + "\n\n" + p : p;
    } else {
      if (current) merged.push(current);
      if (p.length > chunkSizeChars) {
        // break long paragraph into word slices
        const words = p.split(/\s+/);
        let buf = "";
        for (const w of words) {
          if ((buf + " " + w).length > chunkSizeChars) {
            merged.push(buf.trim());
            buf = w;
          } else {
            buf = buf ? buf + " " + w : w;
          }
        }
        if (buf) merged.push(buf.trim());
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
    const overlap = prev.slice(Math.max(0, prev.length - chunkOverlapChars));
    withOverlap.push((overlap ? overlap + "\n\n" : "") + merged[i]);
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
