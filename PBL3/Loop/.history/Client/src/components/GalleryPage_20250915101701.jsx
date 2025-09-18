// components/GalleryPage.jsx
import React from "react";
import Navbar from "./Navbar";

export default function GalleryPage() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <h2 className="text-2xl">Gallery Page</h2>
      </div>
    </div>
  );
}
