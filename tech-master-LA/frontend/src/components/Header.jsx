import { useState, useRef, useEffect } from "react";
import { Settings, User, LogOut, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LOGIN_ROUTE } from "../constants/routes";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "react-hot-toast";

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate(LOGIN_ROUTE, { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 flex items-center justify-center">
          <BrainCircuit />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">TechMaster</h1>
          <p className="text-gray-400 text-sm">
            Welcome, {user ? user.name.split(" ")[0] : "Guest"}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4 relative">
        <button className="text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            className="text-gray-400 hover:text-white focus:outline-none flex items-center gap-2"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <User size={20} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {user && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-red-600 hover:text-white rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
