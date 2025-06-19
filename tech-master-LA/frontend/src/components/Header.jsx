import { useState, useRef } from "react";
import { Settings, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LOGIN_ROUTE } from "../constants/routes";
import { logout } from "../api/auth";

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  // (Optional: can be enhanced with useEffect for click outside)

  const handleLogout = () => {
    logout();
    navigate(LOGIN_ROUTE, { replace: true });
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-800 relative">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-red-500 rounded-full relative">
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full transform translate-x-1 -translate-y-1"></div>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">TechMaster</h1>
          <p className="text-gray-400 text-sm">
            Your AI-powered study companion
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4 relative">
        <button className="text-gray-400 hover:text-white">
          <Settings size={20} />
        </button>
        <div className="relative">
          <button
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <User size={20} />
          </button>
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50"
            >
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-left text-gray-200 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
