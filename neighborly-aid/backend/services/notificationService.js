const Notification = require("../models/Notification");
const User = require("../models/User");
const Task = require("../models/Task");

class NotificationService {
  // Create a new notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      return await notification.populate([
        { path: "recipient", select: "name email" },
        { path: "sender", select: "name email" },
        { path: "task", select: "title" },
      ]);
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, limit = 20) {
    try {
      return await Notification.find({ recipient: userId })
        .populate([
          { path: "sender", select: "name email" },
          { path: "task", select: "title" },
        ])
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
      ).populate([
        { path: "sender", select: "name email" },
        { path: "task", select: "title" },
      ]);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId, userId) {
    try {
      return await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId,
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Helper method to create helper selection notification
  async notifyHelperSelected(taskId, selectedHelperId, taskCreatorId) {
    try {
      const task = await Task.findById(taskId).populate("createdBy", "name");
      const selectedHelper = await User.findById(selectedHelperId, "name");
      const taskCreator = await User.findById(taskCreatorId, "name");

      // Notify the selected helper
      await this.createNotification({
        recipient: selectedHelperId,
        sender: taskCreatorId,
        task: taskId,
        type: "helper_selected",
        title: "You've been selected! 🎉",
        message: `${taskCreator.name} has selected you to help with "${task.title}". The task is now in progress.`,
      });

      // Notify other helpers that they were not selected
      const otherHelpers = task.helpers.filter(
        (helper) => helper.userId.toString() !== selectedHelperId
      );

      for (const helper of otherHelpers) {
        await this.createNotification({
          recipient: helper.userId,
          sender: taskCreatorId,
          task: taskId,
          type: "helper_rejected",
          title: "Helper selection update",
          message: `${taskCreator.name} has selected another helper for "${task.title}". Thank you for offering to help!`,
        });
      }
    } catch (error) {
      console.error("Error creating helper selection notifications:", error);
      throw error;
    }
  }

  // Helper method to create task completion notification
  async notifyTaskCompleted(taskId, completedByUserId) {
    try {
      const task = await Task.findById(taskId)
        .populate("createdBy", "name")
        .populate("selectedHelper", "name");

      const completedBy = await User.findById(completedByUserId, "name");

      // Notify task creator
      if (task.createdBy._id.toString() !== completedByUserId) {
        await this.createNotification({
          recipient: task.createdBy._id,
          sender: completedByUserId,
          task: taskId,
          type: "task_completed",
          title: "Task completed! ✅",
          message: `${completedBy.name} has marked "${task.title}" as completed.`,
        });
      }

      // Notify selected helper if completed by task creator
      if (
        task.selectedHelper &&
        task.selectedHelper._id.toString() !== completedByUserId
      ) {
        await this.createNotification({
          recipient: task.selectedHelper._id,
          sender: completedByUserId,
          task: taskId,
          type: "task_completed",
          title: "Task completed! ✅",
          message: `${completedBy.name} has marked "${task.title}" as completed.`,
        });
      }
    } catch (error) {
      console.error("Error creating task completion notifications:", error);
      throw error;
    }
  }

  // Helper method to create new helper offered notification
  async notifyNewHelperOffered(taskId, helperUserId) {
    try {
      const task = await Task.findById(taskId).populate("createdBy", "name");
      const helper = await User.findById(helperUserId, "name");

      await this.createNotification({
        recipient: task.createdBy._id,
        sender: helperUserId,
        task: taskId,
        type: "new_helper_offered",
        title: "New helper offered! 🤝",
        message: `${helper.name} has offered to help with "${task.title}".`,
      });
    } catch (error) {
      console.error("Error creating new helper notification:", error);
      throw error;
    }
  }

  // Helper method to notify when helper marks task as completed
  async notifyHelperMarkedTaskComplete(taskId, helperUserId) {
    try {
      const task = await Task.findById(taskId).populate("createdBy", "name");
      const helper = await User.findById(helperUserId, "name");

      await this.createNotification({
        recipient: task.createdBy._id,
        sender: helperUserId,
        task: taskId,
        type: "helper_marked_complete",
        title: "Task marked as completed! ⏳",
        message: `${helper.name} has marked "${task.title}" as completed. Please review and approve.`,
      });
    } catch (error) {
      console.error(
        "Error creating helper marked complete notification:",
        error
      );
      throw error;
    }
  }

  // Helper method to notify when task completion is rejected
  async notifyTaskCompletionRejected(taskId, requesterId) {
    try {
      const task = await Task.findById(taskId)
        .populate("createdBy", "name")
        .populate("helpers.userId", "name");

      const requester = await User.findById(requesterId, "name");
      // Find the selected helper (who was previously completed but now reset to selected)
      const selectedHelper = task.helpers.find(
        (helper) => helper.status === "selected"
      );

      if (selectedHelper) {
        await this.createNotification({
          recipient: selectedHelper.userId._id,
          sender: requesterId,
          task: taskId,
          type: "completion_rejected",
          title: "Task completion rejected ❌",
          message: `${requester.name} has rejected the completion of "${task.title}". Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error creating completion rejected notification:", error);
      throw error;
    }
  }

  // Notify both users about karma transfer after task completion
  async notifyKarmaTransferred({
    taskId,
    taskTitle,
    points,
    fromUserId,
    toUserId,
  }) {
    try {
      // Notify helper (receiver)
      await this.createNotification({
        recipient: toUserId,
        sender: fromUserId,
        task: taskId,
        type: "task_completed", // Reuse type for now
        title: "Karma Received! 🌟",
        message: `You have received ${points} karma points for helping with "${taskTitle}".`,
      });
      // Notify requester (giver)
      await this.createNotification({
        recipient: fromUserId,
        sender: toUserId,
        task: taskId,
        type: "task_completed", // Reuse type for now
        title: "Karma Given! 💸",
        message: `You have given ${points} karma points for completion of "${taskTitle}".`,
      });
    } catch (error) {
      console.error("Error creating karma transfer notifications:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
