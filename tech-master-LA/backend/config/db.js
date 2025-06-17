// tech-master-LA/backend/config/db.js
const mongoose = require("mongoose");
const { url } = require("./keys");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(url);
    console.log("Successfully connected to MongoDB");
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    return false;
  }
};

module.exports = connectDB;
