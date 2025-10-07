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
import ActivityItem from './ActivityItem';

// Recent Activity Section Component
const RecentActivity = () => {
  const recentActivities = [
    {
      title: 'Captured morning coffee ritual',
      time: '2 hours ago',
      icon: Coffee,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Shared January montage',
      time: '1 day ago', 
      icon: Users,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'AI generated monthly summary',
      time: '2 days ago',
      icon: BarChart3,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Achieved 14-day streak!',
      time: '3 days ago',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#62649a]">Recent Activity</h3>
        <button className="text-[#7383b2] text-sm font-medium hover:text-[#62649a] transition-colors duration-200">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {recentActivities.map((activity, index) => (
          <ActivityItem
            key={index}
            title={activity.title}
            time={activity.time}
            icon={activity.icon}
            color={activity.color}
          />
        ))}
      </div>
    </div>
  );
};
export default RecentActivity