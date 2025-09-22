import React from "react";
import { Pencil, Eraser, Circle, Square, MousePointer } from "lucide-react";

const tools = [
  { name: "pen", icon: <Pencil /> },
  { name: "eraser", icon: <Eraser /> },
  { name: "circle", icon: <Circle /> },
  { name: "square", icon: <Square /> },
  { name: "select", icon: <MousePointer /> },
];

const shapes = ["circle", "square", "triangle", "star"];

export default function LeftSidebar({ tool, setTool, selectedShape, set }) {
  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-6">
      {tools.map((t) => (
        <button
          key={t.name}
          onClick={() => setTool(t.name)}
          className={`p-2 rounded-lg hover:bg-gray-700 ${
            tool === t.name ? "bg-yellow-400 text-black" : "text-white"
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
