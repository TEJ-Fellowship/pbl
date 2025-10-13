import React from "react";

const Header = () => {
  return (
    <header className="absolute top-0 right-0 p-6 z-10 flex justify-end items-start">
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
