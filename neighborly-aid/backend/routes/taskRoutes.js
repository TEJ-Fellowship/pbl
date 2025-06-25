const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/taskController");
const auth = require("../middlewares/auth-middleware");

// Apply auth middleware to all routes
router.use(auth);

// Create a new task
router.post("/", createTask);

// Get all tasks
router.get("/", getTasks);

// Get user's tasks (created or accepted)
router.get("/my-tasks", getUserTasks);

// Get specific task by ID
router.get("/:id", getTaskById);

// Update task
router.put("/:id", updateTask);

// Accept task
router.post("/:id/accept", acceptTask);

// Complete task
router.post("/:id/complete", completeTask);

// Delete task
router.delete("/:id", deleteTask);

// Get tasks by category
router.get("/category/:category", getTasksByCategory);

// Get tasks by urgency
router.get("/urgency/:urgency", getTasksByUrgency);

module.exports = router;
