import { useState, useEffect } from "react";
// import clipServices from '../services/clip'
import axios from "axios";
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

  const cloudName = "ddfvqm9wq";
  const uploadPreset = "glimpse";

  const openCloudinaryWidget = () => {
    const myWidget = window.cloudinary.openUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ["local", "camera"],
        resourceType: "video",
        clientAllowedFormats: ["mp4", "webm", "mov"],
        maxFileSize: 20000000,
        folder: "glimpses",
        cropping: false,
        multiple: false,
        transformation: [
          { start_offset: "0", end_offset: "1" }, // 🔥 trim to 1 second
        ],
      },
      async (error, result) => {
        if (!error && result && result.event === "success") {
          console.log("Video uploaded: ", result.info);

          const videoUrl = result.info.secure_url;
          const publicId = result.info.public_id;

          try {
            await axios.post("http://localhost:3001/api/clips", {
              videoUrl,
              publicId,
            });
          } catch (err) {
            console.error("Backend error:", err);
            alert("❌ Failed to save glimpse. Check backend logs.");
          }
        } else if (result.event === "abort") {
          console.log("Upload aborted.");
        } else if (error) {
          console.error("Upload error:", error);
        }
      }
    );

    myWidget.open();
  };

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
        <button
          onClick={openCloudinaryWidget}
          className="px-8 py-4 bg-black text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-transform transform hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50"
        >
          Upload Today's Glimpse
        </button>
      </div>
    </div>
  );
};

export default HomePage;
