import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PropertyImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-80 rounded-lg bg-cover bg-center bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">No Images Available</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden">
      {/* Background image */}
      <div
        className="absolute w-full h-full bg-cover bg-center transition-all duration-300"
        style={{ backgroundImage: `url(${images[currentIndex]})` }}
      ></div>

      {/* Navigation Arrows */}
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-80 p-0.2 rounded-full"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-80 p-0.2 rounded-full"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full bg-white transition-opacity ${
              i === currentIndex ? "opacity-100" : "opacity-50"
            }`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default PropertyImageSlider;
