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

const Navbar = ({
  darkMode,
  setDarkMode,
  books,
  setBooks,
  user,
  setUser,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showBrowseMenu, setShowBrowseMenu] = useState(false);

  const handleSearchClick = () => navigate("/search");
  const handleBrowseClick = (category) => {
    navigate(`/browse/${category}`);
    setShowBrowseMenu(false);
  };

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
        darkMode ? "bg-dark text-light" : "bg-light text-black"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-8 py-4">
        {/* Left: Logo + Links */}
        <div className="flex items-center gap-8">
          <div
            className="text-primary font-extrabold text-3xl tracking-wide cursor-pointer select-none transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            PV
          </div>

          <ul className="flex gap-6 font-medium text-black dark:text-light">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary underline decoration-primary font-semibold"
                    : "text-black dark:text-light hover:text-primary transition-colors"
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
                    ? "text-primary underline decoration-primary font-semibold"
                    : "text-black dark:text-light hover:text-primary transition-colors"
                }
              >
                Favorites
              </NavLink>
            </li>

            {/* Browse Dropdown */}
            <li className="relative">
              <button
                onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                className="flex items-center gap-1 text-black dark:text-light hover:text-primary transition-colors font-medium"
              >
                Browse
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    showBrowseMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showBrowseMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-light dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {browseCategories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleBrowseClick(category.value)}
                        className="w-full text-left px-4 py-2 text-sm text-black dark:text-light hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          {/* Search */}
          <button
            onClick={handleSearchClick}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Search books"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-black dark:text-light" />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <SunIcon className="w-5 h-5 text-primary" />
            ) : (
              <MoonIcon className="w-5 h-5 text-black" />
            )}
          </button>

          {/* Add New Book */}
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 
      bg-primary text-black 
      px-6 py-2 
      rounded-full font-medium 
      shadow-sm hover:shadow-md 
      hover:bg-yellow-500 
      transition-colors duration-200
      dark:bg-primary dark:hover:bg-yellow-500"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-sm tracking-wide">Add New</span>
            </button>
          )}

          {/* Authentication / Profile */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 bg-primary text-black font-medium rounded-full hover:bg-yellow-500 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-1.5 bg-primary text-black font-medium rounded-full hover:bg-yellow-500 transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Profile name styled as text, not button */}
                <span
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200 hover:text-yellow-500 transition-colors"
                >
                  {user.username}
                </span>
                {/* Logout hidden for now */}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay for browse menu click outside */}
      {showBrowseMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBrowseMenu(false)}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-light dark:bg-dark p-6 rounded shadow-lg w-full max-w-md"
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
