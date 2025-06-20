const mongoose = require("mongoose");
const { dbUrl, dbName } = require("./keys");

const dbConnect = async () => {
  console.log("dbUrl", dbUrl);
  console.log("dbName", dbName);
  try {
    const connectionString = dbUrl;

    if (!connectionString) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    const options = {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(connectionString, options);

    mongoose.connection.on("connected", () => {
      console.log(`Database connected at ${mongoose.connection.host}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    process.exit(1);
  }
};

module.exports = dbConnect;
