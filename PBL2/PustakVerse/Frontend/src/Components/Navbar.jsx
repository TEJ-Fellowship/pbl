import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { SunIcon, MoonIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

const Navbar = ({ darkMode, setDarkMode, onAddClick }) => {
  const navigate = useNavigate();

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
          </ul>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
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

          <div className="relative">
            <input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-1 rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-800 dark:text-gray-200 transition-colors"
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          </div>

          <button
            onClick={onAddClick} // App controls the form
            className="flex items-center gap-2 bg-primary text-white px-4 py-1 rounded-full font-semibold hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add New
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
