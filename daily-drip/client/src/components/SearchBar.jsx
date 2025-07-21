import { useState } from 'react'

const SearchBar = ({ onSearch }) => {
  const [input, setInput] = useState('')

  const handleSearch = () => {
    if (!input.trim()) {
      alert('Enter a valid keyword')
      return
    }
    onSearch(input)
  }

  return (
    <div className="flex w-full md:w-[400px] gap-2">
      <input
        type="text"
        placeholder="Search news..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Search
      </button>
    </div>
  )
}

export default SearchBar
