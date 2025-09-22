// Fixed RoomPage.jsx - Using centralized socket context
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Home from "./Home";
import api from "../utils/axios";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // Get socket context
  const { 
    isConnected, 
    roomUsers, 
    activeUser, 
    remainingTime, 
    setRemainingTime,
    joinRoom,
    leaveRoom 
  } = useSocket();

  // Fetch initial data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get("/rooms");
        const found = res.data.find((r) => r._id === id);
        setRoom(found || null);
      } catch (err) {
        console.error("Failed to fetch room", err);
        setRoom(null);
      }
    };
    fetchRoom();
  }, [id]);

  const leaveRoom = async () => {
    try {
      await api.patch(`/rooms/${id}/deactivate`);
    } catch (err) {
      console.error("Failed to leave room", err);
    }
    navigate("/my-room");
  };

  const copyToClipboard = async (text) => {
    if (!text) return false;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.error("Fallback copy failed", e);
      return false;
    }
  };

  const handleInvite = async () => {
    if (!room?.code) {
      alert("No room code available to copy!");
      return;
    }
    const ok = await copyToClipboard(room.code);
    if (ok) alert(`Room code "${room.code}" copied! 📋`);
    else alert("Couldn't copy automatically. Please copy manually: " + room.code);
  };

  if (!room) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-white bg-[#0f1c14]">
        <p className="mb-4">Room not found 😢</p>
        <button
          onClick={() => navigate("/my-room")}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  // Check if current user is the room creator
  const isCreator = room.creator && 
    ((typeof room.creator === 'object' && room.creator._id === user._id) || 
     (room.creator === user._id));

  const currentUserId = user._id;
  const isMyTurn = activeUser?.id === currentUserId;

  const handleLeaveRoom = () => {
    leaveRoom(room._id, user._id);
    navigate("/my-room");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-50">
          Reconnecting to server...
        </div>
      )}

      {/* Room Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 p-3 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">{room.name}</h2>
          <p className="text-sm text-gray-400">
            {room.users?.length || 0} participant
            {(room.users?.length || 0) !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Room Code: <span className="font-mono">{room.code}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleInvite}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg"
          >
            Invite
          </button>
          <button
            onClick={leaveRoom}
            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-20">
        {/* Left Sidebar */}
        <div id="left-sidebar">
          <LeftSidebar tool={tool} setTool={setTool} />
        </div>

        {/* Canvas */}
        <CanvasBoard
          brushColor={brushColor}
          brushSize={brushSize}
          tool={tool}
          roomId={room._id}
          user={user}
          setRemainingTime={setRemainingTime}
          canvasBackgroundColor={canvasBackgroundColor}
        />

        {/* Right Sidebar */}
        <div id="right-sidebar">
          <RightSidebar
            brushColor={brushColor}
            setBrushColor={setBrushColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            remainingTime={remainingTime}
            activeUser={activeUser}
            user={user}
            roomUsers={roomUsers}
            canvasBackgroundColor={canvasBackgroundColor}
            setCanvasBackgroundColor={setCanvasBackgroundColor}
          />
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>User ID: {currentUserId}</div>
          <div>Active User ID: {activeUser?.id}</div>
          <div>Is My Turn: {isMyTurn.toString()}</div>
          <div>Players: {roomUsers.length}</div>
          <div>Socket Connected: {isConnected.toString()}</div>
        </div>
      )}
    </div>
  );
}