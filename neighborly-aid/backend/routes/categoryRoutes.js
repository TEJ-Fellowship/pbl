const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStatistics,
  seedCategories,
  migrateCategories,
} = require("../controllers/categoryController");
const auth = require("../middlewares/auth-middleware");

// Public routes
router.get("/", getCategories); // Get all active categories
router.get("/statistics", getCategoryStatistics); // Get category statistics
router.get("/:id", getCategoryById); // Get category by ID

// Protected routes (require authentication)
router.post("/", auth, createCategory); // Create category
router.put("/:id", auth, updateCategory); // Update category
router.delete("/:id", auth, deleteCategory); // Delete category

// Admin routes (you might want to add admin middleware)
router.post("/seed", seedCategories); // Seed default categories
router.post("/migrate", migrateCategories); // Migrate legacy categories

module.exports = router;
