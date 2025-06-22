const mongoUrl = require("./urlConfig");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");

    //connection to database
    await mongoose.connect(mongoUrl.MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

module.exports = connectDB;
