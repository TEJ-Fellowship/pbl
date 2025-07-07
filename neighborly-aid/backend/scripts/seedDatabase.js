// backend/scripts/seedDatabase.js
const mongoose = require("mongoose");
const categoryService = require("../services/categoryService");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    // Seed categories
    console.log("Seeding categories...");
    await categoryService.seedDefaultCategories();

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
