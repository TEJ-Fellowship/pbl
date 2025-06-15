const SearchBar = ({ searchItem, handleSearch }) => {
  return (
    <div>
      <label htmlFor="search">
        Search for a country:
        <input
          type="text"
          placeholder="Search for a country"
          value={searchItem}
          onChange={handleSearch}
          id="search"
        />
      </label>
    </div>
  );
};

export default SearchBar;
