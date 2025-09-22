// Fixed Home.jsx - Using centralized socket context
import React, { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import CanvasBoard from "./CanvasBoard";
import { useSocket } from "../context/SocketContext";
import axios from "../utils/axios";

export default function HomePage() {
  // Brush & Tool state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen"); // default tool

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-50">
          Connecting to server...
        </div>
      )}

      {/* Left Sidebar */}
      <LeftSidebar tool={tool} setTool={setTool} />

      {/* Canvas Board */}
      <CanvasBoard
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
        
      />

      {/* Right Sidebar */}
      <RightSidebar
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
      />
    </div>
  );
}