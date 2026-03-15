import React, { useState } from "react";
import { Image, Circle, BarChart2 } from "lucide-react";
import { FaPencilAlt } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";

export default function LeftSidebar({ setTool }) {
  const [showShapeTools, setShowShapeTools] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF",
    "#FFA500", "#800080", "#A52A2A", "#008080",
  ];

  return (
    <div className="flex">
      {/* Main Sidebar */}
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
          onClick={() => {
            setShowColorPalette(!showColorPalette);
            setShowShapeTools(false); // close shapes if open
          }}
        >
          <MdColorLens className="text-white h-8 w-8" />
        </button>

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
          onClick={() => {
            setShowShapeTools(!showShapeTools);
            setShowColorPalette(false); // close colors if open
          }}
        >
          <Circle className="text-white" />
        </button>

        {/* Bar chart */}
        <button
          className="p-2 hover:bg-purple-700 rounded"
          onClick={() => setTool("barchart")}
        >
          <BarChart2 className="text-white" />
        </button>
      </div>

      {/* Secondary Sidebar for Colors */}
      {showColorPalette && (
        <div className="w-40 bg-purple-800 p-4 flex flex-col items-center space-y-4 shadow-lg">
          <h2 className="text-white text-lg font-bold">Colors</h2>
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color, idx) => (
              <button
    key={idx}
    className="w-8 h-8 rounded-full border border-gray-200"
    style={{ backgroundColor: color }}
    onClick={() => {
      setBrushColor(color); // ✅ directly update brush color
      setShowColorPalette(false);
    }}
  />
            ))}
          </div>
          <button
            className="mt-4 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500"
            onClick={() => setShowColorPalette(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* Secondary Sidebar for Shapes */}
      {showShapeTools && (
        <div className="w-40 bg-purple-800 p-4 flex flex-col items-start space-y-2 shadow-lg">
          <h2 className="text-white text-lg font-bold">Shapes</h2>
          <button
            className="p-2 hover:bg-purple-700 rounded text-white w-full text-left"
            onClick={() => {
              setTool("circle");
              setShowShapeTools(false);
            }}
          >
            Circle
          </button>
          <button
            className="p-2 hover:bg-purple-700 rounded text-white w-full text-left"
            onClick={() => {
              setTool("square");
              setShowShapeTools(false);
            }}
          >
            Square
          </button>
          <button
            className="p-2 hover:bg-purple-700 rounded text-white w-full text-left"
            onClick={() => {
              setTool("rectangle");
              setShowShapeTools(false);
            }}
          >
            Rectangle
          </button>
          <button
            className="mt-4 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500 self-center"
            onClick={() => setShowShapeTools(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
