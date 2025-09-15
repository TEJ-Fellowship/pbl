import { 
  Calendar, 
  MessageSquare, 
  PieChart, 
  Settings,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const sidebarItems = [
    { name: "Dashboard", icon: PieChart },
    { name: "Capture", icon: Video },
    { name: "Timeline", icon: Calendar, badge: "12+" },
    { name: "Messages", icon: MessageSquare },
    { name: "Settings", icon: Settings },
  ];

  const handleClick = (item) => {
    setActiveTab(item.name);
    if (item.name === "Timeline") {
      navigate("/timelines");
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7383b2] to-[#98c9e9] flex items-center justify-center">
            <span className="text-white text-sm font-bold">G</span>
          </div>
          <span className="text-xl font-semibold text-[#62649a]">Glimpse</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleClick(item)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                activeTab === item.name
                  ? "bg-[#7383b2] text-white shadow-lg"
                  : "text-[#809dc6] hover:bg-[#f4f5f7] hover:text-[#7383b2]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={18} />
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === item.name
                      ? "bg-white text-[#7383b2]"
                      : item.badge === "NEW"
                      ? "bg-red-500 text-white"
                      : "bg-[#7383b2] text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
