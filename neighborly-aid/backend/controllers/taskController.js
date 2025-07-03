const taskService = require("../services/taskService");
const geminiService = require("../services/geminiService");
const User = require("../models/User");

// Create new task
const createTask = async (req, res) => {
  try {
    console.log("=== Create Task Debug ===");
    console.log("Request body:", req.body);
    console.log("Authenticated user:", req.user);

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.log("No authenticated user found");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate karma points
    const taskKarmaPoints = parseInt(req.body.taskKarmaPoints) || 0;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (taskKarmaPoints > user.karmaPoints) {
      return res.status(400).json({
        error: `You only have ${user.karmaPoints} karma points, but you're trying to offer ${taskKarmaPoints}. Please reduce the karma points or earn more karma.`,
      });
    }

    if (taskKarmaPoints < 10) {
      return res.status(400).json({
        error: "Minimum karma points required is 10.",
      });
    }

    if (taskKarmaPoints > 5000) {
      return res.status(400).json({
        error: "Maximum karma points allowed is 5000.",
      });
    }

    console.log("This worksss", req.user.id);

    // Add user ID to task data
    const taskData = {
      ...req.body,
      createdBy: req.user.id,
    };

    console.log("Task data with user ID:", taskData);

    const task = await taskService.createTask(taskData, req.user.id);

    console.log("Task created:", task);

    // Populate the created task with user info
    const populatedTask = await taskService.getTaskById(task._id);

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Get all tasks
const getTasks = async (req, res) => {
  try {
    const filters = req.query; // Handle any query parameters
    const tasks = await taskService.getTasks(filters);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    console.log("=== Update Task Debug ===");
    console.log("Task ID:", req.params.id);
    console.log("User ID:", req.user.id);
    console.log("Update data:", req.body);

    const task = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id
    );
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Accept task
const acceptTask = async (req, res) => {
  console.log("=== Accept Task Debug ===");
  console.log("Task ID:", req.params.id);
  console.log("User ID:", req.user.id);
  console.log("Request body:", req.body);

  try {
    const task = await taskService.acceptTask(req.params.id, req.user.id);
    console.log("Task accepted after service:", task);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Complete task
const completeTask = async (req, res) => {
  try {
    const task = await taskService.completeTask(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove help
const removeHelp = async (req, res) => {
  console.log("=== Remove Help Debug ===");
  console.log("Task ID:", req.params.id);
  console.log("User ID:", req.user.id);

  try {
    const task = await taskService.removeHelp(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.user.id);
    res.json({
      message: "Task deleted successfully",
      refundedKarma: result.refundedKarma,
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel task
const cancelTask = async (req, res) => {
  try {
    const result = await taskService.cancelTask(req.params.id, req.user.id);
    res.json({
      message: "Task cancelled successfully",
      refundedKarma: result.refundedKarma,
    });
  } catch (error) {
    console.error("Cancel task error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get user's tasks
const getUserTasks = async (req, res) => {
  try {
    console.log("=== Get User Tasks Debug ===");
    console.log("Authenticated user:", req.user);
    console.log("User ID:", req.user.id);

    const type = req.query.type || "created"; // 'created' or 'accepted'
    const tasks = await taskService.getUserTasks(req.user.id, type);

    console.log("Found tasks:", tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add this new controller function
const getTasksByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    const tasks = await taskService.getTasksByCategory(category);

    if (!tasks.length) {
      return res
        .status(404)
        .json({ message: `No tasks found in category: ${category}` });
    }

    res.json({
      count: tasks.length,
      category,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get tasks by urgency
const getTasksByUrgency = async (req, res) => {
  try {
    const { urgency } = req.params;

    if (!urgency) {
      return res.status(400).json({ error: "Urgency parameter is required" });
    }

    const tasks = await taskService.getTasksByUrgency(urgency);

    if (!tasks.length) {
      return res
        .status(404)
        .json({ message: `No tasks found in urgency: ${urgency}` });
    }

    res.json({
      count: tasks.length,
      urgency,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskSuggestions = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required for suggestions",
      });
    }

    const suggestions = await geminiService.generateTaskSuggestions(
      title,
      description
    );

    if (!suggestions.success) {
      return res.status(500).json({ error: suggestions.error });
    }

    res.json(suggestions.data);
  } catch (error) {
    console.error("Task Suggestions Error:", error);
    res.status(500).json({ error: "Failed to get task suggestions" });
  }
};

// Like/Unlike a task
const likeTask = async (req, res) => {
  try {
    console.log("=== Like Task Debug ===");
    console.log("Task ID:", req.params.id);
    console.log("User ID:", req.user.id);

    const result = await taskService.likeTask(req.params.id, req.user.id);

    console.log("Like result:", result.message);
    res.json(result);
  } catch (error) {
    console.error("Like task error:", error);

    if (error.message === "You cannot like your own task") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

// Get task with helpers (for selection UI)
const getTaskWithHelpers = async (req, res) => {
  try {
    const task = await taskService.getTaskWithHelpers(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Select helper for task
const selectHelper = async (req, res) => {
  try {
    const { helperId } = req.params;
    const task = await taskService.selectHelper(
      req.params.id,
      helperId,
      req.user.id
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get category statistics
const getCategoryStatistics = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || null;
    const stats = await taskService.getCategoryStatistics(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's recent categories
const getUserRecentCategories = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = parseInt(req.query.limit) || 5;
    const recentCategories = await taskService.getUserRecentCategories(
      req.user.id,
      limit
    );
    res.json(recentCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add new controller methods
const markTaskAsCompletedByHelper = async (req, res) => {
  try {
    const task = await taskService.markTaskAsCompletedByHelper(
      req.params.id,
      req.user.id
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const approveTaskCompletion = async (req, res) => {
  try {
    const { approved, notes } = req.body;
    const task = await taskService.approveTaskCompletion(
      req.params.id,
      req.user.id,
      approved,
      notes
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  acceptTask,
  completeTask,
  removeHelp,
  deleteTask,
  cancelTask,
  getUserTasks,
  getTasksByCategory,
  getTasksByUrgency,
  getTaskSuggestions,
  likeTask,
  getTaskWithHelpers,
  selectHelper,
  markTaskAsCompletedByHelper,
  approveTaskCompletion,
};
