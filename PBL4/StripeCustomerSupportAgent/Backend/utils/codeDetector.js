// Code detection utilities for advanced chunking
export class CodeDetector {
  constructor() {
    this.codePatterns = {
      javascript: /```(?:js|javascript)\s*\n([\s\S]*?)```/gi,
      python: /```(?:py|python)\s*\n([\s\S]*?)```/gi,
      curl: /```(?:bash|sh|curl)\s*\n([\s\S]*?)```/gi,
      json: /```(?:json)\s*\n([\s\S]*?)```/gi,
      xml: /```(?:xml)\s*\n([\s\S]*?)```/gi,
      generic: /```(\w+)?\s*\n([\s\S]*?)```/gi,
    };
  }

  // Detect programming language from code block
  detectLanguage(codeBlock) {
    const lines = codeBlock.split("\n");
    const firstLine = lines[0]?.trim();

    // Check for language hints
    if (firstLine?.includes("curl") || firstLine?.includes("$")) return "bash";
    if (firstLine?.includes("import") && firstLine?.includes("stripe"))
      return "python";
    if (firstLine?.includes("const") || firstLine?.includes("require"))
      return "javascript";
    if (firstLine?.includes("{") && firstLine?.includes("}")) return "json";

    return "unknown";
  }

  // Extract all code blocks from content
  extractCodeBlocks(content) {
    const codeBlocks = [];

    for (const [lang, pattern] of Object.entries(this.codePatterns)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const code = match[2] || match[1];
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

  // Remove code blocks from content
  removeCodeBlocks(content) {
    let cleanContent = content;
    for (const pattern of Object.values(this.codePatterns)) {
      cleanContent = cleanContent.replace(pattern, "[CODE_BLOCK_REMOVED]");
    }
    return cleanContent;
  }
}
