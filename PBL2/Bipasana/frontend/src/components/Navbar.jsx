import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { ThemeContext } from "../ThemeContext";
function Navbar() {
  const { isDark, handleToggle } = useContext(ThemeContext);
  const { setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogin = () => {
    if (!setIsLoggedIn) {
      handleNavigation("/login");
    }
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
              <div className="h-12 w-28 flex items-center justify-center">
                <img src={isDark?'invLogo.png':'logo.png'} alt="logo" />
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
              onClick={handleToggle}
              className={`p-2 rounded-lg transition-colors`}
            >
              <img 
              src={isDark?'/streakdark.png':'brightness.png'}
              alt="theme icon"
              className="w-6 h-6 flex-shrink-0" />
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
