import { useState } from "react";

const SearchBar = ({ handleSearch, error, onClearError }) => {
  const [searchCity, setSearchCity] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      handleSearch(searchCity);
      setSearchCity("");
    }
  };

  const handleFocus = () => {
    onClearError();
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a city..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              submitSearch(e);
            }
          }}
          className="w-full px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white/50"
        />
        <button
          onClick={submitSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white/80"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {error && (
          <p className="absolute left-0 right-0 top-full mt-2 text-red-500 text-sm font-medium bg-red-50/20 px-3 py-2 rounded-md backdrop-blur-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
