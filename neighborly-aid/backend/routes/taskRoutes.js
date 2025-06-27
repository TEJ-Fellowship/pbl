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
  getTaskSuggestions,
  likeTask,
} = require("../controllers/taskController");
const auth = require("../middlewares/auth-middleware");

// Debug route to test authentication
router.get("/debug/auth", auth, (req, res) => {
  res.json({
    message: "Authentication working!",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Public routes (no auth required)
router.post("/suggestions", getTaskSuggestions);
router.get("/", getTasks); // Public - anyone can view tasks

// Protected routes (auth required)
router.post("/", auth, createTask); // Create task - requires auth
router.get("/my-tasks", auth, getUserTasks); // Get user's tasks - requires auth
router.get("/:id", getTaskById); // Get specific task - public for now
router.put("/:id", auth, updateTask); // Update task - requires auth
router.post("/:id/accept", auth, acceptTask); // Accept task - requires auth
router.post("/:id/complete", auth, completeTask); // Complete task - requires auth
router.post("/:id/like", auth, likeTask); // Like/Unlike task - requires auth
router.delete("/:id", auth, deleteTask); // Delete task - requires auth

// Category and urgency routes
router.get("/category/:category", getTasksByCategory);
router.get("/urgency/:urgency", getTasksByUrgency);

module.exports = router;
