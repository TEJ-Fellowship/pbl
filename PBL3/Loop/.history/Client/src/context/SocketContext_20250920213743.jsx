// SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Socket token:", token);

    const s = io("http://localhost:3001", {
      // useful options while developing:
      transports: ["websocket"], // skip long-polling during debug
      withCredentials: true,
      auth: { token },
      query: { token }, // fallback if needed
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // helpful debug handlers
    s.on("connect", () => console.log("Socket connected (client):", s.id));
    s.on("connect_error", (err) =>
      console.error("Socket connect_error (client):", err?.message || err)
    );
    s.on("error", (err) => console.error("Socket error (client):", err));

    setSocket(s);

    return () => {
      s.off("connect");
      s.off("connect_error");
      s.off("error");
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
