import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import Form from "./Form";
import {
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const Navbar = ({ darkMode, setDarkMode, setBooks }) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  // ADDED: State for browse dropdown
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);

  // ADDED: Handle search icon click
  const handleSearchClick = () => {
    navigate("/search");
  };

  // ADDED: Handle browse menu item click
  const handleBrowseClick = (category) => {
    navigate(`/browse/${category}`);
    setShowBrowseMenu(false);
  };

  // ADDED: Browse categories
  const browseCategories = [
    { name: "All Books", value: "all" },
    { name: "Fiction", value: "fiction" },
    { name: "Non-Fiction", value: "non-fiction" },
    { name: "Science", value: "science" },
    { name: "Fantasy", value: "fantasy" },
    { name: "Biography", value: "biography" },
    { name: "Mystery", value: "mystery" },
    { name: "Self-Help", value: "self-help" },
    { name: "Favorites", value: "favorites" },
    { name: "Recent Reads", value: "recent" },
  ];

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div
      className={`sticky top-0 z-50 shadow-md transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-black"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-8 py-4">
        {/* Left: Logo + Links */}
        <div className="flex items-center gap-8">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-extrabold text-3xl tracking-wide cursor-pointer select-none transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            Pustakverse
          </div>

          <ul className="flex gap-6 font-medium text-black dark:text-gray-200">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary dark:text-primary-light underline decoration-primary font-semibold"
                    : "text-black dark:text-gray-500 hover:text-primary transition-colors"
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mybooks"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary dark:text-primary-light underline decoration-primary font-semibold"
                    : "text-black dark:text-gray-500 hover:text-primary transition-colors"
                }
              >
                MyBooks
              </NavLink>
            </li>

            {/* ADDED: Browse dropdown menu */}
            <li className="relative">
              <button
                onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                className="flex items-center gap-1 text-black dark:text-gray-500 hover:text-primary transition-colors font-medium"
              >
                Browse
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    showBrowseMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* ADDED: Browse dropdown menu */}
              {showBrowseMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {browseCategories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleBrowseClick(category.value)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* MODIFIED: Search icon instead of input */}
          <button
            onClick={handleSearchClick}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Search books"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <MoonIcon className="w-5 h-5 text-gray-800" />
            )}
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-1 rounded-full font-semibold hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add New
          </button>

          <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-gray-300 dark:border-gray-600">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </nav>

      {/* ADDED: Overlay to close browse menu when clicking outside */}
      {showBrowseMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBrowseMenu(false)}
        />
      )}

      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Form
              onClose={() => setShowForm(false)}
              onAddBook={(newBook) => setBooks((prev) => [...prev, newBook])}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
