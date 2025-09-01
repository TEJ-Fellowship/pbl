import React, { useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import { AuthContext } from "../AuthContext";

function Sidebar() {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  let isDark = false;

  const handleNavigation = (path) => {
    navigate(path);
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 shadow-lg ${
        isCollapsed ? "w-20" : "w-56"
      } ${
        isDark ? "bg-gray-800 text-white" : "bg-gradient-to-b from-purple-200 to-pink-300 text-gray-800"
      }`}
    >
      {/* Header with MemoNest Logo and Collapse Button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-400/30">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-black rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
            <span className="font-bold text-xl text-gray-800">MemoNest</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 hover:bg-black/10 rounded ${isCollapsed ? "mx-auto" : ""}`}
        >
          <svg 
            className={`w-6 h-6 text-gray-700 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-6">
        <div className="space-y-4">
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {!isCollapsed &&   <span className="text-gray-700 font-medium">Home</span>}
          
          </button>

          <button
            onClick={() => handleNavigation('/quotes')}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!isCollapsed &&  <span className="text-gray-700 font-medium">Quotes</span> }
           
          </button>

          <button
            onClick={() => handleNavigation('/about')}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {!isCollapsed && <span className="text-gray-700 font-medium">About</span>}
            
          </button>

          <button
            onClick={() => handleNavigation('/journals')}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {!isCollapsed &&  <span className="text-gray-700 font-medium">Journals</span>}
          </button>
        </div>
      </nav>

      {/* Bottom Section with Theme Toggle, Profile, and Logout */}
      <div className="border-t border-gray-400/30 p-6">
        <div className="space-y-4">
          {/* Theme Toggle */}
          <button
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {!isCollapsed && <span className="text-gray-700 font-medium">Theme</span>}
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavigation('/profile')}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            {!isCollapsed && <span className="text-gray-700 font-medium">Profile</span>}
            
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              handleLogout();
              // setIsLoggedInState(false);
            }}
            className="flex items-center space-x-4 w-full px-4 py-3 rounded-lg transition-colors text-left hover:bg-black/10"
          >
            <svg className="w-6 h-6 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="text-gray-700 font-medium">Logout</span>}
            
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;