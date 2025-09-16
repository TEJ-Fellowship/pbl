import React, { useState } from "react";
import { Image, Circle, Square, BarChart2 } from "lucide-react";
import { FaPencilAlt } from 'react-icons/fa';
import { MdColorLens } from 'react-icons/md';
export default function LeftSidebar({ setTool }) {
  const [showShapeTools, setShowShapeTools] = useState(false);

  return (
    <div className="w-16 b-400 flex flex-col items-center py-4 space-y-4 relative">
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("pen")}
      >
        <FaPencilAlt className="text-white h-7 w-7" />
      </button>
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("color")}
      >
        <MdColorLens className="text-white h-8 w-8" />
      </button>
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("image")}
      >
        <Image className="text-white" />
      </button>


      {/* Shape button toggles shape tools */}
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setShowShapeTools(!showShapeTools)}
      >
        <Circle className="text-white" />
      </button>

      {showShapeTools && (
        <div className="absolute left-16 top-16 bg-purple-800 p-2 rounded shadow-lg flex flex-col space-y-2 z-50">
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
      <button
        className="p-2 hover:bg-purple-700 rounded"
        onClick={() => setTool("barchart")}
      >
        <BarChart2 className="text-white" />
      </button>
    </div>
  );
}
