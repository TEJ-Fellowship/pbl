import React, { useRef, useEffect } from "react";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 320; // leave space for sidebars
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        className="bg-white rounded-lg shadow-lg"
        style={{ cursor: tool === "pen" ? "crosshair" : "default" }}
      />
    </div>
  );
}
