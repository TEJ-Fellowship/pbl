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
} = require("../utils/constants");

class TaskService {
  // Create a new task
  async createTask(taskData, userId) {
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
      .populate("likedBy", "name email");
  }

  // Update task
  async updateTask(taskId, updateData) {
    return await Task.findByIdAndUpdate(
      taskId,
      { ...updateData },
      { new: true, runValidators: true }
    ).populate("createdBy helpers.userId", "name email");
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
  async deleteTask(taskId) {
    return await Task.findByIdAndDelete(taskId);
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
