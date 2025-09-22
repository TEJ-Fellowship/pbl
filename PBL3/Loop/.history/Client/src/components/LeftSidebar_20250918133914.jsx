import React, { useState } from "react";
import { Pencil, Eraser, Circle, Square, MousePointer, Triangle, Star } from "lucide-react";

const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "shape", icon: <Circle /> },
  { name: "square", icon: <Square /> },
  { name: "select", icon: <MousePointer /> },
];

const shapes = [
  { }
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

      {/* Shape selection bar */}
      {showShapes && (
        <div className="absolute left-16 top-20 bg-gray-700 rounded-lg shadow p-2 flex flex-col space-y-2">
          {shapes.map((shape) => (
            <button
              key={shape}
              onClick={() => setSelectedShape(shape)}
              className={`px-3 py-1 rounded ${
                selectedShape === shape ? "bg-yellow-400 text-black" : "bg-gray-600 text-white"
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}