import { Star, Bell, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Themetoggle from "../Theme/Themetoggle";
import { useAuth } from "../../contexts/AuthContext";
import logo1 from "../../assets/logo-1.png";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  return (
    <header className="flex items-center  h-16 justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
      {/* Logo Section */}
      <div className="flex items-center justify-between w-full gap-8">
        <div className="flex items-center gap-4 text-gray-900">
          <div className="w-14 h-14">
            <img
              src={logo1}
              className="cursor-pointer"
              onClick={() => (window.location.href = "/")}
            />
          </div>

          {/* Show About and Contact only when not authenticated */}
          {!isAuthenticated ? (
            <>
              <Link
                to="/about"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Contact
              </Link>
              <Link
                to="/reviews"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Reviews
              </Link>
              <Link
                to="/teams"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Teams
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/UserDashboard"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Dashboard
              </Link>
              <Link
                to="/explore"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Explore Property
              </Link>
              <Link
                to="/manage-property"
                className="p-4 text-gray-900 text-base font-medium leading-normal hover:text-blue-600 cursor-pointer"
              >
                Manage Property
              </Link>
            </>
          )}
        </div>

        {/* Dynamic Links */}
        {isAuthenticated ? (
          <div className="flex items-center gap-8">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-800 gap-1 text-sm font-bold leading-normal tracking-wide min-w-0 hover:bg-gray-200">
              <Themetoggle className="w-5 h-5" />
            </button>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-900 gap-2 text-sm font-bold leading-normal tracking-wide min-w-0 px-2.5 hover:bg-gray-200">
              <Bell className="w-5 h-5" />
            </button>

            {/* User profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-gray-800 font-medium hidden md:block">
                  {user?.name || "User"}
                </span>
              </div>

              {/* Dropdown menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/UserDashboard"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/manage-property"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Manage Property
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-gray-100 text-gray-800 gap-1 text-sm font-bold leading-normal tracking-wide min-w-0 hover:bg-gray-200">
              <Themetoggle className="w-5 h-5" />
            </button>
            <Link
              to="/auth"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
