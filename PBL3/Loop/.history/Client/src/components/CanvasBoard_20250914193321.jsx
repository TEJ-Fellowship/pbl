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
    ctx.lineWidth = brushSize;
  }, [brushSize]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = brushColor;
  }, [brushColor]);

  // Fetch all drawings from backend
  const loadDrawings = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/drawings`);
    const ctx = canvasRef.current.getContext("2d");
    res.data.forEach((d) => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.size;
      drawShape(ctx, d.tool, d.start, d.end);
    });
    setUndoStack(res.data.map((d) => d._id));
  };

  // Fetch cursors
  const loadCursors = async () => {
    const res = await axios.get(`${BACKEND_URL}/api/drawings/cursors`);
    setCursors(res.data);
  };

  const updateCursor = async (x, y) => {
    await axios.post(`${BACKEND_URL}/api/drawings/cursors`, {
      userId: userId.current,
      x,
      y,
      color: brushColor,
    });
    loadCursors();
  };

  const startDrawingHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    updateCursor(x, y);

    setStartPos({ x, y });
    setDrawing(true);
  };

  const drawHandler = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    updateCursor(x, y);

    if (!drawing) return;
    if (tool !== "pen") return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(x, y);
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
