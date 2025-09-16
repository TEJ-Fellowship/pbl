import React, { useRef, useEffect, useState } from "react";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (tool === "pen") {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      setDrawing(true);
    } else if (["circle", "square", "rectangle"].includes(tool)) {
      setStartPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      setDrawing(true);
    }
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (tool === "pen") {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (["circle", "square", "rectangle"].includes(tool)) {
      const endX = e.nativeEvent.offsetX;
      const endY = e.nativeEvent.offsetY;

      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;

      if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(endX - startPos.x, 2) + Math.pow(endY - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "square") {
        const size = Math.max(Math.abs(endX - startPos.x), Math.abs(endY - startPos.y));
        ctx.strokeRect(startPos.x, startPos.y, size, size);
      } else if (tool === "rectangle") {
        ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
      }
    }

    setDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
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
      <button
        onClick={clearCanvas}
        className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
      >
        Clear
      </button>
    </div>
  );
}
