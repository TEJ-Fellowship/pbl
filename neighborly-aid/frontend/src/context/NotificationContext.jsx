import React, { createContext, useContext, useState, useEffect } from "react";
import { getUnreadCount } from "../api/notifications";
import AuthContext from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext); // get user from auth context
  const [unreadCount, setUnreadCount] = useState(0);

  // Refetch unread count whenever user changes (login/logout)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };
    fetchUnreadCount();
  }, [user]);

  // Update unread count
  const updateUnreadCount = (newCount) => {
    setUnreadCount(newCount);
  };

  // Increment unread count (for new notifications)
  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  // Decrement unread count (when marking as read)
  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Reset unread count (when marking all as read)
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const value = {
    unreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
