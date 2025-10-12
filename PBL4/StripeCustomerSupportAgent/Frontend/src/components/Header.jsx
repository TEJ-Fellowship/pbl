import React, { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    "Dashboard",
    "Analytics",
    "Reports",
    "Settings",
    "Support",
    "Profile",
  ];

  return (
    <header className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start">
      <div className="flex flex-col items-center">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-[4.5rem] bg-stone-700/80 backdrop-blur-md rounded-[0.5rem] flex flex-col items-center justify-center text-text-dark hover:bg-gray-700/80 transition-colors py-2"
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 bg-black rounded-[0.5rem] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-5xl">
                network_intelligence
              </span>
            </div>
            <div
              className="vertical-text font-display font-light text-sm tracking-widest text-text-dark"
              style={{ height: "4rem" }}
            >
              Menu
            </div>
            <div className="grid grid-cols-3 gap-0.5 w-4 pb-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-text-dark rounded-full" />
              ))}
            </div>
          </div>
        </button>

        {/* Horizontal Menu */}
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 bg-stone-700/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-600/50 transition-all duration-500 ease-in-out z-50 ${
            isMenuOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
          style={{
            transformOrigin: "top center",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 max-w-[90vw] sm:max-w-none">
            {menuItems.map((item, index) => (
              <button
                key={item}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-text-dark hover:bg-gray-600/50 transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                  isMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
                style={{
                  transitionDelay: isMenuOpen ? `${index * 100}ms` : "0ms",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="flex items-center space-x-1 px-4 py-2.5 bg-stone-700/80 backdrop-blur-sm rounded-md border border-gray-700 text-sm hover:bg-gray-700/80 font-light">
            <span>Eng</span>
            <span className="material-icons text-base">expand_more</span>
          </button>
        </div>
        <button className="px-6 py-3 bg-primary/70 text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          Sign In
        </button>
      </div>
    </header>
  );
};

export default Header;
