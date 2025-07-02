const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const auth = require("../middlewares/auth-middleware");

// All routes require authentication
router.use(auth);

// Get user notifications
router.get("/", getUserNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Mark notification as read
router.patch("/:notificationId/read", markAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

module.exports = router;
