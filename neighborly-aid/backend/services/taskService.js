const Task = require("../models/Task");

class TaskService {
  // Create a new task
  async createTask(taskData, userId) {
    const task = new Task({
      ...taskData,
      createdBy: userId,
    });
    return await task.save();
  }

  // Get all tasks with optional filters
  async getTasks(filters = {}) {
    return await Task.find(filters)
      .populate("createdBy", "name email karmaPoints totalLikes")
      .populate("helpers", "name email")
      .populate("likedBy", "name email")
      .sort({ createdAt: -1 });
  }

  // Get task by ID
  async getTaskById(taskId) {
    return await Task.findById(taskId)
      .populate("createdBy", "name email karmaPoints totalLikes")
      .populate("helpers", "name email")
      .populate("likedBy", "name email");
  }

  // Update task
  async updateTask(taskId, updateData) {
    return await Task.findByIdAndUpdate(
      taskId,
      { ...updateData },
      { new: true, runValidators: true }
    ).populate("createdBy helpers", "name email");
  }

  // Accept task
  async acceptTask(taskId, userId) {
    return await Task.findByIdAndUpdate(
      taskId,
      {
        helpers: userId,
        status: "IN_PROGRESS",
      },
      { new: true, runValidators: true }
    ).populate("createdBy helpers", "name email");
  }

  // Complete task
  async completeTask(taskId) {
    return await Task.findByIdAndUpdate(
      taskId,
      {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("createdBy helpers", "name email");
  }

  // Delete task
  async deleteTask(taskId) {
    return await Task.findByIdAndDelete(taskId);
  }

  // Get tasks by user (either created or accepted)
  async getUserTasks(userId, type = "created") {
    const filter =
      type === "created" ? { createdBy: userId } : { helpers: userId };

    return await Task.find(filter)
      .populate("createdBy helpers", "name email karmaPoints totalLikes")
      .populate("likedBy", "name email")
      .sort({ createdAt: -1 });
  }

  // Get tasks by category
  async getTasksByCategory(category) {
    try {
      const tasks = await Task.find({ category })
        .populate("createdBy", "name email")
        .populate("helpers", "name email")
        .sort({ createdAt: -1 });
      return tasks;
    } catch (error) {
      throw new Error(`Error fetching tasks by category: ${error.message}`);
    }
  }

  // Get tasks by urgency
  async getTasksByUrgency(urgency) {
    try {
      const tasks = await Task.find({ urgency })
        .populate("createdBy", "name email")
        .populate("helpers", "name email")
        .sort({ createdAt: -1 });
      return tasks;
    } catch (error) {
      throw new Error(`Error fetching tasks by urgency: ${error.message}`);
    }
  }

  // Like/Unlike a task
  async likeTask(taskId, userId) {
    const User = require("../models/User");

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
      const alreadyLiked = task.likedBy.includes(userId);

      if (alreadyLiked) {
        // Unlike the task
        task.likedBy.pull(userId);
        task.likes = Math.max(0, task.likes - 1);

        // Decrease task creator's karma and likes
        await User.findByIdAndUpdate(task.createdBy._id, {
          $inc: {
            karmaPoints: -1,
            totalLikes: -1,
          },
        });
      } else {
        // Like the task
        task.likedBy.push(userId);
        task.likes += 1;

        // Increase task creator's karma and likes
        await User.findByIdAndUpdate(task.createdBy._id, {
          $inc: {
            karmaPoints: 1,
            totalLikes: 1,
          },
        });
      }

      await task.save();

      // Return the updated task with populated fields
      const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "name email karmaPoints totalLikes")
        .populate("helpers", "name email")
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
      return task.likedBy.includes(userId);
    } catch (error) {
      throw new Error(`Error checking if user liked task: ${error.message}`);
    }
  }
}
module.exports = new TaskService();
