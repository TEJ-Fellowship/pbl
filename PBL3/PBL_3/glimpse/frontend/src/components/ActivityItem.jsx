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

const ActivityItem = ({ title, time, icon: Icon, color }) => {
  return (
    <div className="flex items-center space-x-4 p-3 rounded-xl hover:bg-[#f4f5f7] transition-colors duration-200 cursor-pointer group">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-[#62649a]">{title}</p>
        <p className="text-[#809dc6] text-sm">{time}</p>
      </div>
      <ChevronRight size={16} className="text-[#809dc6] group-hover:text-[#7383b2] transition-colors duration-200" />
    </div>
  );
};

export default ActivityItem