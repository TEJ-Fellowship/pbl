const categoryService = require("../services/categoryService");

// Get all categories
const getCategories = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const categories = await categoryService.getCategories(includeInactive);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.user?.id
    );
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get category statistics
const getCategoryStatistics = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || null;
    const stats = await categoryService.getCategoryStatistics(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Seed default categories (admin only)
const seedCategories = async (req, res) => {
  try {
    const categories = await categoryService.seedDefaultCategories();
    res.json({
      message: "Categories seeded successfully",
      categories,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Migrate legacy categories (admin only)
const migrateCategories = async (req, res) => {
  try {
    const mapping = await categoryService.migrateLegacyCategories();
    res.json({
      message: "Categories migrated successfully",
      mapping,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStatistics,
  seedCategories,
  migrateCategories,
};
