const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const Category = require("../models/Category");
const notificationService = require("./notificationService");
const categoryService = require("./categoryService");
const {
  OPEN,
  IN_PROGRESS,
  COMPLETED,
  ACTIVE,
  PENDING,
  SELECTED,
  REJECTED,
  AWAITING_APPROVAL,
} = require("../utils/constants");
const karmaService = require("./karmaService");

class TaskService {
  // Create a new task
  async createTask(taskData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate user has enough karma points
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      const taskKarmaPoints = parseInt(taskData.taskKarmaPoints) || 0;

      if (user.karmaPoints < taskKarmaPoints) {
        throw new Error(
          `Insufficient karma points. You have ${user.karmaPoints} but need ${taskKarmaPoints}`
        );
      }

      // Deduct karma points from user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { karmaPoints: -taskKarmaPoints } },
        { new: true, session }
      );

      // Create the task
      const task = new Task({
        ...taskData,
        createdBy: userId,
      });
      const savedTask = await task.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      console.log(
        `Task created successfully. ${taskKarmaPoints} karma points deducted from user ${user.name}. Remaining karma: ${updatedUser.karmaPoints}`
      );

      // Return populated task
      return await this.getTaskById(savedTask._id);
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Task creation failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
    try {
      // Validate category exists
      const category = await Category.findById(taskData.category);
      if (!category || !category.isActive) {
        throw new Error("Invalid or inactive category");
      }

      const task = new Task({
        ...taskData,
        createdBy: userId,
      });

      const savedTask = await task.save();

      // Update category usage statistics
      await categoryService.updateCategoryUsage(taskData.category);

      return savedTask;
    } catch (error) {
      throw new Error(`Error creating task: ${error.message}`);
    }
  }

  // Get all tasks with optional filters
  async getTasks(filters = {}) {
    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build the filter conditions
    let filterConditions = { ...filters };

    // Filter out completed tasks that are older than 24 hours
    // This means we only show:
    // 1. Non-completed tasks (open, in_progress)
    // 2. Completed tasks that were completed within the last 24 hours
    filterConditions.$or = [
      { status: { $ne: COMPLETED } }, // Non-completed tasks
      {
        status: COMPLETED,
        completedAt: { $gte: twentyFourHoursAgo }, // Completed tasks within last 24 hours
      },
    ];

    try {
      let query = Task.find(filters)
        .populate("createdBy", "name email karmaPoints totalLikes")
        .populate("helpers.userId", "name email")
        .populate("likedBy", "name email")
        .populate("selectedHelper", "name email")
        .populate("category", "name displayName icon color") // Populate category
        .sort({ createdAt: -1 });

      const tasks = await query;
      return tasks;
    } catch (error) {
      throw new Error(`Error fetching tasks: ${error.message}`);
    }
  }

  // Get task by ID
  async getTaskById(taskId) {
    return await Task.findById(taskId)
      .populate("createdBy", "name email karmaPoints totalLikes")
      .populate("helpers.userId", "name email")
      .populate("selectedHelper", "name email")
      .populate("likedBy", "name email");
  }

  // Update task
  async updateTask(taskId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the task to check ownership and current state
      const task = await Task.findById(taskId).session(session);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is the task creator
      if (task.createdBy.toString() !== userId) {
        throw new Error("Only the task creator can update this task");
      }

      // Check if task is not completed (completed tasks cannot be updated)
      if (task.status === COMPLETED) {
        throw new Error("Cannot update completed tasks");
      }

      // Check if task is in progress (tasks with selected helpers cannot be updated)
      if (task.status === IN_PROGRESS) {
        throw new Error("Cannot update tasks that are in progress");
      }

      // Handle karma points adjustment if taskKarmaPoints is being updated
      const newKarmaPoints = updateData.taskKarmaPoints;
      const currentKarmaPoints = task.taskKarmaPoints || 0;

      if (
        newKarmaPoints !== undefined &&
        newKarmaPoints !== currentKarmaPoints
      ) {
        // Validate new karma points
        if (newKarmaPoints < 10) {
          throw new Error("Minimum karma points required is 10");
        }
        if (newKarmaPoints > 5000) {
          throw new Error("Maximum karma points allowed is 5000");
        }

        // Get user to check current karma balance
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        // Calculate karma adjustment
        const karmaDifference = newKarmaPoints - currentKarmaPoints;
        const availableKarma = user.karmaPoints + currentKarmaPoints; // Available karma + current task karma

        if (newKarmaPoints > availableKarma) {
          throw new Error(
            `Insufficient karma points. You have ${user.karmaPoints} available karma plus ${currentKarmaPoints} from this task. Total available: ${availableKarma}, Required: ${newKarmaPoints}`
          );
        }

        // Adjust user's karma points
        await User.findByIdAndUpdate(
          userId,
          { $inc: { karmaPoints: -karmaDifference } },
          { session }
        );

        console.log(
          `Task karma updated: ${currentKarmaPoints} → ${newKarmaPoints}. Karma adjustment: ${karmaDifference}`
        );
      }

      // Update the task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { ...updateData },
        { new: true, runValidators: true, session }
      ).populate("createdBy helpers.userId", "name email");

      // Commit the transaction
      await session.commitTransaction();

      return updatedTask;
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Task update failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Accept task
  async acceptTask(taskId, userId) {
    try {
      // Validate task exists
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if task is open
      if (task.status !== OPEN) {
        throw new Error("Task is not available for help");
      }

      // Check if user is not the task creator
      if (task.createdBy.toString() === userId) {
        throw new Error("You cannot help with your own task");
      }

      // Check if user already helping
      const alreadyHelping = task.helpers.some(
        (helper) => helper.userId.toString() === userId
      );
      if (alreadyHelping) {
        throw new Error("You are already helping with this task");
      }

      // Only add helper, do NOT change task status here
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $push: {
            helpers: {
              userId: new mongoose.Types.ObjectId(userId),
              acceptedAt: new Date(),
              status: PENDING,
            },
          },
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "createdBy", select: "name email" },
        {
          path: "helpers.userId",
          select: "name email address location karmaPoints totalLikes badges",
        },
      ]);

      // Create notification for new helper offered
      await notificationService.notifyNewHelperOffered(taskId, userId);

      return updatedTask;
    } catch (error) {
      console.error("Error in acceptTask:", error);
      throw error;
    }
  }

  // Complete task
  async completeTask(taskId, userId) {
    try {
      // Validate task exists
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is authorized to complete the task
      const isCreator = task.createdBy.toString() === userId;
      const isSelectedHelper = task.helpers.some(
        (helper) =>
          helper.userId.toString() === userId && helper.status === "selected"
      );

      if (!isCreator && !isSelectedHelper) {
        throw new Error(
          "Only the task creator or selected helper can complete this task"
        );
      }

      // Check if task is in progress
      console.log("Task status:", task.status, "Expected: in_progress");
      if (task.status !== "in_progress") {
        throw new Error("Only tasks in progress can be completed");
      }

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          status: COMPLETED,
          completedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).populate("createdBy helpers.userId", "name email");

      // Create notification for task completion
      await notificationService.notifyTaskCompleted(taskId, userId);

      return updatedTask;
    } catch (error) {
      console.error("Error in completeTask:", error);
      throw error;
    }
  }

  // Remove help
  async removeHelp(taskId, userId) {
    try {
      // Validate task exists
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is helping with this task
      const isHelping = task.helpers.some(
        (helper) => helper.userId.toString() === userId
      );
      if (!isHelping) {
        throw new Error("You are not helping with this task");
      }

      // Remove user from helpers array
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $pull: {
            helpers: {
              userId: new mongoose.Types.ObjectId(userId),
            },
          },
          // If no more helpers, set status back to open
          ...(task.helpers.length === 1 && { status: OPEN }),
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "createdBy", select: "name email" },
        { path: "helpers.userId", select: "name email" },
      ]);

      return updatedTask;
    } catch (error) {
      console.error("Error in removeHelp:", error);
      throw error;
    }
  }

  // Delete task
  async deleteTask(taskId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the task to check karma points and ownership
      const task = await Task.findById(taskId).session(session);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is the task creator
      if (task.createdBy.toString() !== userId) {
        throw new Error("Only the task creator can delete this task");
      }

      // Check if task is not completed (completed tasks shouldn't be refunded)
      if (task.status === COMPLETED) {
        throw new Error("Cannot delete completed tasks");
      }

      // Check if task is not in progress (tasks with selected helpers cannot be deleted)
      if (task.status === IN_PROGRESS) {
        throw new Error(
          "Cannot delete tasks that are in progress. Please cancel the task instead."
        );
      }

      const taskKarmaPoints = task.taskKarmaPoints || 0;

      // Refund karma points to the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { karmaPoints: taskKarmaPoints } },
        { new: true, session }
      );

      // Delete the task
      await Task.findByIdAndDelete(taskId, { session });

      // Commit the transaction
      await session.commitTransaction();

      console.log(
        `Task deleted successfully. ${taskKarmaPoints} karma points refunded to user. New karma balance: ${updatedUser.karmaPoints}`
      );

      return { success: true, refundedKarma: taskKarmaPoints };
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Task deletion failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Cancel task (refund karma if no helpers are selected)
  async cancelTask(taskId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the task to check karma points and ownership
      const task = await Task.findById(taskId).session(session);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is the task creator
      if (task.createdBy.toString() !== userId) {
        throw new Error("Only the task creator can cancel this task");
      }

      // Check if task is not completed
      if (task.status === COMPLETED) {
        throw new Error("Cannot cancel completed tasks");
      }

      // Check if task is not in progress (if helpers are working, can't cancel)
      if (task.status === IN_PROGRESS) {
        throw new Error("Cannot cancel tasks that are in progress");
      }

      const taskKarmaPoints = task.taskKarmaPoints || 0;

      // Refund karma points to the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { karmaPoints: taskKarmaPoints } },
        { new: true, session }
      );

      // Delete the task
      await Task.findByIdAndDelete(taskId, { session });

      // Commit the transaction
      await session.commitTransaction();

      console.log(
        `Task cancelled successfully. ${taskKarmaPoints} karma points refunded to user. New karma balance: ${updatedUser.karmaPoints}`
      );

      return { success: true, refundedKarma: taskKarmaPoints };
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Task cancellation failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get tasks by user (either created or accepted)
  async getUserTasks(userId, type = "created") {
    const filter =
      type === "created"
        ? { createdBy: new mongoose.Types.ObjectId(userId) }
        : { "helpers.userId": new mongoose.Types.ObjectId(userId) };

    return await Task.find(filter)
      .populate("createdBy helpers.userId", "name email karmaPoints totalLikes")
      .populate("likedBy", "name email")
      .sort({ createdAt: -1 });
  }

  // Get tasks by category
  async getTasksByCategory(category) {
    try {
      // Calculate the date 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Filter conditions for category and completed task time limit
      const filterConditions = {
        category,
        $or: [
          { status: { $ne: COMPLETED } }, // Non-completed tasks
          {
            status: COMPLETED,
            completedAt: { $gte: twentyFourHoursAgo }, // Completed tasks within last 24 hours
          },
        ],
      };

      const tasks = await Task.find(filterConditions)
        .populate("createdBy", "name email")
        .populate("helpers.userId", "name email")
        .sort({ createdAt: -1 });
      return tasks;
    } catch (error) {
      throw new Error(`Error fetching tasks by category: ${error.message}`);
    }
  }

  // Get tasks by urgency
  async getTasksByUrgency(urgency) {
    try {
      // Calculate the date 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Filter conditions for urgency and completed task time limit
      const filterConditions = {
        urgency,
        $or: [
          { status: { $ne: COMPLETED } }, // Non-completed tasks
          {
            status: COMPLETED,
            completedAt: { $gte: twentyFourHoursAgo }, // Completed tasks within last 24 hours
          },
        ],
      };

      const tasks = await Task.find(filterConditions)
        .populate("createdBy", "name email")
        .populate("helpers.userId", "name email")
        .sort({ createdAt: -1 });
      return tasks;
    } catch (error) {
      throw new Error(`Error fetching tasks by urgency: ${error.message}`);
    }
  }

  // Like/Unlike a task
  async likeTask(taskId, userId) {
    try {
      const task = await Task.findById(taskId).populate("createdBy");
      if (!task) {
        throw new Error("Task not found");
      }

      // Prevent users from liking their own tasks
      if (task.createdBy._id.toString() === userId) {
        throw new Error("You cannot like your own task");
      }

      // Check if user already liked the task
      const alreadyLiked = task.likedBy.includes(
        new mongoose.Types.ObjectId(userId)
      );

      if (alreadyLiked) {
        // Unlike the task
        task.likedBy.pull(new mongoose.Types.ObjectId(userId));
        task.likes = Math.max(0, task.likes - 1);

        // Decrease task creator's likes
        await User.findByIdAndUpdate(task.createdBy._id, {
          $inc: {
            totalLikes: -1,
          },
        });
      } else {
        // Like the task
        task.likedBy.push(new mongoose.Types.ObjectId(userId));
        task.likes += 1;

        // Increase task creator's likes
        await User.findByIdAndUpdate(task.createdBy._id, {
          $inc: {
            totalLikes: 1,
          },
        });
      }

      await task.save();

      // Return the updated task with populated fields
      const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "name email karmaPoints totalLikes")
        .populate("helpers.userId", "name email")
        .populate("likedBy", "name email");

      return {
        task: updatedTask,
        isLiked: !alreadyLiked,
        message: alreadyLiked ? "Task unliked" : "Task liked",
      };
    } catch (error) {
      throw new Error(`Error liking/unliking task: ${error.message}`);
    }
  }

  // Check if user has liked a task
  async hasUserLikedTask(taskId, userId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }
      return task.likedBy.includes(new mongoose.Types.ObjectId(userId));
    } catch (error) {
      throw new Error(`Error checking if user liked task: ${error.message}`);
    }
  }

  // Get task with populated helpers (for selection UI)
  async getTaskWithHelpers(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate(
          "helpers.userId",
          "name email address location karmaPoints totalLikes badges completedTasks reviews"
        )
        .populate(
          "selectedHelper",
          "name email address location karmaPoints totalLikes badges"
        )
        .populate("createdBy", "name email");

      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    } catch (error) {
      console.error("Error in getTaskWithHelpers:", error);
      throw error;
    }
  }

  // Select a helper for a task
  async selectHelper(taskId, helperUserId, creatorId) {
    try {
      // Validate task exists and user is creator
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      if (task.createdBy.toString() !== creatorId) {
        throw new Error("Only task creator can select helpers");
      }

      // Check if helper exists in helpers array
      const helperExists = task.helpers.some(
        (helper) => helper.userId.toString() === helperUserId
      );

      if (!helperExists) {
        throw new Error("Helper not found in task helpers");
      }

      // Update helper status to selected
      await Task.updateOne(
        { _id: taskId, "helpers.userId": helperUserId },
        {
          $set: {
            "helpers.$.status": SELECTED,
            "helpers.$.selectedAt": new Date(),
            selectedHelper: helperUserId,
            status: IN_PROGRESS,
          },
        }
      );

      // Reject other helpers
      await Task.updateOne(
        { _id: taskId },
        {
          $set: {
            "helpers.$[elem].status": REJECTED,
          },
        },
        {
          arrayFilters: [
            {
              "elem.userId": { $ne: new mongoose.Types.ObjectId(helperUserId) },
            },
          ],
        }
      );

      // Create notifications for helper selection
      await notificationService.notifyHelperSelected(
        taskId,
        helperUserId,
        creatorId
      );

      // Return updated task with populated data
      return await this.getTaskWithHelpers(taskId);
    } catch (error) {
      console.error("Error in selectHelper:", error);
      throw error;
    }
  }

  // Add new method for helper to mark task as completed
  async markTaskAsCompletedByHelper(taskId, userId) {
    try {
      // Validate task exists
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is the selected helper
      const isSelectedHelper = task.helpers.some(
        (helper) =>
          helper.userId.toString() === userId && helper.status === "selected"
      );

      if (!isSelectedHelper) {
        throw new Error("Only the selected helper can mark task as completed");
      }

      // Check if task is in progress
      if (task.status !== "in_progress") {
        throw new Error("Only tasks in progress can be marked as completed");
      }

      // Check if helper already marked as completed
      if (task.helperMarkedComplete) {
        throw new Error("Task has already been marked as completed by helper");
      }

      // Update task to helper completed status
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          helperMarkedComplete: true,
          helperCompletedAt: new Date(),
          status: AWAITING_APPROVAL,
        },
        { new: true, runValidators: true }
      ).populate("createdBy helpers.userId selectedHelper", "name email");

      // Update the specific helper's status separately
      await Task.updateOne(
        { _id: taskId, "helpers.userId": userId },
        {
          $set: {
            "helpers.$.status": "completed",
          },
        }
      );

      // Create notification for requester
      await notificationService.notifyHelperMarkedTaskComplete(taskId, userId);

      return updatedTask;
    } catch (error) {
      console.error("Error in markTaskAsCompletedByHelper:", error);
      throw error;
    }
  }

  // Add new method for requester to approve completion
  async approveTaskCompletion(
    taskId,
    requesterId,
    approved = true,
    notes = ""
  ) {
    try {
      // Validate task exists
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Check if user is the task creator
      if (task.createdBy.toString() !== requesterId) {
        throw new Error("Only the task creator can approve completion");
      }

      // Check if helper has marked task as completed
      if (!task.helperMarkedComplete) {
        throw new Error("Helper has not marked task as completed yet");
      }

      // Check if already approved/rejected
      if (
        task.requesterApproved !== null &&
        task.requesterApproved !== undefined
      ) {
        throw new Error("Task completion has already been reviewed");
      }

      // Check if task is awaiting approval
      if (task.status !== AWAITING_APPROVAL) {
        throw new Error("Task is not awaiting approval");
      }

      if (approved) {
        // Find the selected helper
        const selectedHelper = task.helpers.find(
          (helper) => helper.status === "completed"
        );

        if (!selectedHelper) {
          throw new Error("No helper has completed this task");
        }

        // Transfer karma points
        let karmaTransferResult = null;
        try {
          karmaTransferResult = await karmaService.transferKarmaPoints(
            taskId,
            task.createdBy.toString(),
            selectedHelper.userId.toString(),
            task.taskKarmaPoints
          );
          // Notify both users about karma transfer
          await notificationService.notifyKarmaTransferred({
            taskId: task._id,
            taskTitle: task.title,
            points: task.taskKarmaPoints,
            fromUserId: task.createdBy,
            toUserId: selectedHelper.userId,
          });
        } catch (karmaError) {
          console.error("Karma transfer failed:", karmaError);
          throw new Error(`Karma transfer failed: ${karmaError.message}`);
        }

        // Update task to completed status
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          {
            status: COMPLETED,
            completedAt: new Date(),
            requesterApproved: true,
            requesterApprovedAt: new Date(),
            completionNotes: notes,
          },
          { new: true, runValidators: true }
        ).populate("createdBy helpers.userId selectedHelper", "name email");

        // Create notification for task completion
        await notificationService.notifyTaskCompleted(taskId, requesterId);

        return {
          ...updatedTask.toObject(),
          karmaTransfer: karmaTransferResult,
        };
      } else {
        // Reject completion - task goes back to in_progress
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          {
            status: IN_PROGRESS,
            helperMarkedComplete: false,
            helperCompletedAt: null,
            requesterApproved: false,
            requesterApprovedAt: new Date(),
            completionNotes: notes,
          },
          { new: true, runValidators: true }
        ).populate("createdBy helpers.userId selectedHelper", "name email");

        // Reset the helper's status back to selected
        const selectedHelper = task.helpers.find(
          (helper) => helper.status === "completed"
        );
        if (selectedHelper) {
          await Task.updateOne(
            { _id: taskId, "helpers.userId": selectedHelper.userId },
            {
              $set: {
                "helpers.$.status": "selected",
              },
            }
          );
        }

        // Create notification for helper
        await notificationService.notifyTaskCompletionRejected(
          taskId,
          requesterId
        );

        return updatedTask;
      }
    } catch (error) {
      console.error("Error in approveTaskCompletion:", error);
      throw error;
    }
  }

  // Get category statistics sorted by recent usage (updated for new Category model)
  async getCategoryStatistics(userId = null) {
    try {
      // Use the categoryService for consistency
      return await categoryService.getCategoryStatistics(userId);
    } catch (error) {
      throw new Error(`Error fetching category statistics: ${error.message}`);
    }
  }

  // Get user's recently used categories (updated for new Category model)
  async getUserRecentCategories(userId, limit = 5) {
    try {
      const recentCategories = await Task.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        { $unwind: "$categoryInfo" },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            lastUsed: { $max: "$createdAt" },
            categoryInfo: { $first: "$categoryInfo" },
          },
        },
        {
          $sort: { lastUsed: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return recentCategories.map((cat) => ({
        _id: cat._id,
        name: cat.categoryInfo.name,
        displayName: cat.categoryInfo.displayName,
        icon: cat.categoryInfo.icon,
        count: cat.count,
        lastUsed: cat.lastUsed,
      }));
    } catch (error) {
      throw new Error(
        `Error fetching user recent categories: ${error.message}`
      );
    }
  }
}
module.exports = new TaskService();
