// ============= FIXED RoomPage.jsx =============
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import CanvasBoard from "./CanvasBoard";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import axios from "../utils/axios";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Room state
  const [players, setPlayers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState("pen");
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch current user
        console.log("Fetching user data...");
        const userRes = await axios.get("/userRoutes/me");
        const userData = userRes.data;
        
        // Ensure user has proper ID structure
        const normalizedUser = {
          ...userData,
          id: userData._id || userData.id, // Ensure both id and _id are available
          _id: userData._id || userData.id,
          username: userData.username || userData.name || userData.email?.split('@')[0],
          name: userData.name || userData.username
        };
        
        console.log("User data fetched:", normalizedUser);
        setUser(normalizedUser);

        // Fetch room data if roomId exists
        if (roomId && roomId !== 'defaultRoom') {
          console.log("Fetching room data for:", roomId);
          const roomRes = await axios.get(`/rooms`);
          const foundRoom = roomRes.data.find(r => r._id === roomId);
          
          if (!foundRoom) {
            setError("Room not found!");
            return;
          }
          
          if (!foundRoom.isActive) {
            setError("This room is not active!");
            return;
          }
          
          setRoom(foundRoom);
          console.log("Room data fetched:", foundRoom);
        } else {
          // Default room for testing
          setRoom({
            _id: roomId || 'defaultRoom',
            name: 'Default Test Room',
            isActive: true
          });
        }

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to load room data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [roomId]);

  // Socket connection and event handling
  useEffect(() => {
    if (!user || !room || error) return;

    console.log("Initializing socket connection...");
    console.log("User for socket:", { id: user.id, _id: user._id, username: user.username });

    const newSocket = io("http://localhost:3001", { 
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true // Force new connection
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("RoomPage socket connected:", newSocket.id);
      
      // Join room with proper user data
      const joinData = {
        roomId: room._id,
        userId: user._id, // Use _id for consistency
        username: user.username,
        avatar: user.avatar || null
      };
      
      console.log("Joining room with data:", joinData);
      newSocket.emit("joinRoom", joinData);
    });

    // Socket event listeners
    newSocket.on("roomUsers", (users) => {
      console.log("Room users updated:", users);
      setPlayers(users || []);
    });

    newSocket.on("turn:started", ({ userId, username, duration }) => {
      console.log("Turn started:", { userId, username, duration });
      setActiveUser({ id: userId, name: username });
      setRemainingTime(duration);
    });

    newSocket.on("turn:update", ({ remaining }) => {
      setRemainingTime(remaining);
    });

    newSocket.on("turn:ended", ({ nextUserId, nextUsername }) => {
      console.log("Turn ended, next user:", { nextUserId, nextUsername });
      setActiveUser({ id: nextUserId, name: nextUsername });
    });

    newSocket.on("welcomeMessage", (data) => {
      console.log("Welcome message:", data);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      setError(error.message || "Socket connection error");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to server");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection...");
      if (newSocket && newSocket.connected) {
        newSocket.emit("leaveRoom", { 
          roomId: room._id, 
          userId: user._id 
        });
        newSocket.disconnect();
      }
    };
  }, [user, room, error]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate("/my-room")}
            className="bg-blue-500 hover:bg-blue-400 px-6 py-2 rounded"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!user || !room) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if current user is the room creator
  const isCreator = room.creator && 
    ((typeof room.creator === 'object' && room.creator._id === user._id) || 
     (room.creator === user._id));

  const currentUserId = user._id; // Use _id consistently
  const isMyTurn = activeUser?.id === currentUserId;

  console.log("Render state:", {
    currentUserId,
    activeUserId: activeUser?.id,
    isMyTurn,
    playersCount: players.length
  });

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Room Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 p-3 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-bold">{room.name}</h1>
          <div className="flex items-center gap-4 text-sm">
            {isCreator && room.code && (
              <span className="text-green-400">
                Code: <span className="font-mono">{room.code}</span>
              </span>
            )}
            <span className="text-gray-300">
              Players: {players.length}
            </span>
            <span className="text-gray-300">
              Status: <span className={room.isActive ? "text-green-400" : "text-red-400"}>
                {room.isActive ? "Active" : "Inactive"}
              </span>
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <p className={`font-semibold ${isMyTurn ? 'text-green-400' : 'text-yellow-400'}`}>
            {isMyTurn ? "🎨 Your Turn!" : `${activeUser?.name || "Someone"}'s Turn`}
          </p>
          <p className="text-sm text-gray-300">
            Timer: {remainingTime}s remaining
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/my-room")}
            className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded transition-colors"
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
          user={user} // Pass the normalized user object
          setRemainingTime={setRemainingTime}
          activeUser={activeUser}
          socket={socket}
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
            user={user} // Pass the normalized user object
            roomUsers={players}
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
          <div>Players: {players.length}</div>
          <div>Socket Connected: {socket?.connected?.toString()}</div>
        </div>
      )}
    </div>
  );
}
