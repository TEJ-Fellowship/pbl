import { useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const SearchBar = ({ onSearch }) => {
  const [input, setInput] = useState('')

  const handleSearch = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) {
      alert('Enter a valid keyword')
      return
    }
    onSearch(trimmedInput)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="flex justify-center items-center gap-2 w-full">
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search news..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-500 rounded px-2 py-1 text-sm text-gray-800
                     focus:outline-none focus:ring-1 focus:ring-gray-700
                     dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600
                     dark:focus:ring-gray-300"
        />
      </div>

      <ThemeToggle />

      <button
        type="button"
        onClick={handleRefresh}
        className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
        aria-label="Refresh page"
      >
        <RefreshCcw className="h-5 w-5" />
      </button>
    </div>
  )
}

export default SearchBar
