import React, { useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import Form from "./Form";
// import logo from "";

import {
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  HomeIcon,
  BookOpenIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const Navbar = ({ darkMode, setDarkMode, books, setBooks, user, setUser }) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  const handleSearchClick = () => navigate("/search");
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
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-8 py-4">
        {/* Left section: logo + main nav links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div
            className="text-primary font-extrabold text-3xl tracking-wide cursor-pointer select-none transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            <img src="/logo.svg" alt="" className="h-10 w-auto" />
          </div>

          {/* Desktop Links */}
          <ul className="hidden md:flex gap-6 font-medium text-black dark:text-light">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "text-yellow-500 font-semibold underline decoration-yellow-500"
                    : "text-black dark:text-light hover:text-yellow-500 transition-colors"
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
            <li>
              <NavLink
                to="/browse/all"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary underline decoration-primary font-semibold"
                    : "text-black dark:text-light hover:text-primary transition-colors"
                }
              >
                Browse
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Right section: actions */}
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
              className="flex items-center gap-2 bg-primary text-black px-4 py-1.5 rounded-full font-medium shadow-sm hover:shadow-md hover:bg-yellow-500 transition-colors duration-200 dark:bg-primary dark:hover:bg-yellow-500"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-sm tracking-wide">Add New</span>
            </button>
          )}

          {/* Desktop Profile Section */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <span
                onClick={() => navigate("/profile")}
                className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200 hover:text-yellow-500 transition-colors"
              >
                {user.username}
              </span>
            </div>
          )}
          {!user && (
            <div className="hidden md:flex items-center gap-2">
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
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-light dark:bg-dark border-t border-gray-200 dark:border-gray-700 shadow-inner">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center transition-colors ${
              location.pathname === "/"
                ? "text-yellow-500 dark:text-yellow-500"
                : "text-black dark:text-light hover:text-primary dark:hover:text-yellow-500"
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-0.5">Home</span>
          </button>

          <button
            onClick={() => navigate("/mybooks")}
            className={`flex flex-col items-center transition-colors ${
              location.pathname === "/mybooks"
                ? "text-yellow-500 dark:text-yellow-500"
                : "text-black dark:text-light hover:text-primary dark:hover:text-yellow-500"
            }`}
          >
            <BookOpenIcon className="w-6 h-6" />
            <span className="text-xs mt-0.5">Favorites</span>
          </button>

          <button
            onClick={() => navigate("/browse/all")}
            className={`flex flex-col items-center transition-colors ${
              location.pathname.startsWith("/browse")
                ? "text-yellow-500 dark:text-yellow-500"
                : "text-black dark:text-light hover:text-primary dark:hover:text-yellow-500"
            }`}
          >
            <Squares2X2Icon className="w-6 h-6" />
            <span className="text-xs mt-0.5">Browse</span>
          </button>

          {user && (
            <button
              onClick={() => navigate("/profile")}
              className={`flex flex-col items-center transition-colors ${
                location.pathname === "/profile"
                  ? "text-yellow-500 dark:text-yellow-500"
                  : "text-black dark:text-light hover:text-primary dark:hover:text-yellow-500"
              }`}
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="text-xs mt-0.5">Profile</span>
            </button>
          )}
        </div>
      </div>

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
