import React, { useRef, useEffect, useState } from "react";
import { database } from "./firebaseConfig";
import { ref, push, onChildAdded } from "firebase/database";

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
  }, []);

  // Update brush size or color
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  // Listen for real-time updates
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const drawingsRef = ref(database, "drawings");

    onChildAdded(drawingsRef, (snapshot) => {
      const { tool, color, size, start, end } = snapshot.val();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (tool === "pen") {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "square") {
        const sizeVal = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        ctx.strokeRect(start.x, start.y, sizeVal, sizeVal);
      } else if (tool === "rectangle") {
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      }
    });
  }, []);

  const sendDrawing = (start, end) => {
    const drawingsRef = ref(database, "drawings");
    push(drawingsRef, {
      tool,
      color: brushColor,
      size: brushSize,
      start,
      end,
    });
  };

  const startDrawing = (e) => {
    if (tool === "pen") {
      setStartPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      setDrawing(true);
    } else if (["circle", "square", "rectangle"].includes(tool)) {
      setStartPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      setDrawing(true);
    }
  };

  const draw = (e) => {
    if (!drawing) return;
    if (tool !== "pen") return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const endPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(endPos.x, endPos.y);
    ctx.stroke();

    sendDrawing(startPos, endPos);
    setStartPos(endPos);
  };

  const stopDrawing = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const endPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

    if (["circle", "square", "rectangle"].includes(tool)) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;

      if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "square") {
        const sizeVal = Math.max(Math.abs(endPos.x - startPos.x), Math.abs(endPos.y - startPos.y));
        ctx.strokeRect(startPos.x, startPos.y, sizeVal, sizeVal);
      } else if (tool === "rectangle") {
        ctx.strokeRect(startPos.x, startPos.y, endPos.x - startPos.x, endPos.y - startPos.y);
      }

      sendDrawing(startPos, endPos);
    }

    setDrawing(false);
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
        Your collaborative canvas
      </div>
    </div>
  );
}
