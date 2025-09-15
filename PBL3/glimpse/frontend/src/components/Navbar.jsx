import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="relative md:px-8 md:py-3 sticky top-0 bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg border-b border-gray-200 z-10">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            Glimpse
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-row gap-4 md:gap-6 text-sm md:text-base items-center">
          <Link to="/" className="nav-link">
            About us
          </Link>
          <Link to="/montage" className="nav-link">
            Montage
          </Link>
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="nav-link">
            Signup
          </Link>
          <Link to="/" className="nav-link">
            <img
              src="../../public/images/themeicon.png"
              alt="theme"
              className="w-16 h-16"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
