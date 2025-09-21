import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Abstracting API calls to a service file for better code organization
const clipApi = {
  
  saveClip: async (videoData) => {
    try {
      const response = await axios.post("http://localhost:3001/api/clips", videoData);
      return response.data;
    } catch (error) {
      console.error("Failed to save clip to the backend:", error);
      throw new Error("Failed to save glimpse. Please try again.");
    }
  },
};

const BACKGROUND_IMAGES = [
  "https://picsum.photos/1080/1920?random=1",
  "https://picsum.photos/1080/1920?random=2",
  "https://picsum.photos/1080/1920?random=3",
  "https://picsum.photos/1080/1920?random=4",
  "https://picsum.photos/1080/1920?random=5",
];

const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate=useNavigate();
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

  const cloudName = "ddfvqm9wq";
  const uploadPreset = "glimpse";

  const openCloudinaryWidget = () => {
    const myWidget = window.cloudinary.openUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "camera"],
        resourceType: "video",
        clientAllowedFormats: ["mp4", "webm", "mov"],
        maxFileSize: 20000000,
        folder: "glimpses",
        cropping: false,
        multiple: false,
        transformation: [{ start_offset: "0", end_offset: "1" }],
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          console.log("Video uploaded: ", result.info);
          const { secure_url: videoUrl, public_id: publicId } = result.info;

          try {
            await clipApi.saveClip({ videoUrl, publicId });
            alert("✅ Glimpse uploaded successfully!");
          } catch (err) {
            alert("Glimpse Upload failed. Please login first.");
            navigate('/login')
          }
        } else if (result.event === "abort") {
          console.log("Upload aborted.");
        } else if (error) {
          console.error("Upload error:", error);
          alert("❌ Upload failed. Please login first.");
        }
      }
    );

    myWidget.open();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Backgrounds - made to cover full screen on all devices */}
      {BACKGROUND_IMAGES.map((img, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${img})`,
            opacity: index === currentIndex ? 0.7 : 0,
          }}
        />
      ))}

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-60" />

      {/* Content - responsive padding and text scaling */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
          Capture a single second, <br className="hidden md:inline" /> relive a lifetime of memories.
        </h2>
        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          Glimpse is built on one simple idea: the micro video is the default unit of memory.
        </p>
        <button
          onClick={openCloudinaryWidget}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload Today's Glimpse
        </button>
      </div>
    </div>
  );
};

export default HomePage;
