import React, { useContext } from 'react';
import Card from '../components/Card';
import { ThemeContext } from '../ThemeContext';

const Homepage = () => {
  const { isDark } = useContext(ThemeContext);
  
  return (
    <div className={`min-h-screen max-w-[1080px] mx-auto ${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'}`}>
      {/* Hero Section */}
      <div className="relative">
        <div
          className={`h-96 bg-cover bg-center rounded-lg mx-8 mt-8 flex items-center justify-center ${
            isDark 
              ? 'bg-gray-400' 
              : 'bg-[#F8BBD0]'
          }`}
          style={{
            backgroundImage: isDark 
              ? 'linear-gradient(to right, #2D3748, #4A5568, #718096)' 
              : 'linear-gradient(to right, #FFB6C1, #E6A8D2, #C689D8)'
          }}
        >
          <div className="text-center max-w-3xl px-4">
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-white'
            }`}>
              Write your daily journal and read them in an exciting way 🎉
            </h1>
            <p className={`text-lg mb-8 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Capture your thoughts, experiences, and reflections in a beautiful and intuitive journal. Relive your memories with a unique and engaging reading experience.
            </p>
            <button className={`px-8 py-3 shadow-lg rounded-md text-lg font-semibold transition-all duration-300 hover:-translate-y-1 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-gray-600/50' 
                : 'bg-[#F06292] hover:bg-[#d11d53] text-white shadow-color-glow'
            }`}>
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-8 mt-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            img="/woman.png" 
            text='Cycling and enjoy the city view' 
            time="2 days ago"
          />
          <Card 
            img="/photo-camera.png" 
            text='Capturing moments with my camera' 
            time="3 days ago" 
          />
          <Card 
            img="/explore.png" 
            text='Exploring new places and cultures' 
            time="1 week ago" 
          />
          <Card 
            img="/working-on-laptop.png" 
            text='Working on my laptop at a cozy cafe' 
            time="2 weeks ago" 
          />
        </div>
      </div>
    </div>
  );
};

export default Homepage;