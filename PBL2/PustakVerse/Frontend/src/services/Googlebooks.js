// src/services/googleBooks.js
export const fetchBooksFromGoogle = async (query) => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to fetch from Google Books API");
    const data = await res.json();

    return (
      data.items?.map((item) => ({
        _id: item.id,
        title: item.volumeInfo.title || "No Title",
        author: item.volumeInfo.authors?.join(", ") || "Unknown",
        genre: item.volumeInfo.categories || ["Uncategorized"],
        year: item.volumeInfo.publishedDate?.split("-")[0] || "N/A",
        rating: item.volumeInfo.averageRating || 0,
        cover: item.volumeInfo.imageLinks?.thumbnail || null,
        favorite: false,
      })) || []
    );
  } catch (err) {
    console.error(err);
    return [];
  }
};
