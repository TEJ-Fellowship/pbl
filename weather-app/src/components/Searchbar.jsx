import { useState } from "react";

const SearchBar = () => {
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = (value) => {
    e.preventDefault();
    if (searchCity.trim()) {
      onSearch(searchCity);
      setSearchCity(""); // Clear the input after search
    }
  };

  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-3/4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white/50"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white/80">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
  );
};

export default SearchBar;
