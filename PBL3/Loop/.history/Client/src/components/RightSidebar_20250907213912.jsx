import React from "react";

export default function RightSidebar({
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  clearCanvas
}) {
  const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"];

  return (
    <div className="w-6 bg-gray-800 text-white p-4 flex flex-col space-y-6">
      {/* Brush Color */}
      <div>
        <h3 className="font-semibold mb-2">Brush Color</h3>
        <div className="flex space-x-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              style={{ backgroundColor: color }}
              className={`w-8 h-8 rounded border-2 ${
                brushColor === color ? "border-white" : "border-gray-700"
              }`}
            ></button>
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <h3 className="font-semibold mb-2">Brush Size</h3>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-sm mt-1">{brushSize}px</p>
      </div>

      {/* Clear Canvas */}
      <div>
        <button
          onClick={clearCanvas}
          className="w-full bg-red-600 py-2 rounded hover:bg-red-500"
        >
          Clear Canvas
        </button>
      </div>

      {/* Participants */}
      <div>
        <h3 className="font-semibold mb-2">Participants</h3>
        <div className="flex -space-x-2">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt=""
            className="w-10 h-10 rounded-full border-2 border-gray-800"
          />
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt=""
            className="w-10 h-10 rounded-full border-2 border-gray-800"
          />
        </div>
        <p className="mt-2">Liam Carter - Current Turn</p>
      </div>

      {/* Turn Timer */}
      <div>
        <h3 className="font-semibold mb-2">Turn Timer</h3>
        <div className="w-full bg-gray-700 h-2 rounded">
          <div className="bg-green-500 h-2 rounded w-1/2"></div>
        </div>
        <p className="mt-1 text-sm text-gray-400">15s left</p>
      </div>
    </div>
  );
}
