import React, { useState } from "react";
import { Pencil, Eraser, Circle as CircleIcon, Square as SquareIcon, Triangle, Star, MousePointer } from "lucide-react";
import { LuHexagon } from 'react-icons/lu';
const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "shape", icon: <CircleIcon /> },
  { name: "square", icon: <SquareIcon /> },
  { name: "select", icon: <MousePointer /> },
];

const shapes = [
  { name: "circle", icon: <CircleIcon /> },
  { name: "square", icon: <SquareIcon /> },
  { name: "triangle", icon: <Triangle /> },
  { name: "star", icon: <Star /> },
  {}
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

      {/* Horizontal Shape selection bar */}
      {showShapes && (
        <div className="absolute left-16 top-4 bg-gray-700 rounded-lg shadow p-2 flex space-x-2">
          {shapes.map((shape) => (
            <button
              key={shape.name}
              onClick={() => setSelectedShape(shape.name)}
              className={`p-2 rounded hover:bg-gray-600 ${
                selectedShape === shape.name ? "bg-yellow-400 text-black" : "text-white"
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
