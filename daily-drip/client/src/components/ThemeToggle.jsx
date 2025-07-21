// src/components/ThemeToggle.jsx
import { useState, useEffect, useRef } from 'react'
import { Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const { setTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleThemeChange = (theme) => {
    setTheme(theme)
    setDropdownOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
        aria-label="Toggle theme menu"
      >
        <Moon className="h-5 w-5" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-md z-50">
          {['light', 'dark', 'system'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              className="block w-full text-left px-4 py-2 capitalize hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeToggle
