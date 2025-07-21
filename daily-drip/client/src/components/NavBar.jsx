import { useState } from "react";
import SearchBar from './SearchBar';
import Category from "./Category";

const Navbar = ({ onSearch, onCategorySelect }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow px-4 py-3 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50">
        <div className="flex items-center w-full md:w-auto gap-3">
          <button
            className="text-2xl mr-2"
            aria-label="Open Menu"
            onClick={() => setIsPanelOpen(true)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="6" y="5" width="12" height="14" rx="2"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
            </svg>
          </button>
          <div className="text-2xl font-bold text-blue-600">
            Daily Drip
          </div>
        </div>
        <div className="mt-2 md:mt-0 w-full md:w-auto">
          <SearchBar onSearch={onSearch} />
        </div>
      </nav>
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isPanelOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-6">
          <button
            aria-label="Close Menu"
            className="mb-4"
            onClick={() => setIsPanelOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <Category
            onSelect={cat => {
              setIsPanelOpen(false);
              onCategorySelect?.(cat);
            }}
          />
        </div>
      </div>
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
