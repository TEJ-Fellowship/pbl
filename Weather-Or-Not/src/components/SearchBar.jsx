import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

const SearchBar = ({ searchItem, handleSearch, onClear }) => {
  const inputRef = useRef(null);

  // Auto-focus input when mounted (better UX)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative max-w-md mx-auto">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a city..."
        value={searchItem}
        onChange={handleSearch}
        id="search"
        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-slate-600 focus:border-transparent shadow-sm transition duration-150 ease-in-out"
        aria-label="Search for cities"
      />

      {/* Clear button (appears only when text exists) */}
      {searchItem && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          aria-label="Clear search"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
