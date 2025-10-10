// backend/src/chunkDoc_v2.js
// ES module. Make sure package.json has "type": "module" or run with node --input-type=module
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * CONFIG
 */
const INPUT_PATH = path.join(
  process.cwd(),
  "data",
  "twilio_docs",
  "scraped.json"
);
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "chunks_v2.json");
const TEXT_CHUNKS_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "text_chunks.json"
);
const CODE_CHUNKS_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "code_chunks.json"
);
const MAX_TEXT_CHARS = 1500; // target size per text chunk

/* ------------------ Helpers ------------------ */

function makeId(...parts) {
  const base = parts.join("|") + "|" + Date.now();
  return crypto.createHash("sha1").update(base).digest("hex").slice(0, 16);
}

function guessLanguage(fenceLang = null, surrounding = "", codeSample = "") {
  if (fenceLang) {
    const map = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      py: "python",
      php: "php",
      java: "java",
      sh: "bash",
      bash: "bash",
      csharp: "csharp",
      cs: "csharp",
    };
    const key = fenceLang.trim().toLowerCase();
    if (map[key]) return map[key];
    return key;
  }

  const joint = ((surrounding || "") + " " + (codeSample || "")).toLowerCase();

  if (/\b(pip install|def |flask|django|import .* from)/.test(joint))
    return "python";
  if (
    /\bnpm install\b|\bnode\b|console\.log|require\(|module\.exports\b|express\b/.test(
      joint
    )
  )
    return "javascript";
  if (/\bcomposer require\b|\b<\?php\b|\becho\b|->/.test(joint)) return "php";
  if (/\bcurl\b|\bwget\b|\bhttpie\b|\b--data\b/.test(joint)) return "bash";
  if (/\bgradle\b|\bmaven\b|\bSystem\.out\b|\bpublic class\b/.test(joint))
    return "java";
  if (/\bdotnet\b|\busing System\b/.test(joint)) return "csharp";

  // fallback
  return "unknown";
}

function extractErrorCodes(text = "") {
  if (!text) return [];
  const matches = text.match(/\b(2\d{4}|\d{5})\b/g) || [];
  return [...new Set(matches)];
}

/* ------------------ Extraction Utilities ------------------ */

/**
 * Extract fenced markdown blocks: ```lang\ncode\n```
 * Returns { cleaned, blocks }
 */
