import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const socketRef = useRef(null); // useRef ensures single socket instance
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomUsers, setRoomUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [remainingTime, setRemainingTime] = useState(30);

  useEffect(() => {
    if (!socketRef.current) {
      const newSocket = io("http://localhost:3001", {
        withCredentials: true,
        transports: ["websocket", "polling"],
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
        setRoomUsers(users || []);
      });

      newSocket.on("turn:started", ({ userId, username, duration }) => {
        setActiveUser({ id: userId, name: username });
        setRemainingTime(duration);
      });

      newSocket.on("turn:update", ({ remaining }) => setRemainingTime(remaining));
      newSocket.on("turn:ended", ({ nextUserId, nextUsername }) =>
        setActiveUser({ id: nextUserId, name: nextUsername })
      );

      newSocket.on("welcomeMessage", (data) => console.log("Welcome message:", data));
      newSocket.on("error", (err) => console.error("Socket error:", err));

      socketRef.current = newSocket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinRoom = (roomData) => {
    if (!socketRef.current || !isConnected) return;
    if (currentRoom === roomData.roomId) return; // ✅ guard against duplicate joins

    socketRef.current.emit("joinRoom", roomData);
    setCurrentRoom(roomData.roomId);
  };

  const leaveRoom = (roomId, userId) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit("leaveRoom", { roomId, userId });
    setCurrentRoom(null);
    setRoomUsers([]);
    setActiveUser(null);
  };

  const emitDrawingEvent = (eventName, data) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit(eventName, data);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        currentRoom,
        roomUsers,
        activeUser,
        remainingTime,
        setRemainingTime,
        joinRoom,
        leaveRoom,
        emitDrawingEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
