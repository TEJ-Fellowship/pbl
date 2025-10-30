// 🔍 Code detection utilities for advanced chunking
export class CodeDetector {
  constructor() {
    // Match fenced code blocks by language
    this.codePatterns = {
      python: /```(?:py|python)\s*\n([\s\S]*?)```/gi,
      javascript: /```(?:js|javascript|node)\s*\n([\s\S]*?)```/gi,
      java: /```(?:java)\s*\n([\s\S]*?)```/gi,
      csharp: /```(?:csharp|c#|cs)\s*\n([\s\S]*?)```/gi,
      php: /```(?:php)\s*\n([\s\S]*?)```/gi,
      ruby: /```(?:ruby|rb)\s*\n([\s\S]*?)```/gi,
      curl: /```(?:bash|sh|curl)\s*\n([\s\S]*?)```/gi,
      generic: /```(\w+)?\s*\n([\s\S]*?)```/gi, // fallback for unknown types
    };
  }

  // 🧠 Detect programming language from a code block’s content
  detectLanguage(codeBlock) {
    const lines = codeBlock.split("\n");
    const firstLine = lines[0]?.trim();

    // --- Curl / Shell ---
    if (/^curl\b|^\$/.test(firstLine)) return "curl";

    // --- Python ---
    if (/^import\b|^def\b|^class\b/.test(firstLine) || codeBlock.includes("print("))
      return "python";

    // --- JavaScript / Node.js ---
    if (
      /^(const|let|var|import)\b/.test(firstLine) ||
      codeBlock.includes("require(") ||
      codeBlock.includes("=>")
    )
      return "javascript";

    // --- C# ---
    if (
      /using\s+System/.test(codeBlock) ||
      /public\s+(class|static|void)/.test(codeBlock)
    )
      return "csharp";

    // --- PHP ---
    if (codeBlock.includes("<?php") || /\$\w+\s*=/.test(codeBlock))
      return "php";

    // --- Ruby ---
    if (
      codeBlock.includes("puts ") ||
      /^def\s+/.test(firstLine) ||
      codeBlock.includes("end")
    )
      return "ruby";

    // --- Java ---
    if (
      codeBlock.includes("public class") ||
      codeBlock.includes("System.out.println") ||
      codeBlock.includes("void main")
    )
      return "java";

    return "unknown";
  }

  // 🧱 Extract all code blocks from a markdown-like document
  extractCodeBlocks(content) {
    const codeBlocks = [];

    for (const [lang, pattern] of Object.entries(this.codePatterns)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Some regexes capture in group 1, some in group 2
        const code = match[2] || match[1];
        if (!code) continue;

        const detectedLang = this.detectLanguage(code);

        codeBlocks.push({
          code: code.trim(),
          language: detectedLang,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          originalMatch: match[0],
        });
      }
    }

    return codeBlocks;
  }

  // 🧹 Remove code blocks from text while marking their positions
  removeCodeBlocks(content) {
    let cleanContent = content;
    for (const pattern of Object.values(this.codePatterns)) {
      cleanContent = cleanContent.replace(pattern, "[CODE_BLOCK_REMOVED]");
    }
    return cleanContent;
  }
}
