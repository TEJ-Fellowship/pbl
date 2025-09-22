import React, { useState } from "react";
import {
  Pencil, Eraser, Circle, Square, Triangle, Star, Hexagon, Heart,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Check, X,
  Home, Settings, Search, Camera, Music, Cloud, Sun, Moon, Lock, Unlock, Bell, Trash, MousePointer
} from "lucide-react";

// Tools
const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "shape", icon: <Circle /> }, // shape tool triggers shape selection
  { name: "select", icon: <MousePointer /> },
];

// 25 shapes with icons
const shapes = [
  { name: "circle", icon: <Circle /> },
  { name: "square", icon: <Square /> },
  { name: "triangle", icon: <Triangle /> },
  { name: "star", icon: <Star /> },
  { name: "hexagon", icon: <Hexagon /> },
  { name: "heart", icon: <Heart /> },
  { name: "arrowUp", icon: <ArrowUp /> },
  { name: "arrowDown", icon: <ArrowDown /> },
  { name: "arrowLeft", icon: <ArrowLeft /> },
  { name: "arrowRight", icon: <ArrowRight /> },
  { name: "plus", icon: <Plus /> },
  { name: "minus", icon: <Minus /> },
  { name: "check", icon: <Check /> },
  { name: "x", icon: <X /> },
  { name: "home", icon: <Home /> },
  { name: "settings", icon: <Settings /> },
  { name: "search", icon: <Search /> },
  { name: "camera", icon: <Camera /> },
  { name: "music", icon: <Music /> },
  { name: "cloud", icon: <Cloud /> },
  { name: "sun", icon: <Sun /> },
  { name: "moon", icon: <Moon /> },
  { name: "lock", icon: <Lock /> },
  { name: "unlock", icon: <Unlock /> },
  { name: "bell", icon: <Bell /> },
];

export default function LeftSidebar({ tool, setTool, selectedShape, setSelectedShape }) {
  const [showShapes, setShowShapes] = useState(false);

  const handleToolClick = (t) => {
    setTool(t.name);
    if (t.name === "shape") {
      setShowShapes(!showShapes);
    } else {
      setShowShapes(false);
    }
  };

  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-6 relative">
      {/* Tool buttons */}
      {tools.map((t) => (
        <button
          key={t.name}
          onClick={() => handleToolClick(t)}
          className={`p-2 rounded-lg hover:bg-gray-700 ${
            tool === t.name ? "bg-yellow-400 text-black" : "text-white"
          }`}
        >
          {t.icon}
        </button>
      ))}

      {/* Shape selection bar */}
      {showShapes && (
        <div className="absolute left-16 top-20 bg-gray-700 rounded-lg shadow p-2 grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          {shapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => setSelectedShape(shape.name)}
              className={`p-2 rounded-lg flex justify-center items-center ${
                selectedShape === shape.name ? "bg-yellow-400 text-black" : "bg-gray-600 text-white"
              }`}
            >
              {shape.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
