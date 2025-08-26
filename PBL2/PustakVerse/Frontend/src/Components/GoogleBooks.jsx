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

  const addBook = (book) => {
    if (!books.some((b) => b.id === book.id)) {
      setBooks([...books, book]);
    }
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
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded"
        >
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
                className="border rounded-lg p-4 shadow bg-white cursor-pointer hover:shadow-lg"
                onClick={() => addBook(b)}
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
                <p className="text-xs text-gray-400 mt-1">Click to add</p>
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
                className="border rounded-lg p-4 shadow bg-white cursor-pointer hover:shadow-lg"
                onClick={() => addBook(b)}
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
                <p className="text-xs text-gray-400 mt-1">Click to add</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleBooks;
