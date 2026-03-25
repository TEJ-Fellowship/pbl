/**
 * Maps Google Books API volume objects to UI-friendly DTOs (Data Transfer Objects).
 * DTOs are objects that are used to transfer data between the client and the server without exposing the internal data structure of the API or vendor specific fields.
 * e.g. Google Books API returns a volume object with a lot of fields, but we only need to return the id, title, author, category, cover image, rating, review count, and status badge.
 * @see https://developers.google.com/books/docs/v1/using
 */

/** A placeholder cover image to use when the book has no cover image. */
const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";

/** Picks the first category from the volumeInfo. */
function pickCategory(volumeInfo) {
  const cats = volumeInfo?.categories;
  if (Array.isArray(cats) && cats.length > 0) return cats[0];
  return "General";
}

/** Maps a Google Books API volume object to a book DTO. */
function mapVolumeToBookDto(volume) {
  const id = volume?.id;
  const vi = volume?.volumeInfo || {};

  const authors = vi.authors;
  const author =
    Array.isArray(authors) && authors.length > 0
      ? authors.join(", ")
      : "Unknown";

  const img =
    vi.imageLinks?.thumbnail ||
    vi.imageLinks?.smallThumbnail ||
    PLACEHOLDER_COVER;

  const rating = vi.averageRating ?? null;
  const reviewCount = vi.ratingsCount ?? 0;

  return {
    id,
    title: vi.title || "Untitled",
    author,
    category: pickCategory(vi),
    coverImage: img.replace(/^http:\/\//i, "https://"),
    isFavorite: false,
    description: vi.description || "",
    rating,
    reviewCount,
    statusBadge: rating != null && rating >= 4 ? "Popular" : "",
  };
}

/** Maps a Google Books API search payload to a book DTO. */
function mapSearchPayloadToDto(googlePayload) {
  const items = googlePayload?.items || [];
  return { books: items.map(mapVolumeToBookDto) };
}

/** Single-volume API returns volume fields at top level (no `volume` wrapper). */
function mapDetailPayloadToDto(googlePayload) {
  const wrapped = {
    id: googlePayload.id,
    volumeInfo: googlePayload.volumeInfo,
  };
  return { book: mapVolumeToBookDto(wrapped) };
}

module.exports = {
  mapVolumeToBookDto,
  mapSearchPayloadToDto,
  mapDetailPayloadToDto,
};
