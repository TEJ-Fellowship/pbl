import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, Heart, Moon, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
      isActive
        ? "bg-active-bg text-gray-900 shadow-sm"
        : "text-gray-700 hover:text-gray-900 hover:bg-black/5"
    }`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
  };

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

            {!isAuthenticated ? (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-terracotta text-white"
                      : "text-terracotta border border-terracotta/40 hover:bg-terracotta/10"
                  }`
                }
              >
                Sign In
              </NavLink>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  aria-label="Profile"
                  onClick={toggleProfile}
                  className="p-2 rounded-full text-terracotta hover:bg-terracotta/10 transition-colors"
                >
                  <User size={18} strokeWidth={1.75} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg border border-black/10 bg-white p-1 shadow-lg z-50">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logout();
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-terracotta hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
