import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import RecentActivity from '../components/RecentActivity';
import StatsCard from '../components/StatsCard';
import { 
  Calendar, 
  PieChart, 
  BarChart3, 
  Video,
  Users
} from 'lucide-react';

// Main Dashboard Component
const Dashboard = () => {
  

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

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex ">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 max-h-[calc(100vh-88px)] overflow-y-auto">
          {/* Hero Section */}
          <HeroSection />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statsCards.map((card, index) => (
              <StatsCard
                key={index}
                title={card.title}
                subtitle={card.subtitle}
                description={card.description}
                icon={card.icon}
                color={card.color}
                iconColor={card.iconColor}
                change={card.change}
              />
            ))}
          </div>

          {/* Bottom Stats Card */}
          <StatsCard
            title="127"
            subtitle="Total Minutes"
            description="Your digital journal is growing beautifully!"
            icon={BarChart3}
            color="bg-yellow-100"
            iconColor="text-yellow-600"
            change="+15%"
          />

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;