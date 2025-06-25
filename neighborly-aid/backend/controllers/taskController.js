const taskService = require("../services/taskService");

// Create new task
const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    res.status(201).json(task);
  } catch (error) {
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
    const task = await taskService.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Accept task
const acceptTask = async (req, res) => {
  try {
    const task = await taskService.acceptTask(req.params.id, req.user._id);
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
    const task = await taskService.completeTask(req.params.id);
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
    const task = await taskService.deleteTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's tasks
const getUserTasks = async (req, res) => {
  try {
    const type = req.query.type || "created"; // 'created' or 'accepted'
    const tasks = await taskService.getUserTasks(req.user._id, type);
    res.json(tasks);
  } catch (error) {
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

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  acceptTask,
  completeTask,
  deleteTask,
  getUserTasks,
  getTasksByCategory,
  getTasksByUrgency,
};
