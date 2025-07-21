import SearchBar from './SearchBar'

const Navbar = ({ onSearch }) => {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow px-4 py-3 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50">
      {/* Logo / App Name */}
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        Daily Drip
      </div>

      {/* Search Bar */}
      <div className="mt-2 md:mt-0 w-full md:w-auto">
        <SearchBar onSearch={onSearch} />
      </div>
    </nav>
  )
}

export default Navbar
