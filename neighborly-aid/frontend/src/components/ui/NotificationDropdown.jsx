import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Clock, CheckCircle, User, Star, MapPin } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../api/notifications";
import { useNotifications } from "../../context/NotificationContext";
import { toast } from "react-hot-toast";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { unreadCount, decrementUnreadCount, resetUnreadCount } =
    useNotifications();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const notificationsData = await getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      decrementUnreadCount();
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Handle clicking on notification (mark as read)
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    // Close dropdown after clicking notification (like Facebook)
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      resetUnreadCount();
      toast.success("All notifications marked as read");
      // Close dropdown after marking all as read (like Facebook)
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "helper_selected":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "helper_rejected":
        return <X className="w-5 h-5 text-red-500" />;
      case "task_completed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "new_helper_offered":
        return <User className="w-5 h-5 text-purple-500" />;
      case "task_liked":
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case "helper_selected":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
      case "helper_rejected":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "task_completed":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "new_helper_offered":
        return "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
      case "task_liked":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "border-l-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Check if notification is very recent (within 5 minutes)
  const isVeryRecent = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return diffInMinutes < 5;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-colors ${
          unreadCount > 0
            ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        <Bell
          className={`w-6 h-6 ${unreadCount > 0 ? "animate-bounce" : ""}`}
        />
        {unreadCount > 0 && (
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg border-2 border-white dark:border-slate-800 font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">
                  You'll see notifications here when they arrive
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-l-4 transition-all duration-300 ease-in-out ${getNotificationColor(
                      notification.type
                    )} ${
                      !notification.isRead
                        ? "bg-opacity-100 cursor-pointer hover:bg-opacity-90 ring-2 ring-red-200 dark:ring-red-800 transform hover:scale-[1.02]"
                        : "bg-opacity-50"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1 relative">
                        {getNotificationIcon(notification.type)}
                        {!notification.isRead && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.isRead
                                    ? "text-slate-900 dark:text-white font-semibold"
                                    : "text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {notification.title}
                              </p>
                              {!notification.isRead &&
                                isVeryRecent(notification.createdAt) && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
                                    NEW
                                  </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
