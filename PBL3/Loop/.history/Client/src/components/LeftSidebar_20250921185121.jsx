// ============= FIXED LeftSidebar.jsx =============
import React, { useState} from "react";
import { Pencil, Eraser, Circle, Square, MousePointer } from "lucide-react";

const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "circle", icon: <Circle /> },
  { name: "square", icon: <Square /> },
  { name: "rectangle", icon: <div>▭</div> },
  { name: "triangle", icon: <div>△</div> },
  { name: "hexagon", icon: <div>⬡</div> },
  { name: "star", icon: <div>★</div> },
  { name: "select", icon: <MousePointer /> },
];

const shapes = [
  { name: "circle", icon: <CircleIcon /> },
  { name: "square", icon: <SquareIcon /> },
  { name: "triangle", icon: <Triangle /> },
  { name: "star", icon: <Star /> },
  { name: "hexagon", icon: <LuHexagon className="w-6 h-6"/>}
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
          title={t.name}
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