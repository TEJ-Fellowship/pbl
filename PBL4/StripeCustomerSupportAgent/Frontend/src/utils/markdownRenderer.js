import MarkdownIt from "markdown-it";

// Initialize markdown-it with minimal configuration
const md = new MarkdownIt({
  html: true, // Allow HTML tags in markdown
  linkify: true, // Automatically convert URLs to links
  typographer: true, // Enable smart quotes and other typographic replacements
  breaks: true, // Convert line breaks to <br>
});

// Custom renderer for code blocks to maintain styling
md.renderer.rules.code_block = function (tokens, idx) {
  const token = tokens[idx];
  return `<pre class="bg-gray-800 p-3 rounded-lg overflow-x-auto"><code class="text-sm">${token.content}</code></pre>`;
};

md.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : "";
  const langName = info ? info.split(/\s+/g)[0] : "";

  return `<pre class="bg-gray-800 p-3 rounded-lg overflow-x-auto"><code class="text-sm language-${langName}">${token.content}</code></pre>`;
};

// Function to render markdown to HTML
export const renderMarkdown = (text) => {
  if (!text) return "";
  return md.render(text);
};

// Function to check if text contains markdown
export const hasMarkdown = (text) => {
  if (!text) return false;
  // Simple check for common markdown patterns
  const markdownPatterns = [
    /#{1,6}\s/, // Headers
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Inline code
    /```[\s\S]*?```/, // Code blocks
    /^\s*[-*+]\s/m, // Lists
    /^\s*\d+\.\s/m, // Numbered lists
    /\[.*?\]\(.*?\)/, // Links
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
};
