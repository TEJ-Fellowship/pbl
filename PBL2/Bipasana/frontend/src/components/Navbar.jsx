import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
function Navbar() {
  const {isDark,handleToggle}=useContext(ThemeContext)
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogin = () => {
      handleNavigation("/login");
  };

  const handleSignUp = () => {
    handleNavigation("/signup");
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full shadow-lg after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="h-8 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
            </div>
            <span className="font-bold text-xl">MemoNest</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* About Us */}
            <button
              onClick={() => handleNavigation("/about")}
              className={`rounded-md px-3 py-2 text-md font-medium transition-colors ${
                isDark
                  ? "text-white hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              About Us
            </button>

            {/* Theme Toggle */}
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "text-white hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className={`rounded-md px-4 py-2 text-md font-medium transition-colors border ${
                isDark
                  ? "text-white hover:bg-gray-700 border-gray-600"
                  : "text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              Login
            </button>

            {/* Sign Up Button */}
            <button
              onClick={handleSignUp}
              className={`rounded-md px-4 py-2 text-md font-medium transition-colors ${
                isDark
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button - Optional for responsive design */}
          <div className="sm:hidden">
            <button
              className={`p-2 rounded-lg ${
                isDark
                  ? "text-white hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
