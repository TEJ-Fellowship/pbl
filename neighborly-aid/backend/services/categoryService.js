const mongoose = require("mongoose");
const Category = require("../models/Category");
const Task = require("../models/Task");

class CategoryService {
  // Get all active categories sorted by usage and custom order
  async getCategories(includeInactive = false) {
    try {
      const filter = includeInactive ? {} : { isActive: true };

      const categories = await Category.find(filter).sort({
        sortOrder: 1,
        usageCount: -1,
        lastUsed: -1,
        displayName: 1,
      });

      return categories;
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      return category;
    } catch (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }
  }

  // Get category by name
  async getCategoryByName(name) {
    try {
      const category = await Category.findOne({
        name: name,
        isActive: true,
      });
      return category;
    } catch (error) {
      throw new Error(`Error fetching category by name: ${error.message}`);
    }
  }

  // Create new category
  async createCategory(categoryData, userId = null) {
    try {
      const category = new Category({
        ...categoryData,
        createdBy: userId,
      });

      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Category name already exists");
      }
      throw new Error(`Error creating category: ${error.message}`);
    }
  }

  // Update category
  async updateCategory(categoryId, updateData) {
    try {
      const category = await Category.findByIdAndUpdate(
        categoryId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Category name already exists");
      }
      throw new Error(`Error updating category: ${error.message}`);
    }
  }

  // Delete category (soft delete by setting isActive to false)
  async deleteCategory(categoryId) {
    try {
      // Check if category is being used in any tasks
      const taskCount = await Task.countDocuments({ category: categoryId });

      if (taskCount > 0) {
        // Soft delete - just mark as inactive
        const category = await Category.findByIdAndUpdate(
          categoryId,
          { isActive: false, updatedAt: Date.now() },
          { new: true }
        );

        if (!category) {
          throw new Error("Category not found");
        }

        return {
          message: `Category marked as inactive. ${taskCount} tasks are still using this category.`,
          category,
        };
      } else {
        // Hard delete if no tasks are using it
        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
          throw new Error("Category not found");
        }

        return {
          message: "Category deleted successfully",
          category,
        };
      }
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }

  // Update category usage statistics
  async updateCategoryUsage(categoryId) {
    try {
      await Category.findByIdAndUpdate(categoryId, {
        $inc: { usageCount: 1 },
        lastUsed: new Date(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error(`Error updating category usage: ${error.message}`);
      // Don't throw error as this is not critical
    }
  }

  // Get category statistics with task counts
  async getCategoryStatistics(userId = null) {
    try {
      const matchCondition = userId
        ? { createdBy: new mongoose.Types.ObjectId(userId) }
        : {};

      // Get category usage from tasks
      const taskStats = await Task.aggregate([
        { $match: matchCondition },
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
            avgKarmaPoints: { $avg: "$taskKarmaPoints" },
            categoryInfo: { $first: "$categoryInfo" },
          },
        },
        {
          $sort: { lastUsed: -1, count: -1 },
        },
      ]);

      // Get all active categories
      const allCategories = await this.getCategories();

      // Merge statistics with all categories
      const categoriesWithStats = allCategories.map((category) => {
        const stats = taskStats.find(
          (stat) => stat._id.toString() === category._id.toString()
        );

        return {
          _id: category._id,
          name: category.name,
          displayName: category.displayName,
          icon: category.icon,
          description: category.description,
          color: category.color,
          count: stats ? stats.count : 0,
          lastUsed: stats ? stats.lastUsed : null,
          avgKarmaPoints: stats ? Math.round(stats.avgKarmaPoints || 0) : 0,
          hasBeenUsed: Boolean(stats),
          sortOrder: category.sortOrder,
          usageCount: category.usageCount,
        };
      });

      // Sort: used categories first (by lastUsed desc), then unused by sortOrder
      const sortedCategories = categoriesWithStats.sort((a, b) => {
        if (a.hasBeenUsed && !b.hasBeenUsed) return -1;
        if (!a.hasBeenUsed && b.hasBeenUsed) return 1;

        if (a.hasBeenUsed && b.hasBeenUsed) {
          const dateComparison = new Date(b.lastUsed) - new Date(a.lastUsed);
          return dateComparison !== 0 ? dateComparison : b.count - a.count;
        }

        return a.sortOrder - b.sortOrder;
      });

      return {
        categories: sortedCategories,
        totalTasks: taskStats.reduce((sum, stat) => sum + stat.count, 0),
        totalCategories: taskStats.length,
      };
    } catch (error) {
      throw new Error(`Error fetching category statistics: ${error.message}`);
    }
  }

  // Seed default categories
  async seedDefaultCategories() {
    try {
      const existingCategories = await Category.countDocuments();

      if (existingCategories > 0) {
        console.log("Categories already exist, skipping seed");
        return;
      }

      const defaultCategories = [
        {
          name: "home-maintenance",
          displayName: "Home Maintenance",
          icon: "🏠",
          sortOrder: 1,
        },
        { name: "cleaning", displayName: "Cleaning", icon: "🧹", sortOrder: 2 },
        { name: "shopping", displayName: "Shopping", icon: "🛒", sortOrder: 3 },
        {
          name: "transportation",
          displayName: "Transportation",
          icon: "🚗",
          sortOrder: 4,
        },
        { name: "moving", displayName: "Moving", icon: "📦", sortOrder: 5 },
        {
          name: "gardening",
          displayName: "Gardening",
          icon: "🌱",
          sortOrder: 6,
        },
        {
          name: "technology",
          displayName: "Technology",
          icon: "💻",
          sortOrder: 7,
        },
        { name: "pet-care", displayName: "Pet Care", icon: "🐾", sortOrder: 8 },
        { name: "cooking", displayName: "Cooking", icon: "👨‍🍳", sortOrder: 9 },
        {
          name: "elderly-care",
          displayName: "Elderly Care",
          icon: "👵",
          sortOrder: 10,
        },
        {
          name: "childcare",
          displayName: "Childcare",
          icon: "👶",
          sortOrder: 11,
        },
        {
          name: "tutoring",
          displayName: "Tutoring",
          icon: "📚",
          sortOrder: 12,
        },
        { name: "repairs", displayName: "Repairs", icon: "🔧", sortOrder: 13 },
        {
          name: "delivery",
          displayName: "Delivery",
          icon: "📋",
          sortOrder: 14,
        },
        {
          name: "event-help",
          displayName: "Event Help",
          icon: "🎉",
          sortOrder: 15,
        },
        { name: "sports", displayName: "Sports", icon: "⚽", sortOrder: 16 },
        {
          name: "community-service",
          displayName: "Community Service",
          icon: "🤝",
          sortOrder: 17,
        },
        { name: "other", displayName: "Other", icon: "💝", sortOrder: 18 },
      ];

      await Category.insertMany(defaultCategories);
      console.log("Default categories seeded successfully");

      return defaultCategories;
    } catch (error) {
      throw new Error(`Error seeding categories: ${error.message}`);
    }
  }

  // Migrate existing task categories to new system
  async migrateLegacyCategories() {
    try {
      // Get all unique categories from existing tasks
      const existingCategories = await Task.distinct("category");

      console.log("Found existing categories:", existingCategories);

      // Map legacy category names to proper categories
      const categoryMapping = {};

      for (const oldCategory of existingCategories) {
        if (typeof oldCategory === "string") {
          // Try to find matching category by name
          let category = await Category.findOne({
            $or: [
              { name: oldCategory.toLowerCase().replace(/\s+/g, "-") },
              { displayName: { $regex: new RegExp(oldCategory, "i") } },
            ],
          });

          // If not found, create a new category
          if (!category) {
            const name = oldCategory.toLowerCase().replace(/\s+/g, "-");
            const displayName = oldCategory.replace(/^\w/, (c) =>
              c.toUpperCase()
            );

            category = await this.createCategory({
              name,
              displayName,
              icon: "💝", // Default icon
              description: `Migrated category: ${oldCategory}`,
              sortOrder: 999, // Put migrated categories at the end
            });

            console.log(`Created new category: ${displayName}`);
          }

          categoryMapping[oldCategory] = category._id;
        }
      }

      // Update all tasks to use ObjectId references
      for (const [oldCategory, newCategoryId] of Object.entries(
        categoryMapping
      )) {
        await Task.updateMany(
          { category: oldCategory },
          {
            category: newCategoryId,
            categoryName: oldCategory, // Keep old name for reference during migration
          }
        );

        console.log(
          `Updated tasks with category "${oldCategory}" to use ObjectId`
        );
      }

      console.log("Category migration completed successfully");
      return categoryMapping;
    } catch (error) {
      throw new Error(`Error migrating categories: ${error.message}`);
    }
  }
}

module.exports = new CategoryService();
