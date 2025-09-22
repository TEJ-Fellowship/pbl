// Fixed context/SocketContext.jsx - Centralized Socket Management
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);

  useEffect(() => {
<<<<<<< HEAD
    const token = localStorage.getItem("token"); // use localStorage
    if (!token) return;
=======
    const newSocket = io("http://localhost:3001", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("Global socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Global socket disconnected");
      setIsConnected(false);
    });

    // Room events
    newSocket.on("roomUsers", (users) => {
      console.log("Room users updated:", users);
      setRoomUsers(users || []);
    });

    // Turn events
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
    });

    setSocket(newSocket);
>>>>>>> b57b1e8dfa40ed86c21bbcc93daca1f6a139f61f

    const s = io("http://localhost:3001", {
      auth: { token },
    });

    s.on("connect", () => console.log("✅ Socket connected:", s.id));
    s.on("disconnect", () => console.log("❌ Socket disconnected"));

    setSocket(s);
    return () => s.disconnect();
  }, []);

  const joinRoom = (roomData) => {
    if (socket && isConnected) {
      console.log("Joining room:", roomData);
      setCurrentRoom(roomData.roomId);
      socket.emit("joinRoom", roomData);
    }
  };

  const leaveRoom = (roomId, userId) => {
    if (socket && isConnected) {
      console.log("Leaving room:", roomId);
      socket.emit("leaveRoom", { roomId, userId });
      setCurrentRoom(null);
      setRoomUsers([]);
      setActiveUser(null);
    }
  };

  const emitDrawingEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      currentRoom,
      roomUsers,
      activeUser,
      remainingTime,
      setRemainingTime,
      joinRoom,
      leaveRoom,
      emitDrawingEvent
    }}>
      {children}
    </SocketContext.Provider>
  );
<<<<<<< HEAD
};

export const useSocket = () => useContext(SocketContext);
=======
};
>>>>>>> b57b1e8dfa40ed86c21bbcc93daca1f6a139f61f
