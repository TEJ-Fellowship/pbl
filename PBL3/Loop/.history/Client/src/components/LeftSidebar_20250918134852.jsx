import React, { useState } from "react";
import {
  Pencil,
  Eraser,
  Circle as CircleIcon,
  Square as SquareIcon,
  Triangle,
  Star,
  Hexagon,
  Diamond,
  Octagon,
  Cross,
  Heart,
  Moon,
  Sun,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MousePointer,
} from "lucide-react";

// Main tools
const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "shape", icon: <CircleIcon /> },
  { name: "select", icon: <MousePointer /> },
];

// Shape toolbox (add as many as you want)
const shapes = [
  { name: "circle", icon: <CircleIcon /> },
  { name: "square", icon: <SquareIcon /> },
  { name: "triangle", icon: <Triangle /> },
  { name: "star", icon: <Star /> },
  { name: "hexagon", icon: <Hexagon /> },
  { name: "diamond", icon: <Diamond /> },
  { name: "octagon", icon: <Octagon /> },
  { name: "cross", icon: <Cross /> },
  { name: "heart", icon: <Heart /> },
  { name: "moon", icon: <Moon /> },
  { name: "sun", icon: <Sun /> },
  { name: "arrow-right", icon: <ArrowRight /> },
  { name: "arrow-left", icon: <ArrowLeft /> },
  { name: "arrow-up", icon: <ArrowUp /> },
  { name: "arrow-down", icon: <ArrowDown /> },
  // Add more shapes here
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
      {/* Main tools */}
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

      {/* Shape toolbox grid */}
      {showShapes && (
        <div className="absolute left-16 top-4 bg-gray-700 rounded-lg shadow p- grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {shapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => setSelectedShape(shape.name)}
              className={`p-2 rounded hover:bg-gray-600 flex justify-center items-center ${
                selectedShape === shape.name ? "bg-yellow-400 text-black" : "text-white"
              }`}
              title={shape.name} // tooltip for easier identification
            >
              {shape.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
