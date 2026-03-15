import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 200; // space for sidebars
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    // Fill background once
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update brush/eraser settings when props change
  useEffect(() => {
    if (!ctxRef.current) return;

    if (tool === "pen") {
      ctxRef.current.strokeStyle = brushColor;
    } else if (tool === "eraser") {
      ctxRef.current.strokeStyle = "#ffffff"; // eraser = white
    }
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

  // Start drawing
  const startDrawing = ({ nativeEvent }) => {
    if (tool !== "pen" && tool !== "eraser") return; // only for pen/eraser
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  // Drawing
  const draw = ({ nativeEvent }) => {
    if (!isDrawing || (tool !== "pen" && tool !== "eraser")) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (isDrawing) {
      ctxRef.current.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
