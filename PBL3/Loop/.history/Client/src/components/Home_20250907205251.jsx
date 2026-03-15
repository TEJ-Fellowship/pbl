import React, { useRef, useEffect, useState } from "react";
import { PenTool, Image, Circle, Square, BarChart2 } from "lucide-react";

export default function HomePage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    // Set initial canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
        <button className="p-2 hover:bg-gray-700 rounded">
          <PenTool className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Image className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Circle className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <Square className="text-white" />
        </button>
        <button className="p-2 hover:bg-gray-700 rounded">
          <BarChart2 className="text-white" />
        </button>
      </div>

      {/* Center Drawing Canvas */}
      <div className="flex-1 flex justify-center items-center bg-white relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 w-full h-full max-w-4xl max-h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
          Your doodle canvas
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col space-y-6">
        {/* Stylize Section */}
        <div>
          <h3 className="font-semibold mb-2">Brush Color</h3>
          <div className="flex space-x-2">
            {["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded border-2 ${
                    brushColor === color ? "border-white" : "border-gray-700"
                  }`}
                ></button>
              )
            )}
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

        {/* Participants Section */}
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
    </div>
  );
}
