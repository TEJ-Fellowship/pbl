// Text cleaning utilities for scraped HTML/text

export function cleanHtmlText(raw) {
  if (!raw) return "";
  // Normalize line breaks and spaces
  let text = raw
    .replace(/\r\n|\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ") // nbsp
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  // Collapse multiple spaces
  text = text.replace(/ {2,}/g, " ");
  return text.trim();
}

export function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$|\.$/g, "");
}


