// components/GalleryPage.jsx
import React, { useEffect, useState } from "react";
import axios from "../utils/axios";

export default function GalleryPage() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get("/loop"); // GET all loops
        setImages(res.data || []);
      } catch (err) {
        console.error("Failed to load gallery:", err);
      }
    };
    fetchGallery();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto">
        {images.length === 0 ? (
          <p className="text-center col-span-full">No images in gallery yet.</p>
        ) : (
          images.map((loop, idx) => (
            <div key={loop._id || idx} className="bg-[#111827] p-2 rounded-lg shadow-lg">
              <img
                src={loop.finalImage}
                alt={loop.caption || `Canvas ${idx + 1}`}
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <p className="text-sm mt-2 text-gray-300">{loop.caption}</p>
              <p className="text-xs text-gray-400">{loop.creator?.username || "Unknown"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
