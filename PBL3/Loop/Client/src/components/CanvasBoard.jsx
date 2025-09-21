// ============= FIXED CanvasBoard.jsx =============
import React, { useRef, useEffect, useState } from "react";
import axios from "../utils/axios";
import { io } from "socket.io-client";

export default function CanvasBoard({ brushColor, brushSize, tool, roomId, user, setRemainingTime, canvasBackgroundColor = "#ffffff" }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [undoQueue, setUndoQueue] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);

  // Canvas resize
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 64;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 320; // Adjusted for smaller right sidebar

    canvas.width = window.innerWidth - leftWidth - rightWidth - 40;
    canvas.height = window.innerHeight - 140;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (strokes.length > 0) {
      redrawCanvas(strokes);
    }
  };

  // Init canvas & socket
  useEffect(() => {
    resizeCanvas();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    const fetchStrokes = async () => {
      try {
        if (!roomId) return;
        const res = await axios.get(`/drawings/${roomId}`);
        setStrokes(res.data || []);
      } catch (err) {
        console.error("Failed to load strokes:", err);
      }
    };

    if (roomId) fetchStrokes();

    socketRef.current = io("http://localhost:3001", { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on("connect", () => {
      console.log("Canvas socket connected", socketRef.current.id);
      if (roomId && user) {
        socketRef.current.emit("joinRoom", {
          roomId,
          userId: user.id || user._id,
          username: user.name || user.username || user.email?.split('@')[0]
        });
      }
    });

    // Socket events
    socketRef.current.on("stroke:created", (payload) => {
      if (!payload) return;
      setStrokes(prev => {
        if (payload._id && prev.some(s => s._id === payload._id)) return prev;
        return [...prev, payload];
      });
    });

    socketRef.current.on("stroke:deleted", ({ strokeId }) => {
      setStrokes(prev => prev.filter(s => s._id !== strokeId));
    });

    // Turn-based events
    socketRef.current.on("turn:started", ({ userId, duration }) => {
      setActiveUserId(userId);
      setRemainingTime(duration);
    });

    socketRef.current.on("turn:update", ({ remaining }) => {
      setRemainingTime(remaining);
    });

    socketRef.current.on("turn:ended", ({ nextUserId }) => {
      setActiveUserId(nextUserId);
    });

    socketRef.current.on("roomUsers", (users) => {
      if (users && users.length > 0) {
        // If no active user is set, set the first user as active
        if (!activeUserId) {
          setActiveUserId(users[0].userId);
        }
      }
    });

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, user]);

  // Update canvas background when prop changes
  useEffect(() => {
    redrawCanvas(strokes);
  }, [canvasBackgroundColor]);

  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : canvasBackgroundColor;
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool, canvasBackgroundColor]);

  // Shape drawing functions - FIXED
  const drawShape = (ctx, shapeType, startX, startY, endX, endY) => {
    ctx.beginPath();
    
    switch (shapeType) {
      case "circle":
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        break;
      case "square":
        const size = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
        ctx.rect(startX, startY, size, size);
        break;
      case "rectangle":
        ctx.rect(startX, startY, endX - startX, endY - startY);
        break;
      case "triangle":
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX - (endX - startX), endY);
        ctx.closePath();
        break;
      case "hexagon":
        const hexRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = startX + hexRadius * Math.cos(angle);
          const y = startY + hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case "star":
        const starRadius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const spikes = 5;
        const outerRadius = starRadius;
        const innerRadius = starRadius * 0.4;
        
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = startX + radius * Math.cos(angle - Math.PI / 2);
          const y = startY + radius * Math.sin(angle - Math.PI / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
    }
    ctx.stroke();
  };

  // Drawing functions
  const startDrawing = ({ nativeEvent }) => {
    // Allow drawing if no turn system is active OR if it's user's turn
    const currentUserId = user?.id || user?._id;
    if (activeUserId && currentUserId !== activeUserId) return;

    const { offsetX, offsetY } = nativeEvent;
    
    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);

      const newStroke = {
        roomId,
        tool,
        color: tool === "pen" ? brushColor : canvasBackgroundColor,
        size: brushSize,
        points: [{ x: offsetX, y: offsetY }],
      };
      setCurrentStroke(newStroke);
    } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(tool)) {
      setCurrentStroke({
        roomId,
        tool,
        color: brushColor,
        size: brushSize,
        startX: offsetX,
        startY: offsetY,
        endX: offsetX,
        endY: offsetY,
        points: [{ x: offsetX, y: offsetY }, { x: offsetX, y: offsetY }]
      });
      setIsDrawing(true);
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !currentStroke) return;
    const { offsetX, offsetY } = nativeEvent;

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();

      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, { x: offsetX, y: offsetY }]
      }));
    } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(tool)) {
      // Update current stroke end position
      setCurrentStroke(prev => ({
        ...prev,
        endX: offsetX,
        endY: offsetY,
        points: [prev.points[0], { x: offsetX, y: offsetY }]
      }));

      // Redraw canvas with shape preview
      redrawCanvas(strokes);
      
      const ctx = ctxRef.current;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      drawShape(ctx, tool, currentStroke.startX, currentStroke.startY, offsetX, offsetY);
    }
  };

  const stopDrawing = async ({ nativeEvent }) => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.closePath();
      
      if (currentStroke.points.length > 1) {
        await saveStroke(currentStroke);
      }
    } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(tool)) {
      const { offsetX, offsetY } = nativeEvent;
      
      // Create final shape stroke
      const shapeStroke = {
        roomId,
        tool,
        color: brushColor,
        size: brushSize,
        points: [
          { x: currentStroke.startX, y: currentStroke.startY },
          { x: offsetX, y: offsetY }
        ]
      };

      await saveStroke(shapeStroke);
    }

    setCurrentStroke(null);
  };

  // Helper function to save stroke
  const saveStroke = async (stroke) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempStroke = { ...stroke, _id: tempId, isTemp: true };
    setStrokes(prev => [...prev, tempStroke]);

    try {
      const res = await axios.post("/drawings", stroke);
      const saved = res.data;

      setStrokes(prev => prev.map(s => (s._id === tempId ? saved : s)));
      if (socketRef.current) {
        socketRef.current.emit("stroke:new", saved);
      }
    } catch (err) {
      console.error("Failed to save stroke:", err);
      setStrokes(prev => prev.filter(s => s._id !== tempId));
      alert("Failed to save stroke. Try again.");
    }
  };

  // Redraw canvas - FIXED to handle shapes properly
  const redrawCanvas = (allStrokes) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {
      if (stroke.points && stroke.points.length > 0) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (stroke.tool === "pen" || stroke.tool === "eraser") {
          if (stroke.points.length > 1) {
            ctx.beginPath();
            stroke.points.forEach((point, index) => {
              if (index === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.closePath();
          }
        } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(stroke.tool)) {
          if (stroke.points.length >= 2) {
            drawShape(ctx, stroke.tool, stroke.points[0].x, stroke.points[0].y, stroke.points[1].x, stroke.points[1].y);
          }
        }
      }
    });
  };

  useEffect(() => {
    if (ctxRef.current) redrawCanvas(strokes);
  }, [strokes]);

  // Undo functionality
  const handleUndo = async () => {
    const currentUserId = user?.id || user?._id;
    if (strokes.length === 0 || (activeUserId && currentUserId !== activeUserId)) return;

    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));

    try {
      if (lastStroke.isTemp) return;
      
      await axios.delete(`/drawings/${lastStroke._id}`);
      if (socketRef.current) {
        socketRef.current.emit("stroke:delete", { roomId, strokeId: lastStroke._id });
      }
    } catch (err) {
      console.error("Undo failed:", err);
      setStrokes(prev => [...prev, lastStroke]);
      alert("Undo failed. Try again.");
    }
  };

  // Save to gallery
  const saveCanvas = async () => {
    const canvas = canvasRef.current;

    if (!canvas || !roomId) {
      alert("Canvas not ready to save!");
      return;
    }

    try {
      const dataURL = canvas.toDataURL("image/png", 0.8);
      const confirmedStrokes = strokes.filter(s => !s.isTemp);
      await axios.post("/loop", {
        roomId,
        imageData: dataURL,
        strokes: confirmedStrokes,
        caption: `Canvas saved by ${user?.name || user?.username || 'Anonymous'}`,
      });
      alert("Canvas saved to gallery successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save canvas. Please try again.");
    }
  };

  const currentUserId = user?.id || user?._id;
  const canDraw = !activeUserId || currentUserId === activeUserId;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        className={`rounded-lg shadow-lg ${
          canDraw ? "cursor-crosshair" : "opacity-50 cursor-not-allowed"
        }`}
        style={{ backgroundColor: canvasBackgroundColor }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0 || !canDraw}
          className={`px-4 py-2 rounded text-white ${
            strokes.length === 0 || !canDraw
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-400"
          }`}
        >
          Undo
        </button>

        <button
          onClick={saveCanvas}
          className="bg-green-400 text-black px-4 py-2 rounded hover:bg-green-300 shadow"
        >
          Save to Gallery
        </button>
      </div>
    </div>
  );
}
