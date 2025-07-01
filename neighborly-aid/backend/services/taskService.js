const Task = require("../models/Task");
const User = require("../models/User");

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
      .populate("helpers.userId", "name email")
      .populate("likedBy", "name email")
      .sort({ createdAt: -1 });
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
      if (task.status !== 'open') {
        throw new Error("Task is not available for help");
      }
  
      // Check if user is not the task creator
      if (task.createdBy.toString() === userId) {
        throw new Error("You cannot help with your own task");
      }
  
      // Check if user already helping
      const alreadyHelping = task.helpers.some(helper => 
        helper.userId.toString() === userId
      );
      if (alreadyHelping) {
        throw new Error("You are already helping with this task");
      }
  
      // Update task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          $push: {
            helpers: {
              userId,
              acceptedAt: new Date(),
              status: "active",
            }
          },
          status: "in-progress",
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "createdBy", select: "name email" },
        { path: "helpers.userId", select: "name email" },
      ]);
  
      return updatedTask;
      
    } catch (error) {
      console.error("Error in acceptTask:", error);
      throw error;
    }
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
    ).populate("createdBy helpers.userId", "name email");
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
      .populate("createdBy helpers.userId", "name email karmaPoints totalLikes")
      .populate("likedBy", "name email")
      .sort({ createdAt: -1 });
  }

  // Get tasks by category
  async getTasksByCategory(category) {
    try {
      const tasks = await Task.find({ category })
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
      const tasks = await Task.find({ urgency })
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
      const alreadyLiked = task.likedBy.includes(userId);

      if (alreadyLiked) {
        // Unlike the task
        task.likedBy.pull(userId);
        task.likes = Math.max(0, task.likes - 1);

        // Decrease task creator's likes
        await User.findByIdAndUpdate(task.createdBy._id, {
          $inc: {
            totalLikes: -1,
          },
        });
      } else {
        // Like the task
        task.likedBy.push(userId);
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
      return task.likedBy.includes(userId);
    } catch (error) {
      throw new Error(`Error checking if user liked task: ${error.message}`);
    }
  }
}
module.exports = new TaskService();
