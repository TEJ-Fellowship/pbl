import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Function to resize canvas dynamically based on sidebars
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 0;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 0;

    canvas.width = window.innerWidth - leftWidth - rightWidth-400;
    canvas.height = window.innerHeight - ;

    // Optional: Fill background again to prevent transparent canvas
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    resizeCanvas();

    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Update brush/eraser settings when props change
  useEffect(() => {
    if (!ctxRef.current) return;

    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : "#ffffff";
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

  const startDrawing = ({ nativeEvent }) => {
    if (tool !== "pen" && tool !== "eraser") return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || (tool !== "pen" && tool !== "eraser")) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

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
