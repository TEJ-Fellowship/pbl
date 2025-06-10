import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [searchCity, setSearchCity] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      onSearch(searchCity);
      setSearchCity(""); // Clear the input after search
    }
  };

  return (
    <div className="px-6 md:px-8 mb-8">
      <form onSubmit={handleSearch} className="max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full px-4 py-3 bg-white bg-opacity-20 backdrop-blur-md rounded-lg text-white placeholder-gray-300 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
          >
            🔍
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
