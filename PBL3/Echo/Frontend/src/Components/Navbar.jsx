// src/Components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiLogOut, FiHome, FiUsers, FiMenu, FiX } from "react-icons/fi";

const Navbar = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/30 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo / Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/home")}
        >
          <div className="w-10 h-10 rounded-full  flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform duration-300 w-14 h-14">
            <img src="/logo.svg" alt="logo" />
          </div>
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight"></div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/home"
            className={`relative px-3 py-2 rounded-lg transition-all duration-300 group flex items-center gap-2 ${
              isActiveRoute("/home")
                ? "text-white bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <FiHome className="text-lg" />
            <span className="relative z-10">Home</span>
            {isActiveRoute("/home") && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg"></div>
            )}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-full"></div>
          </Link>

          <Link
            to="/rooms"
            className={`relative px-3 py-2 rounded-lg transition-all duration-300 group flex items-center gap-2 ${
              isActiveRoute("/rooms")
                ? "text-white bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <FiUsers className="text-lg" />
            <span className="relative z-10">Rooms</span>
            {isActiveRoute("/rooms") && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg"></div>
            )}
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-full"></div>
          </Link>
        </div>

        {/* Desktop Logout Button */}
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
        >
          <FiLogOut className="text-base" />
          Logout
        </button>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <FiX className="text-2xl" />
          ) : (
            <FiMenu className="text-2xl" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-b border-slate-700/30 md:hidden">
            <div className="flex flex-col p-4 gap-2">
              <Link
                to="/home"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActiveRoute("/home")
                    ? "text-white bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                    : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiHome className="text-lg" />
                Home
              </Link>

              <Link
                to="/rooms"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActiveRoute("/rooms")
                    ? "text-white bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                    : "text-gray-300 hover:text-white hover:bg-slate-700/50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FiUsers className="text-lg" />
                Rooms
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium mt-2"
              >
                <FiLogOut className="text-base" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
