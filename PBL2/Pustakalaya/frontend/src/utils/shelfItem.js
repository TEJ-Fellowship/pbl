//format or make the book look goodfor display
export function formatBookForDisplay(book) {
  if (!book) return null;
  const id = book.id != null ? String(book.id).trim() : "";
  if (!id) return null;
  const title = typeof book.title === "string" ? book.title.trim() : "";
  const author =
    typeof book.author === "string" ? book.author.trim() : "Unknown author";
  const coverImage =
    typeof book.coverImage === "string" && book.coverImage.trim()
      ? book.coverImage.trim()
      : "https://placehold.co/240x360/e2e8f0/64748b?text=No+cover";
  return { id, title, author, coverImage };
}

//check if the value is a valid shelf item
export function isShelfItem(value) {
  if (!value || typeof value !== "object") return false;
  const o = value;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.title === "string" &&
    typeof o.author === "string" &&
    typeof o.coverImage === "string"
  );
}
