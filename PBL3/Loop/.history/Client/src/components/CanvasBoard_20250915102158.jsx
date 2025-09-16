import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

const BACKEND_URL = "http://localhost:5000"; // match your Express port

// Helper to generate unique user ID
const generateUserId = () => Math.random().toString(36).substr(2, 9);

export default function CanvasBoard({ brushColor, brushSize, tool }) {
  const canvasRef = useRef(null);
  const userId = useRef(generateUserId());

  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cursors, setCursors] = useState([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;

    loadDrawings();
    loadCursors();
  }, []);

  useEffect(() => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.stroke();
    });

    return () => {
      socket.off("canvasUpdate");
    };
  }, [socket, roomCode]);

  // Drawing functions
  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newX, newY);
    ctx.stroke();

    // Send update to backend
    socket?.emit("canvasUpdate", {
      roomCode,
      data: { x1: lastPos.x, y1: lastPos.y, x2: newX, y2: newY },
    });

    setLastPos({ x: newX, y: newY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
