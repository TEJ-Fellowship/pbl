import { useState, useEffect, createContext } from "react";
import { socket } from "../utils/socket";
import { useAuth } from "../context/authContext.jsx";
import { toast } from "react-toastify";
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const userData = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userData) return;

    socket.on("rippleNotification", (data) => {
      console.log("global", data);
      setNotifications((prev) => [
        {
          userId: data.userId,
          message: data.message,
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          type: "global_ripple",
          rippleId: data.rippleId,
        },
        ...prev,
      ]);
    });

    socket.on("sendRippleFriends", (data) => {
      if (data.fromUserId !== userData.user.userId) {
        toast.success(`${data.fromUsername} ${data.message}`);
      }
      console.log("friend", data);
      setNotifications((prev) => [
        {
          userId: data.userId,
          message: data.message,
          fromUserId: data.fromUserId,
          rippleId: data.rippleId,
          fromUsername: data.fromUsername,
          type: "friend_ripple",
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("rippleNotification");
      socket.off("sendRippleFriends");
    };
  }, [userData]);

  return (
    <SocketContext.Provider value={{ notifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
