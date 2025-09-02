import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startSever = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => console.log("MongoDb connected!!!"))
      .catch((err) => console.log("MongoDb connection error:", err));

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log("Server running on port: ", PORT);
    });
  } catch (error) {
    console.log("Error while connecting to mongodb, ", error);
    process.exit(1);
  }
};

startSever();
