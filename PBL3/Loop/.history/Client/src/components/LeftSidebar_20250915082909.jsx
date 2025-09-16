import React, { useState } from "react";
import { Image, Circle, BarChart2 } from "lucide-react";
import { FaPencilAlt } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";

export default function LeftSidebar({ setTool }) {
  const [showShapeTools, setShowShapeTools] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFFFFF",
    "#FFA500",
    "#800080",
  ];

  return (
    <div className="w-16 bg-blue-700 flex flex-col items-center py-4 space-y-4 relative">
      {/* Pen */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("pen")}
      >
        <FaPencilAlt className="text-white h-7 w-7" />
      </button>

      {/* Color Palette */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setShowColorPalette(!showColorPalette)}
      >
        <MdColorLens className="text-white h-8 w-8" />
      </button>

      {showColorPalette && (
        <div className="absolute left-16 top-20 bg-purple-800 p-3 rounded shadow-lg grid grid-cols-5 gap-2 z-50">
          {colors.map((color, idx) => (
            <button
              key={idx}
              className="w-6 h-6 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
              onClick={() => {
                setTool({ type: "color", value: color });
                setShowColorPalette(false);
              }}
            />
          ))}
        </div>
      )}

      {/* Image */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("image")}
      >
        <Image className="text-white" />
      </button>

      {/* Shape Tools */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setShowShapeTools(!showShapeTools)}
      >
        <Circle className="text-white" />
      </button>

      {showShapeTools && (
        <div className="absolute left-16 top-40 bg-purple-800 p-2 rounded shadow-lg flex flex-col space-y-2 z-50">
          <button
            className="p-2 hover:bg-purple-700 rounded text-white"
            onClick={() => {
              setTool("circle");
              setShowShapeTools(false);
            }}
          >
            Circle
          </button>
          <button
            className="p-2 hover:bg-purple-700 rounded text-white"
            onClick={() => {
              setTool("square");
              setShowShapeTools(false);
            }}
          >
            Square
          </button>
          <button
            className="p-2 hover:bg-purple-700 rounded text-white"
            onClick={() => {
              setTool("rectangle");
              setShowShapeTools(false);
            }}
          >
            Rectangle
          </button>
        </div>
      )}

      {/* Bar chart */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("barchart")}
      >
        <BarChart2 className="text-white" />
      </button>
    </div>
  );
}
