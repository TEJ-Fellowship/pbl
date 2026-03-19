import { Link, NavLink } from "react-router-dom";
import { Home, Heart, Moon, User } from "lucide-react";

const Navbar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
      isActive
        ? "bg-active-bg text-gray-900 shadow-sm"
        : "text-gray-700 hover:text-gray-900 hover:bg-black/5"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <nav className="border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-serif font-extrabold text-2xl tracking-tight text-black hover:opacity-90"
          >
            <span className="text-terracotta">TEJ</span> Pustakalaya
          </Link>

          <div className="flex items-center gap-3">
            <NavLink to="/" className={linkClass} end>
              <Home size={18} strokeWidth={1.75} />
              <span className="text-sm font-medium">Home</span>
            </NavLink>

            <NavLink to="/favorites" className={linkClass}>
              <Heart size={18} strokeWidth={1.75} />
              <span className="text-sm font-medium">Favorites</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle dark mode"
              className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-black/5 transition-colors"
            >
              <Moon size={18} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              aria-label="Profile"
              className="p-2 rounded-full text-terracotta hover:bg-terracotta/10 transition-colors"
            >
              <User size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
