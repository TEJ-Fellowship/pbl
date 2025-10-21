// Simple markdown parser for basic formatting
export function parseMarkdown(text) {
  if (!text) return "";

  return (
    text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // Auto-link bare URLs (http/https/www) - handles template variables
      .replace(/(\b(?:https?:\/\/|www\.)[^\s<]+[^<.,:;"')\]\s])/g, (match) => {
        const url = match.startsWith("http") ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      })
      // Line breaks
      .replace(/\n/g, "<br>")
      // Lists (basic)
      .replace(/^\- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
  );
}

// Backwards-compatible export used by multi-turn UI
export function renderMarkdown(text) {
  return parseMarkdown(text);
}
