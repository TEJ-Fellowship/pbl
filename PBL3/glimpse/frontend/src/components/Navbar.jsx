import { Link } from "react-router-dom"
const Navbar = () => {
    return(
      <nav className="relative p-4 md:p-6 sticky top-0 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg border-b border-gray-200 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to='/' className="text-2xl font-bold text-gray-800">Glimpse</Link>
          </div>
          
          <div className="space-x-4 md:space-x-6 text-sm md:text-base">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/timeline" className="nav-link">Timeline</Link>
            <Link>Montage</Link>
            <Link>Profile</Link>
          </div>
        </div>
      </nav>
    )
}

export default Navbar