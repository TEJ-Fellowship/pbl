import React, { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import { Routes, Route, useLocation } from 'react-router-dom';

const TIMELINE_DATA = [
  { id: 1, date: '2024-10-25', description: "Morning run.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 2, date: '2024-10-26', description: "Making coffee.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 3, date: '2024-10-27', description: "Sketching new ideas.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 4, date: '2024-10-28', description: "Reading a great book.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 5, date: '2024-09-29', description: "Quick workout.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 6, date: '2024-09-30', description: "Enjoying the sunset.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 7, date: '2024-09-01', description: "A moment of reflection.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 8, date: '2024-09-02', description: "New week, new goals.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 9, date: '2024-09-03', description: "Catching up with friends.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 10, date: '2024-09-04', description: "Working on Glimpse.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 11, date: '2024-09-05', description: "Brainstorming new features.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 12, date: '2024-09-06', description: "A walk in the park.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 13, date: '2024-09-07', description: "Relaxing at home.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 14, date: '2024-09-08', description: "Planning the week.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 15, date: '2024-09-09', description: "Today's Glimpse", isToday: true, videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 16, date: '2023-12-15', description: "Holiday lights.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
  { id: 17, date: '2023-12-16', description: "Cozy night in.", videoPlaceholder: 'https://cdn.glitch.me/377c8e54-5116-43b9-a467-f4e1f729b48b/1sec-sample.mp4' },
];

const BACKGROUND_IMAGES = [
  'https://picsum.photos/1080/1920?random=1',
  'https://picsum.photos/1080/1920?random=2',
  'https://picsum.photos/1080/1920?random=3',
  'https://picsum.photos/1080/1920?random=4',
  'https://picsum.photos/1080/1920?random=5',
];

const VideoModal = ({ videoUrl, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
    <div className="relative w-full max-w-xl mx-auto rounded-xl shadow-2xl overflow-hidden">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50 focus:outline-none"
        aria-label="Close video"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        className="w-full h-auto"
        poster="https://picsum.photos/400"
      />
    </div>
  </div>
);


 


const App = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadingImageIndex, setFadingImageIndex] = useState(1);
  const location = useLocation();

  // Effect to handle the smooth background image transition on the homepage.
  useEffect(() => {
    if (location.pathname === '/') {
      const interval = setInterval(() => {
        setFadingImageIndex((prevIndex) => (prevIndex + 1) % BACKGROUND_IMAGES.length);
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % BACKGROUND_IMAGES.length);
        }, 1000); 
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [location.pathname]);

  return (
    <div className="relative bg-gray-50 text-gray-800 min-h-screen font-sans">
      {location.pathname === '/' && (
        <>
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGES[currentImageIndex]})` }}
          >
            <div className="absolute inset-0 bg-gray-900 opacity-80"></div>
          </div>
          <div 
            className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out`}
            style={{
              backgroundImage: `url(${BACKGROUND_IMAGES[fadingImageIndex]})`,
              opacity: currentImageIndex === fadingImageIndex ? 0 : 1
            }}
          ></div>
        </>
      )}

      <Navbar />
      {/* <main className="relative flex-grow flex flex-col items-center justify-center p-4 md:p-8 text-gray-900 max-w-4xl mx-auto z-10"> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timeline" element={<Timeline onCardClick={setSelectedVideo} TIMELINE_DATA={TIMELINE_DATA} />} />
        </Routes>
      {/* </main> */}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal videoUrl={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
};

export default App;
