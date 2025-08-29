// Components/Browse.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BookGrid from "./BookGrid";

const Browse = ({ books, setBooks }) => {
  const { category } = useParams(); // Get category from URL
  const navigate = useNavigate();
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
        filtered = [...books]
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return books.indexOf(b) - books.indexOf(a);
          })
          .slice(0, 20);
        title = "Recent Reads";
        break;
      case "fiction":
      case "non-fiction":
      case "science":
      case "fantasy":
      case "biography":
      case "mystery":
      case "self-help":
        const genreName = category.replace("-", " ");
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

  // Category buttons
  const browseCategories = [
    { name: "All Books", value: "all" },
    { name: "Favorites", value: "favorites" },
    { name: "Recent Reads", value: "recent" },
    { name: "Fiction", value: "fiction" },
    { name: "Non-Fiction", value: "non-fiction" },
    { name: "Science", value: "science" },
    { name: "Fantasy", value: "fantasy" },
    { name: "Biography", value: "biography" },
    { name: "Mystery", value: "mystery" },
    { name: "Self-Help", value: "self-help" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Category filter bar */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-3 md:gap-4">
          {browseCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => navigate(`/browse/${cat.value}`)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                category === cat.value
                  ? "bg-primary text-black"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-light hover:bg-yellow-500 dark:hover:bg-yellow-500"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category header with stats */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 text-gray-900 dark:text-white tracking-tight">
          {categoryTitle}
        </h1>

        {/* Category description and stats */}
        {/* Category description and stats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="transition-transform hover:scale-105 duration-200">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {filteredBooks.length}
              </p>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                {category === "all" ? "Total Books" : "Books in Category"}
              </p>
            </div>
            {category === "all" && (
              <>
                <div className="transition-transform hover:scale-105 duration-200">
                  <p className="text-3xl md:text-4xl font-bold text-pink-500">
                    {stats.favorites}
                  </p>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                    Favorites
                  </p>
                </div>
                <div className="transition-transform hover:scale-105 duration-200">
                  <p className="text-3xl md:text-4xl font-bold text-blue-500">
                    {stats.avgRating}
                  </p>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                    Avg Rating
                  </p>
                </div>
                <div className="transition-transform hover:scale-105 duration-200">
                  <p className="text-3xl md:text-4xl font-bold text-green-500">
                    {stats.fiction + stats.nonFiction}
                  </p>
                  <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                    Genres
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category description */}
        <div className="mb-6">
          {category === "favorites" && (
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
              Your most loved books, marked as favorites ❤️
            </p>
          )}
          {category === "recent" && (
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
              Recently added books to your collection
            </p>
          )}
          {category === "all" && (
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
              Your complete book collection
            </p>
          )}
          {!["favorites", "recent", "all"].includes(category) && (
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
              Books in the {categoryTitle.toLowerCase()} category
            </p>
          )}
        </div>
      </div>

      {/* Books display */}
      {filteredBooks.length > 0 ? (
        <BookGrid books={filteredBooks} setBooks={setBooks} />
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-300 dark:text-gray-600 text-7xl mb-4 animate-bounce">
            📚
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No books found in {categoryTitle.toLowerCase()}
          </h3>
          <p className="text-gray-500 dark:text-gray-500 text-lg">
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