function extractFencedMarkdown(content) {
  const blocks = [];
  const fencedRe = /```([^\n`]*)\n([\s\S]*?)```/g;
  const cleaned = content.replace(fencedRe, (m, langRaw, code) => {
    const lang = (langRaw || "").trim() || null;
    const text = code.replace(/\r/g, "").trim();
    if (text) blocks.push({ code: text, lang });
    return "\n\n__CODE_BLOCK_PLACEHOLDER__\n\n";
  });
  return { cleaned, blocks };
}

/**
 * Extract <pre>...</pre> and <code ...>...</code> if the scraped content still contains them
 */
function extractHtmlCodeTags(content) {
  const blocks = [];
  let cleaned = content;

  const preRe = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  cleaned = cleaned.replace(preRe, (m, inner) => {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      .trim();
    if (text) blocks.push({ code: text, lang: null });
    return "\n\n__CODE_BLOCK_PLACEHOLDER__\n\n";
  });

  const codeRe = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  cleaned = cleaned.replace(codeRe, (m, inner) => {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/\r/g, "")
      .trim();
    if (text && !blocks.some((b) => b.code === text))
      blocks.push({ code: text, lang: null });
    return "\n\n__CODE_BLOCK_PLACEHOLDER__\n\n";
  });

  return { cleaned, blocks };
}

/**
 * Twilio-specific "Copy code block" noisy extraction.
 * Strategy:
 *  - find "Copy code block" tokens,
 *  - from there, inspect following lines and skip obvious CSS lines (contain '{' '}' or css-),
 *  - find the first contiguous run that looks like code (contains code-like tokens) or fallback to the first few non-css lines.
 */
function extractTwilioCopyBlocks(content) {
  const blocks = [];
  let cleaned = content;
  const token = "copy code block";
  let cursor = 0;
  const lowerContent = content.toLowerCase();

  while (true) {
    const idx = lowerContent.indexOf(token, cursor);
    if (idx === -1) break;

    // determine a reasonable slice region after idx
    // try up to 1000 chars after token (should capture the nearby code)
    const start = idx;
    const endCandidate = Math.min(content.length, start + 1200);
    const slice = content.slice(start, endCandidate);

    // split slice into lines and filter CSS-like noise
    const lines = slice.split("\n").map((l) => l.replace(/\r/g, ""));
    // try to find the first line index that looks like code
    let firstCodeLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i].trim();
      if (!L) continue;
      // skip lines that are clearly CSS or UI markup
      if (
        /\{.*\}/.test(L) ||
        /css-/.test(L) ||
        /^\.?[a-z0-9\-_]+[:\s]*\{/.test(L)
      )
        continue;
      // heuristic tokens that indicate code/shell
      if (
        /(npm install|pip install|composer require|curl |wget |docker |git |node |python |php |<\\?php|console\.log|def |function |const |let |var |echo |require\(|module\.exports|#!\/)/.test(
          L.toLowerCase()
        )
      ) {
        firstCodeLine = i;
        break;
      }
    }

    // fallback: choose the first non-css, non-empty line
    if (firstCodeLine === -1) {
      for (let i = 0; i < lines.length; i++) {
        const L = lines[i].trim();
        if (!L) continue;
        if (/\{.*\}/.test(L) || /css-/.test(L)) continue;
        firstCodeLine = i;
        break;
      }
    }

    // collect up to N lines from firstCodeLine until blank or UI marker
    let codeLines = [];
    if (firstCodeLine !== -1) {
      for (let j = firstCodeLine; j < lines.length; j++) {
        const L = lines[j];
        if (!L || L.trim() === "") break;
        // stop if reaching another "Copy code block" in this slice
        if (L.toLowerCase().includes("copy code block")) break;
        // stop if line looks like a CSS block or a UI connector
        if (/\{.*\}/.test(L) && codeLines.length === 0) break;
        codeLines.push(L);
        if (codeLines.length >= 30) break; // safety cap
      }
    }

    const code = codeLines.join("\n").trim();

    if (code && code.length > 0) {
      blocks.push({ code, lang: null, contextSlice: slice.slice(0, 400) });
      // Replace the region in cleaned with placeholder to avoid leaving noisy CSS in text chunks
      // Find next double newline or end within original content for removal boundary
      const nextDoubleNL = content.indexOf("\n\n", start + 1);
      const replaceEnd =
        nextDoubleNL > -1
          ? nextDoubleNL
          : Math.min(content.length, start + 400);
      cleaned =
        cleaned.slice(0, start) +
        "\n\n__CODE_BLOCK_PLACEHOLDER__\n\n" +
        cleaned.slice(replaceEnd);
      // advance cursor
      cursor = start + "__CODE_BLOCK_PLACEHOLDER__".length;
    } else {
      // no code detected; move cursor past this token to avoid infinite loop
      cursor = start + token.length;
    }
  }

  return { cleaned, blocks };
}

/* ------------------ Text chunking ------------------ */

function chunkTextByParagraphs(text, maxChars = MAX_TEXT_CHARS) {
  if (!text || !text.trim()) return [];
  // Normalize placeholders so paragraphs split nicely
  const normalized = text.replace(
    /__CODE_BLOCK_PLACEHOLDER__/g,
    "\n\n__CODE_BLOCK_PLACEHOLDER__\n\n"
  );
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = "";

  for (const p of paragraphs) {
    // treat placeholder as its own paragraph
    if (p === "__CODE_BLOCK_PLACEHOLDER__") {
      if (buffer.trim().length > 0) {
        chunks.push(buffer.trim());
        buffer = "";
      }
      chunks.push(p);
      continue;
    }

    if ((buffer + "\n\n" + p).length <= maxChars || buffer.length === 0) {
      buffer = buffer ? buffer + "\n\n" + p : p;
    } else {
      chunks.push(buffer.trim());
      buffer = p;
    }
  }
  if (buffer.trim().length > 0) chunks.push(buffer.trim());
  // remove any placeholder-only chunks here; placeholders will be skipped later since code blocks are created separately
  return chunks.filter(Boolean);
}

/* ------------------ Main processing ------------------ */

function processDocItem(doc) {
  const fullContent = doc.content || "";
  const docCodeBlocks = Array.isArray(doc.codeBlocks)
    ? doc.codeBlocks.filter(Boolean)
    : [];

  // 1) Extract fenced markdown
  const fenced = extractFencedMarkdown(fullContent);

  // 2) Extract HTML <pre>/<code>
  const preExtract = extractHtmlCodeTags(fenced.cleaned);

  // 3) Extract Twilio-style copy blocks (works on preExtract.cleaned)
  const twilioExtract = extractTwilioCopyBlocks(preExtract.cleaned);

  // 4) Consolidate code blocks from various sources
  let codeBlocks = [
    ...fenced.blocks,
    ...preExtract.blocks,
    ...twilioExtract.blocks,
    // Filter scraped code blocks to only include substantial ones
    ...(docCodeBlocks
      .filter((c) => {
        // Only include substantial code blocks
        return (
          c &&
          c.length > 20 &&
          // Multi-line code
          (c.includes("\n") ||
            // Contains code-like patterns
            /(function|const|let|var|def |class |import |from |require|npm |pip |composer|curl|wget|echo |print|console\.log)/.test(
              c
            ) ||
            // Contains brackets or parentheses (likely code)
            /[{}();]/.test(c) ||
            // Looks like a command or path
            /^[a-z-]+\s+/.test(c) ||
            // Contains API endpoints or URLs
            /https?:\/\//.test(c) ||
            // Contains SQL-like syntax
            /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)/i.test(c) ||
            // Contains shell commands
            /^[#$>]\s/.test(c) ||
            // Contains variable assignments
            /=/.test(c))
        );
      })
      .map((c) => ({ code: c, lang: null })) || []),
  ];

  // Deduplicate by normalized code text
  const seen = new Set();
  codeBlocks = codeBlocks.filter((b) => {
    const norm = (b.code || "").replace(/\s+/g, " ").trim();
    if (!norm || norm.length < 10) return false;
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });

  // 5) Build cleaned text for chunking (use twilioExtract.cleaned as the most processed)
  const cleanedText = twilioExtract.cleaned;

  // 6) Create text chunks (including placeholders)
  const textChunksRaw = chunkTextByParagraphs(cleanedText, MAX_TEXT_CHARS);

  const textChunks = [];
  textChunksRaw.forEach((chunk) => {
    if (chunk === "__CODE_BLOCK_PLACEHOLDER__") {
      // placeholders will be skipped here because actual codeBlocks are separate
      return;
    }
    textChunks.push({
      id: makeId(doc.url || "doc", "text", textChunks.length || 0),
      url: doc.url || null,
      title: doc.title || null,
      api: doc.category || inferApiFromUrl(doc.url) || doc.api || null,
      version: extractVersion(doc) || doc.version || null,
      type: "text",
      language: "text",
      errorCodes: extractErrorCodes(chunk),
      content: chunk,
      scrapedAt: doc.scrapedAt || null,
    });
  });

  // 7) Convert codeBlocks into chunk objects with inferred language
  const codeChunks = codeBlocks.map((b, i) => {
    const fenceLang = b.lang || null;
    const surrounding = b.contextSlice || "";
    const lang = guessLanguage(fenceLang, surrounding, b.code);
    const id = makeId(doc.url || "doc", "code", i);
    return {
      id,
      url: doc.url || null,
      title: doc.title || null,
      api: doc.category || inferApiFromUrl(doc.url) || doc.api || null,
      version: extractVersion(doc) || doc.version || null,
      type: "code",
      language: lang,
      errorCodes: extractErrorCodes(b.code),
      content: b.code.trim(),
      scrapedAt: doc.scrapedAt || null,
    };
  });

  // Return combined array (text first, then code)
  return { textChunks, codeChunks };
}

/* ------------------ Simple heuristics ------------------ */

function inferApiFromUrl(url = "") {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("/sms")) return "sms";
  if (u.includes("/voice")) return "voice";
  if (u.includes("/video")) return "video";
  if (u.includes("/whatsapp")) return "whatsapp";
  if (u.includes("/errors") || u.includes("/api/errors")) return "errors";
  if (u.includes("quickstart")) return "sms_quickstart";
  return null;
}

function extractVersion(doc = {}) {
  const url = (doc.url || "").toLowerCase();
  const title = (doc.title || "").toLowerCase();
  const urlVer = url.match(/\/(v?\d{2,4}[-]?\d{0,2}[-]?\d{0,2})/i);
  if (urlVer) return urlVer[1];
  const titleVer = title.match(/\b(v\d+|version\s*\d+|v?\d{4})\b/);
  if (titleVer) return titleVer[1];
  return doc.version || null;
}

/* ------------------ Runner ------------------ */

function run() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Input file not found: ${INPUT_PATH}`);
    console.error(
      "Make sure your scraper saved scraped.json to ./data/twilio_docs/scraped.json (run 'npm run scrape' from Backend)"
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  const allChunks = [];
  const textChunks = [];
  const codeChunks = [];

  raw.forEach((doc, idx) => {
    try {
      const { textChunks: docTextChunks, codeChunks: docCodeChunks } =
        processDocItem(doc);

      // Add to separate arrays
      textChunks.push(...docTextChunks);
      codeChunks.push(...docCodeChunks);

      // Also add to combined array for backward compatibility
      allChunks.push(...docTextChunks);
      allChunks.push(...docCodeChunks);
    } catch (err) {
      console.warn(
        `⚠️ Failed processing doc ${doc.url || idx}: ${err.message || err}`
      );
    }
  });

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save separate files
  fs.writeFileSync(
    TEXT_CHUNKS_PATH,
    JSON.stringify(textChunks, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    CODE_CHUNKS_PATH,
    JSON.stringify(codeChunks, null, 2),
    "utf-8"
  );

  // Save combined file for backward compatibility
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2), "utf-8");

  console.log(`✅ chunkDoc_v2 complete:`);
  console.log(`   📄 Text chunks: ${textChunks.length} → ${TEXT_CHUNKS_PATH}`);
  console.log(`   💻 Code chunks: ${codeChunks.length} → ${CODE_CHUNKS_PATH}`);
  console.log(`   📊 Total chunks: ${allChunks.length} → ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

/* ------------------ Exports for integration ------------------ */

export {
  processDocItem,
  run as runChunking,
  makeId,
  guessLanguage,
  extractErrorCodes,
};

/* ------------------ End of file ------------------ */
