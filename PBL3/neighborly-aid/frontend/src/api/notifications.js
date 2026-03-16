import axios from "axios";
import config from "../config/config";

// Get user notifications
export const getNotifications = async () => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/notifications`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Get notifications error:", error);
    throw error.response?.data || { error: "Failed to fetch notifications" };
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/api/notifications/unread-count`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Get unread count error:", error);
    throw error.response?.data || { error: "Failed to fetch unread count" };
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.put(
      `${config.API_BASE_URL}/api/notifications/${notificationId}/read`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Mark as read error:", error);
    throw (
      error.response?.data || { error: "Failed to mark notification as read" }
    );
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await axios.put(
      `${config.API_BASE_URL}/api/notifications/mark-all-read`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Mark all as read error:", error);
    throw (
      error.response?.data || {
        error: "Failed to mark all notifications as read",
      }
    );
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(
      `${config.API_BASE_URL}/api/notifications/${notificationId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Delete notification error:", error);
    throw error.response?.data || { error: "Failed to delete notification" };
  }
};
