import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/shopify-support-agent";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // How long to wait for server selection
      socketTimeoutMS: 45000, // How long to wait for socket operations
    });
    // Disable mongoose buffering (set globally, not in connect options)
    mongoose.set("bufferCommands", false);
    console.log("✅ MongoDB connected successfully with connection pooling");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error.message);
  }
};

export default mongoose;
