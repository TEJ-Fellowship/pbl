import React from 'react';
import Card from '../components/Card';
 

const Homepage = () => {
  return (
    <div className="min-h-screen max-w-[1080px] mx-auto bg-red-500 ">

      {/* Hero Section */}
      <div className="relative">
        <div 
          className="h-96 bg-cover bg-center rounded-lg mx-8 mt-8 flex items-center justify-center bg-[#F8BBD0]"
          style={{
            backgroundImage: 'linear-gradient(to right, #FFB6C1, #E6A8D2, #C689D8)'

            // backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-opacity=\'0.1\'%3E%3Cpath d=\'M20 20h60v60H20z\' fill=\'%23d4b896\'/%3E%3C/g%3E%3C/svg%3E")',
          }}
        >
          <div className="text-center text-white max-w-3xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Write your daily journal and read them in an exciting way 🎉
            </h1>
            <p className="text-lg mb-8 text-gray-700">
              Capture your thoughts, experiences, and reflections in a beautiful and intuitive journal. Relive your memories with a unique and engaging reading experience.
            </p>
            <button className="px-8 py-3 bg-[#F06292] hover:bg-[#d11d53] shadow-color-glow shadow-lg text-white rounded-md text-lg font-semibold transition-colors transition-shadow duration-300 hover:-translate-y-1">
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-8 mt-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <Card img="/woman.png" text='Cycling and enjoy the city view' time ="2 days ago"/>
         <Card img="/photo-camera.png" text='Capturing moments with my camera' time ="3 days ago" />
         <Card img="/explore.png" text='Exploring new places and cultures' time ="1 week ago" />
         <Card img="/working-on-laptop.png" text='Working on my laptop at a cozy cafe' time ="2 weeks ago" />
         
        </div>
      </div>
    </div>
  );
};

export default Homepage;