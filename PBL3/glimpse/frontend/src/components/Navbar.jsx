import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { AuthContext } from "../AuthContext"; 

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useContext(AuthContext);

  return (
    <nav className="fixed w-full top-0 md:px-8 py-3 bg-black bg-opacity-95 backdrop-filter backdrop-blur-lg border-b border-gray-700 z-50">
      <div className="container mx-auto flex justify-between items-center text-white">
        <Link to="/" className="text-2xl font-bold">
          Glimpse
        </Link>

        <div className="hidden md:flex flex-row items-center gap-6 text-sm md:text-base relative">
          {!user ? (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/" className="nav-link">About Us</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link">Signup</Link>
              <button aria-label="Toggle theme" className="nav-link">
                <img src="/images/themeicon.png" alt="theme" className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/upload"
                className="bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 text-white flex items-center"
              >
                + New Glimpse
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Open mobile menu"
          >
            {isMobileMenuOpen ? (
              <HiX className="h-6 w-6 text-white" />
            ) : (
              <HiMenu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && !user && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black bg-opacity-95 backdrop-filter backdrop-blur-lg border-b border-gray-700 py-4 px-4 text-white">
          <div className="flex flex-col items-center gap-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">Home</Link>
            <Link to="/about-us" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">About Us</Link>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">Login</Link>
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">Signup</Link>
            <button aria-label="Toggle theme" onClick={() => setIsMobileMenuOpen(false)} className="nav-link">
              <img src="/images/themeicon.png" alt="theme" className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar;
