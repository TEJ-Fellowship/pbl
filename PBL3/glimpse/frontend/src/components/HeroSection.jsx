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
import { useNavigate } from 'react-router-dom';
const HeroSection = () => {
  const navigate=useNavigate()
  return (
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
            <span onClick={()=>{navigate('/videoupload')      }}>Start Recording</span>
          </button>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
    </div>
  );
};

export default HeroSection