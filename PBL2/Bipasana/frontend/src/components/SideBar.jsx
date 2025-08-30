import React from "react";
import { useNavigate } from 'react-router-dom';
import { useState } from "react";

function Sidebar({ setIsLoggedIn, isLoggedIn }) 
{
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggedInState, setIsLoggedInState] = useState(false); // Demo state
  let isDark = false;

  const handleNavigation = (path) => {
      navigate(path);
    }

  const handleLogOut = ()=>{
    setIsLoggedIn(false)
    navigate('/homepage')
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 shadow-lg ${
        isCollapsed ? "w-16" : "w-64"} ${isDark ? "bg-gray-800 text-white" : "bg-gradient-to-r from-purple-200 to-pink-300 text-gray-800"}`}
    >
      {/* Header with MemoNest Logo and Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <img src="/logo.png" alt="logo" />
            </div>
            <span className="font-bold text-lg pr-4">MemoNest</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-pink-200 ${
            isCollapsed ? "mx-auto" : ""
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      {isLoggedInState ? (
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => handleNavigation('/homepage')}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!isCollapsed && <span>Home</span>}
            </button>

            <button
              onClick={() => handleNavigation('/Quotes')}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {!isCollapsed && <span>Quotes</span>}
            </button>

            <button
              onClick={() => handleNavigation('/About')}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!isCollapsed && <span>About</span>}
            </button>

            <button
              onClick={() => handleNavigation('/journals')}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {!isCollapsed && <span>Journals</span>}
            </button>
          </div>
        </nav>
      ) : (
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                handleNavigation('/login');
                setIsLoggedInState(true);
              }}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span>Login</span>}
            </button>

            <button
              onClick={() => {
                handleNavigation('/signup');
                // Demo: Toggle login state when clicking Sign Up for demonstration
                setIsLoggedInState(true);
              }}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors text-left ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {!isCollapsed && <span>Sign Up</span>}
            </button>
          </div>
        </nav>
      )}

      {/* Bottom Section with Theme Toggle, Profile, and Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Theme Toggle */}
        <button
          className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors mb-2 ${
            isDark
              ? "text-white hover:bg-gray-800"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {/* Sun/Moon Icon based on theme */}
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {!isCollapsed && <span>Theme</span>}
        </button>

        {isLoggedInState && (
          <>
            {/* Profile */}
            <button
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors mb-2 ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              {!isCollapsed && <span>Profile</span>}
            </button>

            {/* Logout */}
            <button
              onClick={() => setIsLoggedInState(!isLoggedInState)}
              className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span onClick={handleLogOut} >Logout</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;