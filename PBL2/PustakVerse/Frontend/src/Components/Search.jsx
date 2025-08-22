import react from "react"

const Search =({ searchTerm, setSearchTerm}) => {
    return (
        <input
        type="text"
        placeholder="Search books..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded px-7 py-1 w-full md:w-64 focus:outline-none focus:ring focus:border-blue-300"
        />
    )
};

export default Search;