// Components/Browse.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BookGrid from "./BookGrid";

const Browse = ({ books, setBooks }) => {
  const { category } = useParams(); // Get category from URL
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categoryTitle, setCategoryTitle] = useState("");

  // ADDED: Filter books based on category
  useEffect(() => {
    if (!books || books.length === 0) {
      setFilteredBooks([]);
      return;
    }

    let filtered = [];
    let title = "";

    switch (category) {
      case "all":
        filtered = books;
        title = "All Books";
        break;
      case "favorites":
        filtered = books.filter((book) => book.favorite);
        title = "Favorite Books";
        break;
      case "recent":
        // Sort by createdAt if available, otherwise use reverse ID order
        filtered = [...books]
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // Fallback to reverse order if no timestamps
            return books.indexOf(b) - books.indexOf(a);
          })
          .slice(0, 20); // Show last 20 books
        title = "Recent Reads";
        break;
      case "fiction":
      case "non-fiction":
      case "science":
      case "fantasy":
      case "biography":
      case "mystery":
      case "self-help":
        // Filter by genre (case-insensitive)
        const genreName = category.replace("-", " "); // Convert "non-fiction" to "non fiction"
        filtered = books.filter(
          (book) =>
            book.genre &&
            book.genre.some((g) =>
              g.toLowerCase().includes(genreName.toLowerCase())
            )
        );
        title = `${category
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")} Books`;
        break;
      default:
        filtered = books;
        title = "All Books";
    }

    setFilteredBooks(filtered);
    setCategoryTitle(title);
  }, [category, books]);

  // ADDED: Category statistics
  const getCategoryStats = () => {
    if (!books || books.length === 0) return {};

    return {
      total: books.length,
      favorites: books.filter((b) => b.favorite).length,
      fiction: books.filter((b) =>
        b.genre?.some((g) => g.toLowerCase().includes("fiction"))
      ).length,
      nonFiction: books.filter((b) =>
        b.genre?.some((g) => g.toLowerCase().includes("non-fiction"))
      ).length,
      avgRating: (
        books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length
      ).toFixed(1),
    };
  };

  const stats = getCategoryStats();

  if (!books) return <p className="text-gray-500">Loading books...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* ADDED: Category header with stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{categoryTitle}</h1>

        {/* ADDED: Category description and stats */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {filteredBooks.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category === "all" ? "Total Books" : "Books in Category"}
              </p>
            </div>
            {category === "all" && (
              <>
                <div>
                  <p className="text-2xl font-bold text-pink-500">
                    {stats.favorites}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Favorites
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    {stats.avgRating}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Rating
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.fiction + stats.nonFiction}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Genres
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ADDED: Category description */}
        <div className="mb-6">
          {category === "favorites" && (
            <p className="text-gray-600 dark:text-gray-400">
              Your most loved books, marked as favorites ❤️
            </p>
          )}
          {category === "recent" && (
            <p className="text-gray-600 dark:text-gray-400">
              Recently added books to your collection
            </p>
          )}
          {category === "all" && (
            <p className="text-gray-600 dark:text-gray-400">
              Your complete book collection
            </p>
          )}
          {!["favorites", "recent", "all"].includes(category) && (
            <p className="text-gray-600 dark:text-gray-400">
              Books in the {categoryTitle.toLowerCase()} category
            </p>
          )}
        </div>
      </div>

      {/* ADDED: Books display */}
      {filteredBooks.length > 0 ? (
        <BookGrid books={filteredBooks} setBooks={setBooks} />
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No books found in {categoryTitle.toLowerCase()}
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {category === "favorites"
              ? "Mark some books as favorites to see them here!"
              : `Add some ${categoryTitle.toLowerCase()} to your collection.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Browse;
