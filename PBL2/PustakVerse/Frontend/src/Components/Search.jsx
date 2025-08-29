// Components/Search.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BookGrid from "./BookGrid";

const Search = ({ books, setBooks }) => {
  // ADDED: Get URL search parameters
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const queryFromUrl = urlParams.get("q") || "";

  // ADDED: State for search functionality
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    title: true,
    author: true,
    genre: true,
    year: false,
    description: false,
  });

  // ADDED: Effect to filter books based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBooks([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = books.filter((book) => {
      // ADDED: Search logic for different fields based on active filters
      const matchTitle =
        searchFilters.title && book.title?.toLowerCase().includes(query);

      const matchAuthor =
        searchFilters.author && book.author?.toLowerCase().includes(query);

      const matchGenre =
        searchFilters.genre &&
        book.genre?.some((g) => g.toLowerCase().includes(query));

      const matchYear =
        searchFilters.year && book.year?.toString().includes(query);

      const matchDescription =
        searchFilters.description &&
        book.description?.toLowerCase().includes(query);

      // ADDED: Return true if any of the active filters match
      return (
        matchTitle || matchAuthor || matchGenre || matchYear || matchDescription
      );
    });

    setFilteredBooks(filtered);
  }, [searchQuery, books, searchFilters]);

  // ADDED: Handle filter toggle
  const toggleFilter = (filterName) => {
    setSearchFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // ADDED: Clear search function
  const clearSearch = () => {
    setSearchQuery("");
    setFilteredBooks([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Search Books
        </h1>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, author, genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-3 text-base sm:text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search in:
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {Object.entries(searchFilters).map(([filterName, isActive]) => (
              <button
                key={filterName}
                onClick={() => toggleFilter(filterName)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-black"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {filterName.charAt(0).toUpperCase() + filterName.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm sm:text-base">
              {filteredBooks.length > 0
                ? `Found ${filteredBooks.length} book${
                    filteredBooks.length === 1 ? "" : "s"
                  } matching "${searchQuery}"`
                : `No books found matching "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {searchQuery ? (
        filteredBooks.length > 0 ? (
          <BookGrid books={filteredBooks} setBooks={setBooks} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              No books found matching your search
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try different keywords or adjust your filters
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            Start typing to search through your collection
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            You can search by title, author, genre, and more
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
