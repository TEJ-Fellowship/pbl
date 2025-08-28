const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = async () => {
  try {
    const password = process.env.MONGODB_PASSWORD;
    const mongoURI = `mongodb+srv://pustakverse:${password}@cluster0.dkor4to.mongodb.net/Pustakverse?retryWrites=true&w=majority&appName=Cluster0`;
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
module.exports = connectDB;
