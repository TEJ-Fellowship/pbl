import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MessageSquare,
  Home,
  Settings,
  Video,
  User,
  Upload,
  Combine
} from "lucide-react";
import { AuthContext } from "../AuthContext";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState("Home");
  const navigate = useNavigate();
  const { user, handleLogout } = useContext(AuthContext);
  const [isToggle, setIsToggle] = useState(false);
  
  const sidebarItems = [
    { name: "Home", icon: Home },
    { name: "Capture", icon: Video },
    { name: "Upload", icon: Upload, },
    { name: "Montage", icon: Combine },
    { name: "Messages", icon: MessageSquare },
    { name: "Settings", icon: Settings },
  ];
  

  const handleClick = (item) => {
    setActiveTab(item.name);
    if (item.name === "Home") navigate("/");
    if (item.name === "Capture") navigate("/capture");
    if (item.name === "Upload") navigate("/upload");
    if (item.name === "Montage") navigate("/montage");
  };

  return (
    <div className="w-64 bg-slate-900 flex flex-col justify-between h-screen">
      {/* Top Section */}
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-xl font-semibold text-white">Glimpse</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleClick(item)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                activeTab === item.name
                  ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg"
                  : "text-gray-300 hover:bg-slate-800 hover:text-violet-400"
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={18} />
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-violet-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section (User Info + Logout) */}
      <div className="p-6 border-t border-slate-700">
        {user && (
          <div className="flex items-center space-x-3">
            <User
              onClick={() => setIsToggle(!isToggle)}
              size={24}
              className="text-violet-400 cursor-pointer"
            />
            <div className="flex flex-col" onClick={() => setIsToggle(!isToggle)}>
              <span className="text-sm text-white font-semibold cursor-pointer">
                {user.username}
              </span>
              {isToggle && (
                <div className="absolute left-20 bottom-12 w-44 bg-slate-800 rounded shadow-lg border text-white border-gray-200 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setIsToggle(false)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;