// Fixed context/SocketContext.jsx - Centralized Socket Management
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);

  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

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
}

// Custom hook for easy access
export function useSocket() {
  return useContext(SocketContext);
}
