// Components/GoogleBooks.jsx
import React, { useState, useEffect } from "react";
import { authFetch, handleApiError } from "../utils/api";

const normalizeGoogleBook = (volume) => {
  const v = volume || {};
  const info = v.volumeInfo || {};
  return {
    id: v.id,
    title: info.title || "Untitled",
    authors: info.authors || [],
    thumbnail:
      (info.imageLinks &&
        (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) ||
      "",
    description: info.description || "",
    categories: info.categories || [],
    publishedDate: info.publishedDate || "",
    averageRating: info.averageRating || null,
    raw: v,
  };
};

const GoogleBooks = ({ books, setBooks }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingBooks, setAddingBooks] = useState(new Set());
  const [error, setError] = useState("");

  // Clear results when input is empty
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
    }
  }, [query]);

  const fetchBooks = async (searchQuery) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchQuery
        )}&maxResults=10`
      );
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const normalized = items.map(normalizeGoogleBook);
      setResults(normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch books from Google Books API");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchBooks(query);
  };

  const addBook = async (book) => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add books to your collection");
      return;
    }

    if (books.some((b) => b.googleId === book.id || b._id === book.id)) {
      alert("Book already in your collection!");
      return;
    }

    setAddingBooks((prev) => new Set(prev).add(book.id));
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", book.title);
      formData.append("author", book.authors.join(", "));
      formData.append(
        "genre",
        JSON.stringify(
          book.categories.length > 0 ? book.categories : ["General"]
        )
      );
      formData.append(
        "year",
        book.publishedDate
          ? parseInt(book.publishedDate.split("-")[0])
          : new Date().getFullYear()
      );
      formData.append(
        "description",
        book.description.length > 500
          ? book.description.slice(0, 500) + "..."
          : book.description
      );
      formData.append("rating", book.averageRating || 0);
      formData.append("favorite", false);
      formData.append("source", "online");
      formData.append("googleId", book.id);

      if (book.thumbnail) {
        formData.append("coverUrl", book.thumbnail);
      }

      // Use authFetch for authenticated requests
      const res = await authFetch("http://localhost:3001/api/books", {
        method: "POST",
        body: formData,
      });

      // Handle API errors
      await handleApiError(res);

      const savedBook = await res.json();
      setBooks((prev) => [...prev, savedBook]);
      alert("Book added to your collection!");
    } catch (error) {
      console.error("Error adding book:", error);
      setError(error.message || "Failed to add book. Please try again.");
    } finally {
      setAddingBooks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  const toggleFavorite = async (book) => {
    try {
      const existingBook = books.find((b) => b.googleId === book.id);
      if (!existingBook) return;

      const formData = new FormData();
      formData.append("title", existingBook.title);
      formData.append("author", existingBook.author);
      formData.append("genre", JSON.stringify(existingBook.genre));
      formData.append("year", existingBook.year);
      formData.append("description", existingBook.description);
      formData.append("rating", existingBook.rating);
      formData.append("favorite", !existingBook.favorite);
      formData.append("source", existingBook.source);
      formData.append("googleId", existingBook.googleId);

      // Use authFetch for authenticated requests
      const res = await authFetch(
        `http://localhost:3001/api/books/${existingBook._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      // Handle API errors
      await handleApiError(res);

      const savedBook = await res.json();
      setBooks((prevBooks) =>
        prevBooks.map((b) => (b._id === savedBook._id ? savedBook : b))
      );
    } catch (error) {
      console.error("Error updating favorite:", error);
      setError("Failed to update favorite status.");
    }
  };

  const BookCard = ({ book }) => {
    const isInCollection = books.some((b) => b.googleId === book.id);
    const bookInCollection = books.find((b) => b.googleId === book.id);
    const isAdding = addingBooks.has(book.id);

    return (
      <div className="border rounded-lg p-4 shadow bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-40 object-cover rounded"
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded text-gray-500 dark:text-gray-400">
            No cover
          </div>
        )}
        <h3 className="font-semibold mt-2 truncate text-gray-900 dark:text-white">
          {book.title}
        </h3>
        {book.authors.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {book.authors.join(", ")}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          {!isInCollection ? (
            <button
              onClick={() => addBook(book)}
              disabled={isAdding}
              className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isAdding ? "Adding..." : "Add to Collection"}
            </button>
          ) : (
            <button
              onClick={() => toggleFavorite(book)}
              className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                bookInCollection?.favorite
                  ? "bg-pink-500 text-white hover:bg-pink-600"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {bookInCollection?.favorite
                ? "Remove from Favorites"
                : "Add to Favorites"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Google Books..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-4 py-2 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Show search results */}
      {results.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">
            Search Results
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleBooks;
