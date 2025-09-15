import { useState, useEffect } from "react";

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

  // Change image every 10 seconds
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
            opacity: index === currentIndex ? 0.5 : 0, // lower opacity background
          }}
        />
      ))}

      {/* Dark overlay for extra contrast */}
      <div className="absolute inset-0 bg-white opacity-40" />

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h2 className="text-4xl md:text-6xl font-extrabold text-black mb-4 leading-tight drop-shadow-lg">
          Capture a single second, <br /> relive a lifetime of memories.
        </h2>
        <p className="text-lg md:text-xl text-black mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
          Glimpse is built on one simple idea: the micro video is the default
          unit of memory. By capturing just one second of your day, every day,
          you create an emotional highlight reel that is short, bingeable, and
          deeply personal. Over time, your collection of glimpses becomes the
          most authentic and memorable way to look back on your life.
        </p>
        <button className="px-8 py-4 bg-black text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50">
          Upload Today's Glimpse
        </button>
      </div>
    </div>
  );
};

export default HomePage;
