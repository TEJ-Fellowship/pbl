import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      query: { userId: currentUser.user_id },
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
