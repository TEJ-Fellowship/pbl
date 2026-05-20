/**
 * Ordered segments for markdown-aware chunking (see temp/code-intergrity-splitting.md).
 * @typedef {{ type: 'text', value: string } | { type: 'code', value: string }} MarkdownSegment
 */

/**
 * True if index `i` is the start of a line (start of string or immediately after newline).
 * @param {string} s
 * @param {number} i
 */
function isLineStart(s, i) {
    return i === 0 || s[i - 1] === "\n";
  }
  
  /**
   * Finds the next line that is only optional indent + closing ``` (CommonMark-style fence line).
   * @param {string} s
   * @param {number} from - first character after the newline that ends the opening fence line
   * @returns {{ lineStart: number, afterLine: number } | null}
   */
  function findClosingFenceLine(s, from) {
    let scan = from;
    while (scan < s.length) {
      const nl = s.indexOf("\n", scan);
      const lineStart = scan;
      const lineEnd = nl === -1 ? s.length : nl;
      const line = s.slice(lineStart, lineEnd);
      if (/^\s*```\s*$/.test(line)) {
        const afterLine = nl === -1 ? s.length : nl + 1;
        return { lineStart, afterLine };
      }
      if (nl === -1) break;
      scan = nl + 1;
    }
    return null;
  }
  
  /**
   * Full content → ordered text and fenced-code segments.
   * Code segment `value` is the full fence from opening ``` through end of closing line.
   * Unclosed fence: from that ``` to EOF is one text segment.
   * ``` not at line start is kept as text.
   *
   * @param {string} content
   * @returns {MarkdownSegment[]}
   */
  function segmentMarkdownToTextAndCode(content) {
    if (content == null || content === "") return [];
  
    /** @type {MarkdownSegment[]} */
    const segments = [];
    let pos = 0;
  
    const appendText = (start, end) => {
      if (end <= start) return;
      const value = content.slice(start, end);
      const prev = segments[segments.length - 1];
      if (prev && prev.type === "text") prev.value += value;
      else segments.push({ type: "text", value });
    };
  
    while (pos < content.length) {
      const fenceIdx = content.indexOf("```", pos);
      if (fenceIdx === -1) {
        appendText(pos, content.length);
        break;
      }
  
      if (!isLineStart(content, fenceIdx)) {
        appendText(pos, fenceIdx + 3);
        pos = fenceIdx + 3;
        continue;
      }
  
      appendText(pos, fenceIdx);
  
      const openLineEnd = content.indexOf("\n", fenceIdx);
      if (openLineEnd === -1) {
        appendText(fenceIdx, content.length);
        break;
      }
  
      const bodyStart = openLineEnd + 1;
      const close = findClosingFenceLine(content, bodyStart);
      if (!close) {
        appendText(fenceIdx, content.length);
        break;
      }
  
      const codeValue = content.slice(fenceIdx, close.afterLine);
      segments.push({ type: "code", value: codeValue });
      pos = close.afterLine;
    }
  
    return segments;
  }
  
  module.exports = {
    segmentMarkdownToTextAndCode,
    isLineStart,
    findClosingFenceLine,
  };
