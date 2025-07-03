// backend/scripts/migrateCategories.js
const mongoose = require("mongoose");
const categoryService = require("../services/categoryService");
require("dotenv").config();

const migrateCategories = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    // First seed categories if they don't exist
    console.log("Ensuring categories exist...");
    await categoryService.seedDefaultCategories();

    // Then migrate existing tasks
    console.log("Migrating existing task categories...");
    const mapping = await categoryService.migrateLegacyCategories();

    console.log("Migration completed successfully!");
    console.log("Category mapping:", mapping);
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  migrateCategories();
}

module.exports = migrateCategories;
