import React, { useState } from "react";
import navMenu from "../constants/navMenu";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./common/ThemeToggle";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `relative px-2 py-2 text-sm md:text-base lg:text-lg font-medium transition-all duration-300 ${
      isActive ? "text-primary" : "text-text-light dark:text-text-spotlight hover:text-text-dark"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block w-full px-4 py-3 text-left text-base font-medium transition-all duration-300 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
      isActive 
        ? "text-primary bg-primary/10 dark:bg-primary/20" 
        : "text-text-light dark:text-text-spotlight hover:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="mb-6">
      {/* Mobile Header with Hamburger */}
      <div className="flex items-center justify-between md:hidden">
        <button
          className="p-2 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-text-dark mb-1 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-text-dark mb-1 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
        <ThemeToggle />
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`md:hidden ${menuOpen ? 'block' : 'hidden'}`}>
        <div className="mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {navMenu.map((menu) => (
            <NavLink 
              key={menu.route} 
              to={menu.route} 
              className={mobileNavLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              {menu.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex md:flex-row md:gap-4 lg:gap-8">
        {navMenu.map((menu) => (
          <NavLink key={menu.route} to={menu.route} className={navLinkClass}>
            {({ isActive }) => (
              <>
                {menu.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-light to-primary rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
        {/* Theme toggle for desktop */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;