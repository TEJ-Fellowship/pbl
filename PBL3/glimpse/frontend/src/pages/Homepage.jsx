import { useState, useEffect } from "react";
// import clipServices from '../services/clip'
import ActionButton from "../components/ActionButton";
const BACKGROUND_IMAGES = [
  "https://picsum.photos/1080/1920?random=1",
  "https://picsum.photos/1080/1920?random=2",
  "https://picsum.photos/1080/1920?random=3",
  "https://picsum.photos/1080/1920?random=4",
  "https://picsum.photos/1080/1920?random=5",
];

const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Preload images
  useEffect(() => {
    BACKGROUND_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Background rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="relative min-h-[calc(100vh-90px)] flex flex-col items-center justify-center overflow-hidden">
      {/* Backgrounds */}
      {BACKGROUND_IMAGES.map((img, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${img})`,
            opacity: index === currentIndex ? 0.5 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-white opacity-40" />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h2 className="text-4xl md:text-6xl font-extrabold text-black mb-4 leading-tight drop-shadow-lg">
          Capture a single second, <br /> relive a lifetime of memories.
        </h2>
        <p className="text-lg md:text-xl text-black mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
          Glimpse is built on one simple idea: the micro video is the default
          unit of memory.
        </p>
        <ActionButton />
          
      </div>
    </div>
  );
};

export default HomePage;
