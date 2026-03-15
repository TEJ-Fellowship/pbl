import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ placeholder, searchTerm, setSearchTerm }) => (
  <div className="relative mb-8">
    <input
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
    />
    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
  </div>
);

export default SearchBar;
