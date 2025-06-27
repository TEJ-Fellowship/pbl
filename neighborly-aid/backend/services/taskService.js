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
      .populate("createdBy", "name email")
      .populate("helpers", "name email")
      .sort({ createdAt: -1 });
  }

  // Get task by ID
  async getTaskById(taskId) {
    return await Task.findById(taskId)
      .populate("createdBy", "name email")
      .populate("helpers", "name email");
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
      .populate("createdBy helpers", "name email")
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
}
module.exports = new TaskService();
