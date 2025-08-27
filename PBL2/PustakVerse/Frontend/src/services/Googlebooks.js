// services/Googlebooks.jsx
import React, { useState, useEffect } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

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
    publishedDate: info.publishedDate || "",
    categories: info.categories || [],
    averageRating: info.averageRating || null,
    raw: v,
  };
};

const GoogleBooks = ({ books, setBooks }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defaultResults, setDefaultResults] = useState([]);

  const fetchBooks = async (searchQuery, isDefault = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchQuery
        )}&maxResults=10`
      );
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const normalized = items.map(normalizeGoogleBook);

      if (isDefault) {
        setDefaultResults(normalized);
      } else {
        setResults(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load default books on mount
  useEffect(() => {
    fetchBooks("bestsellers", true);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchBooks(query);
  };

  // UPDATED: Enhanced addBook function to handle cover images and favorites
  const addBook = async (book, addToFavorites = false) => {
    try {
      // Check if book already exists in the collection
      const existingBook = books.find(
        (b) => b.googleId === book.id || b.title === book.title
      );

      if (existingBook) {
        // If book exists, just toggle favorite status
        if (addToFavorites && !existingBook.favorite) {
          const res = await fetch(
            `http://localhost:3001/api/books/${existingBook._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...existingBook,
                favorite: true,
              }),
            }
          );

          if (res.ok) {
            const updatedBook = await res.json();
            setBooks((prev) =>
              prev.map((b) => (b._id === updatedBook._id ? updatedBook : b))
            );
          }
        }
        return;
      }

      // Prepare book data for backend
      const bookData = {
        title: book.title,
        author: book.authors.join(", ") || "Unknown",
        genre: book.categories || ["Uncategorized"],
        year: book.publishedDate
          ? parseInt(book.publishedDate.slice(0, 4))
          : null,
        description: book.description || "",
        rating: book.averageRating || null,
        favorite: addToFavorites,
        source: "google", // IMPORTANT: Mark as Google Books source
        googleId: book.id, // Store Google Books ID
      };

      // If there's a thumbnail, add the URL
      if (book.thumbnail) {
        bookData.coverUrl = book.thumbnail;
      }

      console.log("Sending book data:", bookData); // Debug log

      // Send to backend
      const res = await fetch("http://localhost:3001/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });

      if (res.ok) {
        const savedBook = await res.json();
        console.log("Book saved:", savedBook); // Debug log
        setBooks((prev) => [...prev, savedBook]);
      } else {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        throw new Error("Failed to add book");
      }
    } catch (err) {
      console.error("Error adding book:", err);
      alert("Failed to add book. Please try again.");
    }
  };

  // ADDED: Check if book is already in favorites
  const isBookInFavorites = (googleBook) => {
    return books.some(
      (b) =>
        (b.googleId === googleBook.id || b.title === googleBook.title) &&
        b.favorite
    );
  };

  // ADDED: Check if book is already added (but not necessarily favorited)
  const isBookAdded = (googleBook) => {
    return books.some(
      (b) => b.googleId === googleBook.id || b.title === googleBook.title
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Google Books..."
          className="flex-1 border rounded px-4 py-2"
        />
        <button type="submit" className="px-4 py-2 bg-black text-white rounded">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Show default popular books if no search query */}
      {defaultResults.length > 0 && results.length === 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Popular Books</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {defaultResults.map((b) => (
              <div
                key={b.id}
                className="border rounded-lg p-4 shadow bg-white hover:shadow-lg transition-shadow"
              >
                {b.thumbnail ? (
                  <img
                    src={b.thumbnail}
                    alt={b.title}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                    No cover
                  </div>
                )}
                <h3 className="font-semibold mt-2 truncate">{b.title}</h3>
                {b.authors.length > 0 && (
                  <p className="text-sm text-gray-500 truncate">
                    {b.authors.join(", ")}
                  </p>
                )}

                {/* ADDED: Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addBook(b, false)}
                    disabled={isBookAdded(b)}
                    className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                      isBookAdded(b)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isBookAdded(b) ? "Added" : "Add to Library"}
                  </button>

                  <button
                    onClick={() => addBook(b, true)}
                    className={`p-1 rounded transition-colors ${
                      isBookInFavorites(b)
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                    title={
                      isBookInFavorites(b) ? "In favorites" : "Add to favorites"
                    }
                  >
                    {isBookInFavorites(b) ? (
                      <HeartSolidIcon className="w-4 h-4" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Show search results */}
      {results.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Search Results</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {results.map((b) => (
              <div
                key={b.id}
                className="border rounded-lg p-4 shadow bg-white hover:shadow-lg transition-shadow"
              >
                {b.thumbnail ? (
                  <img
                    src={b.thumbnail}
                    alt={b.title}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded text-gray-500">
                    No cover
                  </div>
                )}
                <h3 className="font-semibold mt-2 truncate">{b.title}</h3>
                {b.authors.length > 0 && (
                  <p className="text-sm text-gray-500 truncate">
                    {b.authors.join(", ")}
                  </p>
                )}

                {/* ADDED: Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addBook(b, false)}
                    disabled={isBookAdded(b)}
                    className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
                      isBookAdded(b)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {isBookAdded(b) ? "Added" : "Add to Library"}
                  </button>

                  <button
                    onClick={() => addBook(b, true)}
                    className={`p-1 rounded transition-colors ${
                      isBookInFavorites(b)
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                    title={
                      isBookInFavorites(b) ? "In favorites" : "Add to favorites"
                    }
                  >
                    {isBookInFavorites(b) ? (
                      <HeartSolidIcon className="w-4 h-4" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleBooks;
