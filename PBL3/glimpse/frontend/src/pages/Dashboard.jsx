import React, { useState } from 'react';
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

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const sidebarItems = [
    { name: 'Dashboard', icon: PieChart, active: true },
    { name: 'Capture', icon: Video },
    { name: 'Timeline', icon: Calendar, badge: '12+' },
    { name: 'Messages', icon: MessageSquare },
    { name: 'AI Summary', icon: BarChart3, badge: 'NEW' },
    { name: 'Analytics', icon: BarChart3 },
    { name: 'Settings', icon: Settings }
  ];

  const statsCards = [
    { 
      title: '18', 
      subtitle: 'Total Entries', 
      description: 'This is all the days you remembered to record an entry!', 
      icon: Video, 
      color: 'bg-blue-100', 
      iconColor: 'text-blue-600',
      change: '+12%'
    },
    { 
      title: '24', 
      subtitle: 'Days Streak', 
      description: 'Great progress! 1 more day to complete your monthly goal.', 
      icon: Calendar, 
      color: 'bg-green-100', 
      iconColor: 'text-green-600',
      change: '+8%'
    },
    { 
      title: '5', 
      subtitle: 'Shared', 
      description: 'Beautiful moments captured and ready to share with others.', 
      icon: Users, 
      color: 'bg-purple-100', 
      iconColor: 'text-purple-600',
      change: '+2%'
    }
  ];

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
    <div className="min-h-screen bg-[#f4f5f7] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7383b2] to-[#98c9e9] flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span className="text-xl font-semibold text-[#62649a]">Glimpse</span>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  activeTab === item.name 
                    ? 'bg-[#7383b2] text-white shadow-lg' 
                    : 'text-[#809dc6] hover:bg-[#f4f5f7] hover:text-[#7383b2]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={18} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === item.name 
                      ? 'bg-white text-[#7383b2]' 
                      : item.badge === 'NEW' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-[#7383b2] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#62649a]">Good morning, John!</h1>
              <p className="text-[#809dc6] mt-1">Ready to capture today's moment?</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-[#7383b2] hover:bg-[#62649a] text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200">
                Quick Capture
              </button>
              <button className="p-2 text-[#809dc6] hover:text-[#7383b2] transition-colors duration-200">
                <Bell size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#98c9e9] flex items-center justify-center">
                <User size={16} className="text-[#7383b2]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[calc(100vh-88px)] overflow-y-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#7383b2] to-[#98c9e9] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Video size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Capture Today's Glimpse</h2>
              <p className="text-center text-blue-100 mb-6">Share your one-second moment today!</p>
              <div className="flex justify-center">
                <button className="bg-white text-[#7383b2] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2">
                  <Play size={18} />
                  <span>Start Recording</span>
                </button>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsCards.map((card, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon size={24} className={card.iconColor} />
                  </div>
                  <span className="text-green-500 text-sm font-medium">{card.change}</span>
                </div>
                <h3 className="text-3xl font-bold text-[#62649a] mb-1">{card.title}</h3>
                <p className="text-[#7383b2] font-semibold mb-2">{card.subtitle}</p>
                <p className="text-[#809dc6] text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Bottom Stats Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <BarChart3 size={24} className="text-yellow-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+15%</span>
            </div>
            <h3 className="text-3xl font-bold text-[#62649a] mb-1">127</h3>
            <p className="text-[#7383b2] font-semibold mb-2">Total Minutes</p>
            <p className="text-[#809dc6] text-sm">Your digital journal is growing beautifully!</p>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#62649a]">Recent Activity</h3>
              <button className="text-[#7383b2] text-sm font-medium hover:text-[#62649a] transition-colors duration-200">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-[#f4f5f7] transition-colors duration-200 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center`}>
                    <activity.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#62649a]">{activity.title}</p>
                    <p className="text-[#809dc6] text-sm">{activity.time}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#809dc6] group-hover:text-[#7383b2] transition-colors duration-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;