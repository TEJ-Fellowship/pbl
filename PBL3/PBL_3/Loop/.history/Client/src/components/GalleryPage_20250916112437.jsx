import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

export default function GalleryPage() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const savedImages = JSON.parse(localStorage.getItem("galleryImages") || "[]");
    setImages(savedImages);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      
      <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto">
        {images.length === 0 ? (
          <p className="text-center col-span-full">No images in gallery yet.</p>
        ) : (
          images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Canvas ${idx + 1}`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          ))
        )}
      </div>
    </div>
  );
}
