import React, { useState, useEffect } from "react";

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
  const [defaultResults, setDefaultResults] = useState([]);
  const [addingBooks, setAddingBooks] = useState(new Set());

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

  const addBook = async (book) => {
    // Check if book is already in collection
    if (books.some((b) => b.googleId === book.id || b._id === book.id)) {
      alert("Book already in your collection!");
      return;
    }

    setAddingBooks((prev) => new Set(prev).add(book.id));

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

      const res = await fetch("http://localhost:3001/api/books", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to add book");
      }

      const savedBook = await res.json();
      setBooks((prevBooks) => [...prevBooks, savedBook]);
      alert("Book added to your collection!");
    } catch (error) {
      console.error("Error adding book:", error);
      alert("Failed to add book. Please try again.");
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

      const res = await fetch(
        `http://localhost:3001/api/books/${existingBook._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to update favorite");

      const savedBook = await res.json();
      setBooks((prevBooks) =>
        prevBooks.map((b) => (b._id === savedBook._id ? savedBook : b))
      );
    } catch (error) {
      console.error("Error updating favorite:", error);
      alert("Failed to update favorite status.");
    }
  };

  const BookCard = ({ book }) => {
    const isInCollection = books.some((b) => b.googleId === book.id);
    const bookInCollection = books.find((b) => b.googleId === book.id);
    const isAdding = addingBooks.has(book.id);

    return (
      <div className="border rounded-lg p-4 shadow bg-white hover:shadow-lg transition-shadow">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-40 object-cover rounded"
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded text-gray-500">
            No cover
          </div>
        )}
        <h3 className="font-semibold mt-2 truncate">{book.title}</h3>
        {book.authors.length > 0 && (
          <p className="text-sm text-gray-500 truncate">
            {book.authors.join(", ")}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          {!isInCollection ? (
            <button
              onClick={() => addBook(book)}
              disabled={isAdding}
              className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isAdding ? "Adding..." : "Add to Collection"}
            </button>
          ) : (
            <button
              onClick={() => toggleFavorite(book)}
              className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                bookInCollection?.favorite
                  ? "bg-pink-500 text-white hover:bg-pink-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
            {defaultResults.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}

      {/* Show search results */}
      {results.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Search Results</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleBooks;
