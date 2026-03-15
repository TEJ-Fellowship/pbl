import { 
  Calendar, 
  RotateCcw, 
  MessageSquare, 
  PieChart, 
  BarChart3, 
  Settings,
  Video,
  Play,
  User,
  Bell,
  ChevronRight,
  Coffee,
  Sunrise,
  Moon,
  Users
} from 'lucide-react';

const StatsCard = ({ title, subtitle, description, color, icon: Icon,iconColor, change }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={24} className={iconColor} />
        </div>
        <span className="text-green-500 text-sm font-medium">{change}</span>
      </div>
      <h3 className="text-3xl font-bold text-[#62649a] mb-1">{title}</h3>
      <p className="text-[#7383b2] font-semibold mb-2">{subtitle}</p>
      <p className="text-[#809dc6] text-sm leading-relaxed">{description}</p>
    </div>
  );
};
export default StatsCard