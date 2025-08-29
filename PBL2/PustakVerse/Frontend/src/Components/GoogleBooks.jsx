// Components/GoogleBooks.jsx
import React, { useState, useEffect } from "react";
import { authFetch, handleApiError } from "../utils/api";
import { XMarkIcon } from "@heroicons/react/24/outline";
const normalizeGoogleBook = (volume) => {
  const v = volume || {};
  const info = v.volumeInfo || {};
  return {
    id: v.id,
    title: info.title || "Untitled",
    authors: info.authors || ["Unknown Author"],
    thumbnail:
      (info.imageLinks &&
        (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) ||
      "",
    description: info.description || "",
    categories: info.categories || ["General"],
    publishedDate: info.publishedDate || "",
    averageRating: info.averageRating || 0,
    raw: v,
  };
};

const GoogleBooks = ({ books, setBooks }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingBooks, setAddingBooks] = useState(new Set());
  const [error, setError] = useState("");

  // ADDED: Debounced dynamic search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchBooks(query);
    }, 500); // wait 0.5s after typing

    return () => clearTimeout(delayDebounce);
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

  const addBook = async (book) => {
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
        JSON.stringify(book.categories?.length ? book.categories : ["General"])
      );
      formData.append(
        "year",
        book.publishedDate
          ? parseInt(book.publishedDate.split("-")[0]) ||
              new Date().getFullYear()
          : new Date().getFullYear()
      );
      formData.append(
        "description",
        book.description?.length > 500
          ? book.description.slice(0, 500) + "..."
          : book.description || "No description available"
      );
      formData.append("rating", book.averageRating || 0);
      formData.append("favorite", false);
      formData.append("source", "online");
      formData.append("googleId", book.id);

      if (book.thumbnail) {
        formData.append("coverUrl", book.thumbnail);
      }

      const res = await authFetch("http://localhost:3001/api/books", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add book: ${res.status} ${errorText}`);
      }

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
      Object.entries({
        title: existingBook.title,
        author: existingBook.author,
        genre: JSON.stringify(existingBook.genre),
        year: existingBook.year,
        description: existingBook.description,
        rating: existingBook.rating,
        favorite: !existingBook.favorite,
        source: existingBook.source,
        googleId: existingBook.googleId,
      }).forEach(([key, val]) => formData.append(key, val));

      const res = await authFetch(
        `http://localhost:3001/api/books/${existingBook._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      await handleApiError(res);
      const savedBook = await res.json();
      setBooks((prev) =>
        prev.map((b) => (b._id === savedBook._id ? savedBook : b))
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
      <div className="border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-all flex flex-col">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400">
            No cover
          </div>
        )}
        <h3 className="font-semibold mt-3 truncate text-gray-900 dark:text-white text-base">
          {book.title}
        </h3>
        {book.authors.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {book.authors.join(", ")}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {!isInCollection ? (
            <button
              onClick={() => addBook(book)}
              disabled={isAdding}
              className="flex-1 text-xs bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isAdding ? "Adding..." : "Add to Collection"}
            </button>
          ) : (
            <button
              onClick={() => toggleFavorite(book)}
              className={`flex-1 text-xs px-3 py-2 rounded-lg transition-colors ${
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
      {/* Search input */}
      <div className="relative flex-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Google Books..."
          className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-colors"
        />

        {/* Search icon SVG */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
            />
          </svg>
        </div>

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 shadow bg-white dark:bg-gray-800 animate-pulse flex flex-col gap-3"
            >
              {/* Image placeholder */}
              <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded" />

              {/* Title placeholder */}
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded" />

              {/* Author placeholder */}
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />

              {/* Button placeholder */}
              <div className="h-6 w-full bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">
            Search Results
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      ) : (
        query && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default GoogleBooks;
