// Fixed CanvasBoard.jsx - Using centralized socket
import React, { useRef, useEffect, useState } from "react";
import axios from "../utils/axios";
import { useSocket } from "../context/SocketContext";

export default function CanvasBoard({ 
  brushColor, 
  brushSize, 
  tool, 
  roomId, 
  user, 
  canvasBackgroundColor = "#ffffff" 
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const { socket, activeUser, emitDrawingEvent } = useSocket();

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

  // Canvas resize function
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const leftSidebar = document.getElementById("left-sidebar");
    const rightSidebar = document.getElementById("right-sidebar");

    const leftWidth = leftSidebar ? leftSidebar.offsetWidth : 64;
    const rightWidth = rightSidebar ? rightSidebar.offsetWidth : 320;

    canvas.width = window.innerWidth - leftWidth - rightWidth - 40;
    canvas.height = window.innerHeight - 140;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (strokes.length > 0) {
      redrawCanvas(strokes);
    }
  };

  // Initialize canvas
  useEffect(() => {
    resizeCanvas();
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    // Fetch existing strokes
    const fetchStrokes = async () => {
      try {
        if (!roomId) return;
        const res = await axios.get(`/drawings/${roomId}`);
        console.log("Fetched strokes:", res.data);
        setStrokes(res.data || []);
      } catch (err) {
        console.error("Failed to load strokes:", err);
      }
    };

    if (roomId) fetchStrokes();

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [roomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleStrokeCreated = (payload) => {
      console.log("Received new stroke:", payload);
      if (!payload) return;
      setStrokes(prev => {
        if (payload._id && prev.some(s => s._id === payload._id)) return prev;
        return [...prev, payload];
      });
    };

    const handleStrokeDeleted = ({ strokeId }) => {
      console.log("Stroke deleted:", strokeId);
      setStrokes(prev => prev.filter(s => s._id !== strokeId));
    };

    socket.on("stroke:created", handleStrokeCreated);
    socket.on("stroke:deleted", handleStrokeDeleted);

    return () => {
      socket.off("stroke:created", handleStrokeCreated);
      socket.off("stroke:deleted", handleStrokeDeleted);
    };
  }, [socket]);

  // Update canvas background when prop changes
  useEffect(() => {
    if (ctxRef.current) {
      redrawCanvas(strokes);
    }
  }, [canvasBackgroundColor, strokes]);

  // Update drawing context properties
  useEffect(() => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = tool === "pen" ? brushColor : canvasBackgroundColor;
    ctxRef.current.lineWidth = brushSize;
  }, [brushColor, brushSize, tool, canvasBackgroundColor]);

  // Fixed shape drawing function
  const drawShape = (ctx, shapeType, startX, startY, endX, endY, strokeColor, strokeSize) => {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
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
    ctx.restore();
  };

  // Check if user can draw
  const canDraw = () => {
    const currentUserId = user?.id || user?._id;
    return !activeUser || activeUser.id === currentUserId;
  };

  // Drawing event handlers
  const startDrawing = ({ nativeEvent }) => {
    if (!canDraw()) return;

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
    if (!isDrawing || !currentStroke || !canDraw()) return;
    const { offsetX, offsetY } = nativeEvent;

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();

      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, { x: offsetX, y: offsetY }]
      }));
    } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(tool)) {
      setCurrentStroke(prev => ({
        ...prev,
        endX: offsetX,
        endY: offsetY,
        points: [prev.points[0], { x: offsetX, y: offsetY }]
      }));

      redrawCanvas(strokes);
      drawShape(ctxRef.current, tool, currentStroke.startX, currentStroke.startY, offsetX, offsetY, brushColor, brushSize);
    }
  };

  const stopDrawing = async ({ nativeEvent }) => {
    if (!isDrawing || !currentStroke || !canDraw()) return;

    setIsDrawing(false);

    if (tool === "pen" || tool === "eraser") {
      ctxRef.current.closePath();
      
      if (currentStroke.points.length > 1) {
        await saveStroke(currentStroke);
      }
    } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(tool)) {
      const { offsetX, offsetY } = nativeEvent;
      
      const shapeStroke = {
        roomId,
        tool,
        color: brushColor,
        size: brushSize,
        startX: currentStroke.startX,
        startY: currentStroke.startY,
        endX: offsetX,
        endY: offsetY,
        points: [
          { x: currentStroke.startX, y: currentStroke.startY },
          { x: offsetX, y: offsetY }
        ]
      };

      await saveStroke(shapeStroke);
    }

    setCurrentStroke(null);
  };

  // Save stroke to database and emit to other users
  const saveStroke = async (stroke) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempStroke = { ...stroke, _id: tempId, isTemp: true };
    setStrokes(prev => [...prev, tempStroke]);

    try {
      const res = await axios.post("/drawings", stroke);
      const saved = res.data;

      setStrokes(prev => prev.map(s => (s._id === tempId ? saved : s)));
      
      // Emit to other users via centralized socket
      emitDrawingEvent("stroke:new", saved);
    } catch (err) {
      console.error("Failed to save stroke:", err);
      setStrokes(prev => prev.filter(s => s._id !== tempId));
      alert("Failed to save stroke. Try again.");
    }
  };

  // Redraw entire canvas
  const redrawCanvas = (allStrokes) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {
      if (stroke.points && stroke.points.length > 0) {
        if (stroke.tool === "pen" || stroke.tool === "eraser") {
          if (stroke.points.length > 1) {
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            
            ctx.beginPath();
            stroke.points.forEach((point, index) => {
              if (index === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.restore();
          }
        } else if (["circle", "square", "rectangle", "triangle", "hexagon", "star"].includes(stroke.tool)) {
          if (stroke.points.length >= 2 || (stroke.startX !== undefined && stroke.endX !== undefined)) {
            const startX = stroke.startX || stroke.points[0].x;
            const startY = stroke.startY || stroke.points[0].y;
            const endX = stroke.endX || stroke.points[1].x;
            const endY = stroke.endY || stroke.points[1].y;
            
            drawShape(ctx, stroke.tool, startX, startY, endX, endY, stroke.color, stroke.size);
          }
        }
      }
    });
  };

  // Undo last stroke
  const handleUndo = async () => {
    if (strokes.length === 0 || !canDraw()) return;

    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));

    try {
      if (lastStroke.isTemp) return;
      
      await axios.delete(`/drawings/${lastStroke._id}`);
      emitDrawingEvent("stroke:delete", { roomId, strokeId: lastStroke._id });
    } catch (err) {
      console.error("Undo failed:", err);
      setStrokes(prev => [...prev, lastStroke]);
      alert("Undo failed. Try again.");
    }
  };

  // Save canvas to gallery
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

  const userCanDraw = canDraw();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        className={`rounded-lg shadow-lg ${
          userCanDraw ? "cursor-crosshair" : "opacity-50 cursor-not-allowed"
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
          disabled={strokes.length === 0 || !userCanDraw}
          className={`px-4 py-2 rounded text-white ${
            strokes.length === 0 || !userCanDraw
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