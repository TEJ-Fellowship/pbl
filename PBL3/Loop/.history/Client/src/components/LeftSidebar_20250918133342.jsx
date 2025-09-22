import React, { useState } from "react";
import { Circle, Square, Triangle, Star, Hexagon, Heart, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Check, X, Home, Settings, Search, Camera, Music, Cloud, Sun, Moon, Lock, Unlock, Bell, Trash } from "lucide-react";

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
  { name: "trash", icon: <Trash /> },
];

export default function ShapeSelector({ selectedShape, setSelectedShape }) {
  const [showShapes, setShowShapes] = useState(false);

  const handleShapeClick = (shape) => {
    setSelectedShape(shape.name);
    setShowShapes(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setShowShapes(!showShapes)} className="p-2 rounded-lg bg-gray-800 text-white">
        Select Shape
      </button>
      {showShapes && (
        <div className="absolute top-10 left-0 bg-gray-700 rounded-lg shadow p-2 grid grid-cols-4 gap-2">
          {shapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => handleShapeClick(shape)}
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
